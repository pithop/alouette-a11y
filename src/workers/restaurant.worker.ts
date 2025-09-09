// src/workers/restaurant.worker.ts
import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright';
import { Client } from "@googlemaps/google-maps-services-js";
import { generateRestaurantReportWithAI, RestaurantData, RestaurantReport } from './restaurant.ai.processor';
import { RestaurantReportProcessor } from './restaurant.report.processor';

const prisma = new PrismaClient();
const redisUrl = new URL(process.env.REDIS_URL || 'redis://localhost:6379');
const connection = { host: redisUrl.hostname, port: Number(redisUrl.port) };
const googleMapsClient = new Client({});

console.log('Restaurant worker is starting...');

const worker = new Worker('restaurant-audits', async (job) => {
    const { restaurantId, auditId } = job.data;
    console.log(`Processing audit ${auditId} for restaurantId: ${restaurantId}`);
    
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) throw new Error(`Restaurant with id ${restaurantId} not found.`);

    try {
        await prisma.restaurantAudit.update({ where: { id: auditId }, data: { status: 'RUNNING' } });
        const collectedData: RestaurantData = { googleData: {}, websiteData: { url: restaurant.website || undefined } };
        
        console.log(`[${restaurant.name}] Fetching Google Places data...`);
        const findPlaceRequest = await googleMapsClient.findPlaceFromText({
            params: { input: `${restaurant.name} ${restaurant.address || 'Paris'}`, inputtype: 'textquery', fields: ['place_id'], key: process.env.GOOGLE_PLACES_API_KEY! },
        });

        const placeId = findPlaceRequest.data.candidates[0]?.place_id;

        if (placeId) {
            const detailsRequest = await googleMapsClient.placeDetails({
                params: {
                    place_id: placeId,
                    fields: ['name', 'rating', 'user_ratings_total', 'formatted_address', 'website', 'reviews'],
                    language: 'fr',
                    key: process.env.GOOGLE_PLACES_API_KEY!,
                },
            });
            const details = detailsRequest.data.result;
            collectedData.googleData = { 
                name: details.name, 
                rating: details.rating, 
                reviewCount: details.user_ratings_total,
                address: details.formatted_address,
                reviews: details.reviews?.map(r => r.text).filter(Boolean) as string[]
            };
            if (!restaurant.website && details.website) {
                collectedData.websiteData.url = details.website;
            }
        }
        
        if (collectedData.websiteData.url) {
            console.log(`[${restaurant.name}] Scraping website: ${collectedData.websiteData.url}`);
            const browser = await chromium.launch({ args: ['--no-sandbox'] });
            try {
                const page = await browser.newPage();
                await page.goto(collectedData.websiteData.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
                const links = await page.$$eval('a', (anchors) => anchors.map(a => a.href));
                
                collectedData.websiteData.hasInstagram = links.some(l => l.includes('instagram.com'));
                collectedData.websiteData.hasFacebook = links.some(l => l.includes('facebook.com'));
                collectedData.websiteData.hasTikTok = links.some(l => l.includes('tiktok.com'));
                collectedData.websiteData.hasTheFork = links.some(l => l.includes('thefork.com') || l.includes('lafourchette.com'));
                collectedData.websiteData.hasUberEats = links.some(l => l.includes('ubereats.com'));

                await browser.close();
            } catch (e) {
                console.warn(`Could not scrape ${collectedData.websiteData.url}:`, e instanceof Error ? e.message : e);
                if (browser) await browser.close();
            }
        }

        console.log(`[${restaurant.name}] Generating AI report...`);
        const reportJson = await generateRestaurantReportWithAI(collectedData);

        console.log(`[${restaurant.name}] Generating PDF and preparing email to ${restaurant.email}...`);
        const processor = new RestaurantReportProcessor();
        const pdfBuffer = await processor.generatePdf(reportJson, restaurant.name);
        
        if(restaurant.email) {
          await processor.sendEmail(restaurant.email, restaurant.name, reportJson, pdfBuffer);
        } else {
          console.warn(`[${restaurant.name}] No email found, skipping send.`);
        }
        
        await prisma.restaurantAudit.update({
            where: { id: auditId },
            data: { status: 'COMPLETED', googleRating: collectedData.googleData.rating, googleReviewCount: collectedData.googleData.reviewCount, reportJson: reportJson as any },
        });

        console.log(`✅ Successfully processed and sent audit for ${restaurant.name}`);

    } catch (error) {
        let errorMessage = 'An unknown error occurred';
        if (error instanceof Error) {
            errorMessage = error.message;
            if ('response' in error && (error as any).response?.data?.error_message) {
                errorMessage = `Google API Error: ${(error as any).response.data.error_message}`;
            }
        }
        console.error(`❌ Failed to process audit for ${restaurant.name}: ${errorMessage}`);
        await prisma.restaurantAudit.update({ where: { id: auditId }, data: { status: 'FAILED' } });
    }
}, { connection, concurrency: 1 });

worker.on('failed', (job, err) => {
    if (job) console.error(`Job ${job.id} for restaurant failed with ${err.message}`);
});

console.log('Restaurant worker is listening for jobs...');