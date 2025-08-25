// worker.ts (Fully Corrected)
import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';
import { Resend } from 'resend';
import { rgaaMap } from './src/lib/rgaa-map';
import { AxeResults, Result as AxeResult } from 'axe-core';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);
// Ensure REDIS_URL is defined in .env
const redisUrl = new URL(process.env.REDIS_URL || 'redis://localhost:6379');
const connection = { host: redisUrl.hostname, port: Number(redisUrl.port) };

console.log('Worker is starting...');

const worker = new Worker('scans', async (job) => {
    if (job.name === 'generate-full-report') {
        const { scanId } = job.data;
        console.log(`Processing job for scanId: ${scanId}`);

        try {
            await prisma.scan.update({ where: { id: scanId }, data: { status: 'RUNNING_FULL' } });

            const scan = await prisma.scan.findUnique({ where: { id: scanId }, include: { site: true } });
            if (!scan) throw new Error('Scan not found');

            // --- 1. Crawl & Scan up to 5 pages ---
            const browser = await chromium.launch();
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

                // Find new internal links
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

            // --- 2. Process results with RGAA mapping ---
            const mappedViolations = allViolations.map(v => ({
                ...v,
                rgaa: rgaaMap[v.id] || { rgaa: 'N/A', name: 'Non Mappé' }
            }));
            const finalResult = { totalViolations: mappedViolations.length, violations: mappedViolations };

            await prisma.scan.update({
                where: { id: scanId },
                data: {
                    status: 'COMPLETED_FULL',
                    resultJson: finalResult as any,
                }
            });

            // --- 3. Generate PDF (simplified example) ---
            const pageForPdf = await context.newPage();
            // For a real report, you'd build a nice HTML template here
            const reportHtml = `
                <html>
                    <body>
                        <h1>Rapport d’Audit RGAA Express</h1>
                        <p>Pour le site : ${scan.site.url}</p>
                        <h2>Total des problèmes : ${finalResult.totalViolations}</h2>
                        <ul>
                            ${finalResult.violations.map(v => `<li>[RGAA ${v.rgaa.rgaa}] ${v.description}</li>`).join('')}
                        </ul>
                    </body>
                </html>
            `;
            await pageForPdf.setContent(reportHtml);
            const pdfBuffer = await pageForPdf.pdf({ format: 'A4' });

            // --- 4. Email the PDF ---
            const { data, error } = await resend.emails.send({
                from: 'Alouette A11Y <onboarding@resend.dev>',
                to: scan.userEmail!,
                subject: 'Votre rapport d’audit RGAA est prêt !',
                html: `<p>Bonjour, veuillez trouver ci-joint votre rapport d'accessibilité pour le site ${scan.site.url}.</p>`,
                attachments: [{
                    filename: 'rapport-accessibilite.pdf',
                    content: pdfBuffer,
                }],
            });
            if (error) {
                console.error("Resend API Error:", error);
                throw error; // Make sure it gets caught by the catch block
            }
            console.log("Resend API Success:", data);

            await prisma.scan.update({ where: { id: scanId }, data: { status: 'DELIVERED' } });
            await browser.close();

            console.log(`Successfully processed and delivered report for scanId: ${scanId}`);
        } catch (error: any) { // Specify the type as 'any' to inspect it
            console.error('--- DETAILED JOB FAILURE ---');
            // This will print the full error object from Resend
            console.error(error); 
            console.error('--------------------------');
        
            await prisma.scan.update({ 
                where: { id: scanId }, 
                data: { status: 'FAILED' } 
            });
        }
    }
}, { connection });

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed with ${err.message}`);
});