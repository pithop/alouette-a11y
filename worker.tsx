// worker.tsx (Final Version with Gemini AI Integration)
import React from 'react';
import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { rgaaMap } from './src/lib/rgaa-map';
import { AxeResults, Result as AxeResult } from 'axe-core';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReportTemplate } from './src/app/components/ReportTemplate';
import { render } from '@react-email/render';
import { EmailTemplate } from './src/app/components/EmailTemplate';
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- START: Gemini AI Integration ---

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

// Define the expected structure of the AI's JSON response
export interface ProcessedReport {
  executiveSummary: string;
  scoreExplanation: string;
  issueGroups: Array<{
    title: string;
    rgaaCriterion: string;
    impact: 'critical' | 'serious' | 'moderate';
    count: number;
    explanation: string;
    howToFix: string;
    exampleHtml: string;
  }>;
}

/**
 * Sends raw Axe violations to the Gemini API for analysis and structuring.
 * @param violations - An array of raw violation objects from Axe-core.
 * @returns A structured, human-readable report object.
 */
export async function processViolationsWithAI(violations: any[]): Promise<ProcessedReport> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Tu es un expert en accessibilité web (RGAA/WCAG) qui rédige des rapports pour des non-techniciens (mairies, PME).
    Je vais te fournir un tableau JSON de violations d'accessibilité brutes provenant de l'outil Axe-Core.
    Ta tâche est de transformer ces données brutes en un rapport clair, concis et actionnable en français.

    Voici les règles :
    1.  **Regroupe les erreurs similaires** : Si plusieurs violations concernent le même composant (ex: le même bouton avec un problème de contraste sur 5 pages), regroupe-les en une seule entrée.
    2.  **Simplifie le langage** : N'utilise pas de jargon technique. Explique chaque problème comme si tu parlais à un chef de projet, pas à un développeur.
    3.  **Fournis des solutions concrètes** : Pour chaque groupe de problèmes, donne une recommandation claire et simple sur la manière de le corriger.
    4.  **Rédige un résumé** : Commence par un "executiveSummary" qui résume en 2-3 phrases les problèmes les plus critiques.
    5.  **Sois concis** : Le but est d'aider, pas de submerger.
    6.  **Réponds UNIQUEMENT avec un objet JSON** valide qui correspond à la structure TypeScript 'ProcessedReport' suivante, sans aucun autre texte ou formatage.

    \`\`\`typescript
    interface ProcessedReport {
      executiveSummary: string; // Résumé en 2-3 phrases des problèmes les plus importants.
      scoreExplanation: string; // Explique brièvement ce que le score signifie.
      issueGroups: Array<{
        title: string; // Un titre descriptif pour le groupe de problèmes (ex: "Les images de la galerie n'ont pas de description").
        rgaaCriterion: string; // Le critère RGAA principal (ex: "RGAA 3.3").
        impact: 'critical' | 'serious' | 'moderate'; // L'impact le plus élevé du groupe.
        count: number; // Le nombre d'occurrences de ce problème.
        explanation: string; // Explication simple du problème en français.
        howToFix: string; // Guide simple pour corriger le problème en français.
        exampleHtml: string; // Un seul extrait de code HTML représentatif du problème.
      }>;
    }
    \`\`\`

    Voici les données de violations brutes :
    ${JSON.stringify(violations)}
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  // Clean up the response to ensure it's valid JSON
  const jsonResponse = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
  
  try {
    return JSON.parse(jsonResponse) as ProcessedReport;
  } catch (e) {
    console.error("Failed to parse Gemini's JSON response:", e);
    console.error("Raw response was:", responseText);
    throw new Error("Could not get a valid JSON response from the AI.");
  }
}

// --- END: Gemini AI Integration ---

const prisma = new PrismaClient();
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
                await page.goto(currentUrl, { waitUntil: 'networkidle', timeout: 60000 });
                await page.evaluate(axeCoreScript);
                const results = await page.evaluate(() => (window as any).axe.run({ runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] } })) as AxeResults;
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
                id: v.id,
                impact: v.impact,
                description: v.description,
                helpUrl: v.helpUrl,
                html: v.nodes[0]?.html || 'Snippet HTML non disponible',
                rgaa: rgaaMap[v.id] || { rgaa: 'N/A', name: 'Non Mappé' }
            }));
            
            console.log(`Sending ${mappedViolations.length} raw violations to Gemini for processing...`);
            const processedReportData = await processViolationsWithAI(mappedViolations);

            await prisma.scan.update({
                where: { id: scanId },
                data: { status: 'COMPLETED_FULL', resultJson: processedReportData as any }
            });

            const pageForPdf = await context.newPage();
            const reportHtml = renderToStaticMarkup(
                <ReportTemplate siteUrl={scan.site.url} results={processedReportData} />
            );
            await pageForPdf.setContent(reportHtml, { waitUntil: 'networkidle' });
            const pdfBuffer = await pageForPdf.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }});

            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_SERVER_HOST,
                port: Number(process.env.EMAIL_SERVER_PORT),
                secure: true,
                auth: {
                  user: process.env.EMAIL_SERVER_USER,
                  pass: process.env.EMAIL_SERVER_PASSWORD,
                },
            });

            const totalIssues = processedReportData.issueGroups.reduce((acc, group) => acc + group.count, 0);
            const score = Math.max(0, 100 - totalIssues * 5);
            
            const emailHtml = await render(
              <EmailTemplate 
                siteUrl={scan.site.url} 
                score={score}
                totalViolations={totalIssues}
                summary={processedReportData.executiveSummary}
              />
            );
            
            await transporter.sendMail({
                from: `"Alouette A11Y" <${process.env.EMAIL_FROM}>`,
                to: scan.userEmail,
                subject: `Votre rapport d'audit RGAA pour ${scan.site.url} est prêt !`,
                html: emailHtml,
                attachments: [{
                    filename: 'rapport-accessibilite.pdf',
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                }],
            });

            await prisma.scan.update({ where: { id: scanId }, data: { status: 'DELIVERED' } });
            console.log(`Successfully processed and delivered report for scanId: ${scanId}`);

        } catch (error: any) {
            console.error('--- DETAILED JOB FAILURE ---');
            console.error(`Job for scanId ${scanId} failed.`);
            console.error(error); 
            console.error('--------------------------');
            if (scanId) {
                await prisma.scan.update({ where: { id: scanId }, data: { status: 'FAILED' } });
            }
        } finally {
            if (browser) await browser.close();
        }
    }
}, { connection });

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed with ${err.message}`);
});