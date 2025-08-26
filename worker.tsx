// worker.tsx (Final Corrected Version)
import React from 'react'; // <--- ADD THIS LINE
import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';
import { Resend } from 'resend';
import { rgaaMap } from './src/lib/rgaa-map';
import { AxeResults, Result as AxeResult } from 'axe-core';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReportTemplate } from './src/app/components/ReportTemplate';
import { EmailTemplate } from './src/app/components/EmailTemplate';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);
const redisUrl = new URL(process.env.REDIS_URL || 'redis://localhost:6379');
const connection = { host: redisUrl.hostname, port: Number(redisUrl.port) };

console.log('Worker is starting...');

const worker = new Worker('scans', async (job) => {
    if (job.name === 'generate-full-report') {
        const { scanId } = job.data;
        let browser;
        try {
            console.log(`Processing job for scanId: ${scanId}`);
            await prisma.scan.update({ where: { id: scanId }, data: { status: 'RUNNING_FULL' } });

            const scan = await prisma.scan.findUnique({ where: { id: scanId }, include: { site: true } });
            if (!scan || !scan.userEmail) throw new Error('Scan or user email not found');

            browser = await chromium.launch();
            const context = await browser.newContext();
            const allViolations: AxeResult[] = [];
            const visited = new Set<string>();
            const toVisit = [scan.site.url];
            let pagesCrawled = 0;
            const axeCoreScript = await fs.readFile(path.resolve('./node_modules/axe-core/axe.min.js'), 'utf-8');

            while(toVisit.length > 0 && pagesCrawled < 5) {
                const currentUrl = toVisit.pop()!;
                if (visited.has(currentUrl)) continue;
                console.log(`Scanning page: ${currentUrl}`);
                visited.add(currentUrl);
                pagesCrawled++;
                const page = await context.newPage();
                await page.goto(currentUrl, { waitUntil: 'networkidle' });
                await page.evaluate(axeCoreScript);
                const results = await page.evaluate(() => (window as any).axe.run()) as AxeResults;
                allViolations.push(...results.violations);
                const links = await page.$$eval('a[href]', (anchors, baseUrl) => 
                    anchors
                        .map(a => (a as HTMLAnchorElement).href)
                        .filter(href => href.startsWith(baseUrl)),
                    scan.site.url
                );
                links.forEach(link => {
                    if(!visited.has(link)) toVisit.push(link);
                });
                await page.close();
            }

            const mappedViolations = allViolations.map(v => ({
                ...v,
                rgaa: rgaaMap[v.id] || { rgaa: 'N/A', name: 'Non Mappé' }
            }));
            const finalResult = { totalViolations: mappedViolations.length, violations: mappedViolations };

            await prisma.scan.update({
                where: { id: scanId },
                data: { status: 'COMPLETED_FULL', resultJson: finalResult as any }
            });

            const pageForPdf = await context.newPage();
            const reportHtml = renderToStaticMarkup(<ReportTemplate siteUrl={scan.site.url} results={finalResult} />);
            await pageForPdf.setContent(reportHtml, { waitUntil: 'networkidle' });
            const pdfBuffer = await pageForPdf.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }});

            const score = Math.max(0, 100 - finalResult.violations.length * 5);
            
            const { data, error } = await resend.emails.send({
              from: 'Alouette A11Y <onboarding@resend.dev>',
              to: scan.userEmail,
              subject: `Votre rapport d'audit RGAA pour ${scan.site.url} est prêt !`,
              react: <EmailTemplate 
                        siteUrl={scan.site.url} 
                        score={score}
                        totalViolations={finalResult.totalViolations}
                     />,
              attachments: [{ filename: 'rapport-accessibilite.pdf', content: pdfBuffer }],
            });

            if (error) { throw error; }

            await prisma.scan.update({ where: { id: scanId }, data: { status: 'DELIVERED' } });
            console.log(`Successfully processed and delivered report for scanId: ${scanId}`);

        } catch (error: any) {
            console.error('--- DETAILED JOB FAILURE ---');
            console.error(error); 
            console.error('--------------------------');
            await prisma.scan.update({ where: { id: scanId }, data: { status: 'FAILED' } });
        } finally {
            if (browser) await browser.close();
        }
    }
}, { connection });

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed with ${err.message}`);
});