// src/workers/audit.worker.tsx

import { Worker } from 'bullmq';
import { PrismaClient, Prisma } from '@prisma/client';
import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';
import { rgaaMap } from '../lib/rgaa-map';
import { AxeResults, Result as AxeResult, NodeResult } from 'axe-core';
import { processViolationsWithAI } from './ai.processor';
import { ReportProcessor } from './report.processor';

const prisma = new PrismaClient();
const redisUrl = new URL(process.env.REDIS_URL || 'redis://localhost:6379');
const connection = { host: redisUrl.hostname, port: Number(redisUrl.port) };

console.log('Production worker is starting...');

type MappedViolation = {
    id: string;
    impact: AxeResult['impact'];
    description: string;
    helpUrl: string;
    html: string;
    rgaa: { rgaa: string; name: string; };
    screenshot?: string;
};

interface WindowWithAxe extends Window {
    axe: {
        run: (context: Document, options: object) => Promise<AxeResults>;
    };
}

const worker = new Worker('scans', async (job) => {
    if (job.name === 'generate-full-report') {
        const { scanId } = job.data;
        let browser;
        try {
            console.log(`Processing job for scanId: ${scanId}`);
            await prisma.scan.update({ where: { id: scanId }, data: { status: 'RUNNING_FULL' } });

            const scan = await prisma.scan.findUnique({ where: { id: scanId }, include: { site: true } });
            if (!scan || !scan.userEmail || !scan.site) {
                throw new Error('Scan, user email, or site not found');
            }

            browser = await chromium.launch({ args: ['--no-sandbox'] });
            const context = await browser.newContext();
            
            const allMappedViolations: MappedViolation[] = []; 
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
                try {
                    await page.goto(currentUrl, { waitUntil: 'networkidle', timeout: 60000 });
                    await page.evaluate(axeCoreScript);
                    const results: AxeResults = await page.evaluate(() => (window as unknown as WindowWithAxe).axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] } }));
                    
                    for (const v of results.violations) {
                        const firstNode: NodeResult | undefined = v.nodes[0];
                        if (!firstNode) continue;

                        let screenshotBase64: string | undefined = undefined;
                        try {
                            const selector = firstNode.target[0];
                            const elementHandle = await page.locator(selector).first();

                            // AJOUT : Forcer la visibilité de l'élément avant la capture
                            await elementHandle.evaluate(node => {
                                // Ces styles forcent l'élément à devenir visible
                                node.style.visibility = 'visible';
                                node.style.opacity = '1';
                                // Optionnel : ajouter une bordure pour mieux le voir
                                node.style.border = '3px solid red'; 
                            });

                            const screenshotBuffer = await elementHandle.screenshot();
                            screenshotBase64 = screenshotBuffer.toString('base64');
                        } catch (screenshotError) {
                            console.warn(`Could not take screenshot for violation ${v.id} on ${currentUrl}:`, screenshotError);
                        }
                        
                        allMappedViolations.push({
                            id: v.id,
                            impact: v.impact,
                            description: v.description,
                            helpUrl: v.helpUrl,
                            html: firstNode.html || 'Snippet HTML non disponible',
                            rgaa: rgaaMap[v.id] || { rgaa: 'N/A', name: 'Non Mappé' },
                            screenshot: screenshotBase64,
                        });
                    }
                    
                    const links: string[] = await page.$$eval('a[href]', (anchors: HTMLAnchorElement[], baseUrl: string) => 
                        anchors
                            .map(a => new URL(a.href, baseUrl).href)
                            .filter(href => href.startsWith(baseUrl)),
                        scan.site.url
                    );
                    
                    links.forEach(link => {
                        if(!visited.has(link)) toVisit.push(link);
                    });
                } finally {
                    await page.close();
                }
            }
            
            console.log(`Sending ${allMappedViolations.length} raw violations (with screenshots) to Gemini for processing...`);
            const processedReportData = await processViolationsWithAI(allMappedViolations);

            await prisma.scan.update({
                where: { id: scanId },
                data: { status: 'COMPLETED_FULL', resultJson: processedReportData as Prisma.JsonValue }
            });
            
            const reportProcessor = new ReportProcessor();
            const pdfBuffer = await reportProcessor.generate(scan.site.url, processedReportData);
            await reportProcessor.sendEmail(scan.userEmail, scan.site.url, processedReportData, pdfBuffer);

            await prisma.scan.update({ where: { id: scanId }, data: { status: 'DELIVERED' } });
            console.log(`Successfully processed and delivered report for scanId: ${scanId}`);

        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error(`--- DETAILED JOB FAILURE for scanId ${scanId} ---`);
            console.error(error); 
            if (scanId) {
                await prisma.scan.update({ where: { id: scanId }, data: { status: 'FAILED', resultJson: { error: message } } });
            }
        } finally {
            if (browser) await browser.close();
        }
    }
}, { connection, concurrency: 2 });

worker.on('failed', (job, err) => {
    if (job) {
        console.error(`Job ${job.id} failed with ${err.message}`);
    } else {
        console.error(`A job failed with ${err.message}`);
    }
});

console.log('Worker is listening for jobs...');