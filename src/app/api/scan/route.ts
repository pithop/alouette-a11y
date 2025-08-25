// src/app/api/scan/route.ts
import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define a type for our simplified issue structure
type AxeIssue = {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical' | null;
  description: string;
  helpUrl: string;
};

export async function POST(request: Request) {
  const { url } = await request.json();

  if (!url || !url.startsWith('http')) {
    return NextResponse.json(
      { error: 'URL valide requise.' },
      { status: 400 }
    );
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Find or create a Site record for the given URL
    const site = await prisma.site.upsert({
      where: { url },
      update: {},
      create: { url },
    });

    // Create an initial Scan record
    const scan = await prisma.scan.create({
      data: {
        siteId: site.id,
        status: 'RUNNING',
      },
    });

    await page.goto(url, { waitUntil: 'networkidle' });

    // Inject the axe-core script into the page
    const axeCorePath = path.resolve('./node_modules/axe-core/axe.min.js');
    const axeCoreScript = await fs.readFile(axeCorePath, 'utf-8');
    await page.evaluate(axeCoreScript);

    // Run axe and get the results
    const results = await page.evaluate(() => {
      // @ts-ignore
      return axe.run(document, {
        // Optional: configure rules or standards to use
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
        },
      });
    });

    // --- Process Results ---
    const violations = results.violations;
    const score = Math.max(0, 100 - violations.length * 5); // Simple scoring logic

    // Get top 3 sample issues
    const issues: AxeIssue[] = violations.slice(0, 3).map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      helpUrl: violation.helpUrl,
    }));

    const resultJson = { score, issues };

    // Update the scan record with the final results
    const updatedScan = await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: 'COMPLETED',
        resultJson: resultJson as any, // Cast to 'any' for Prisma's Json type
      },
    });

    return NextResponse.json({ scanId: updatedScan.id });

  } catch (error) {
    console.error('Scan failed:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue durant le scan.' },
      { status: 500 }
    );
  } finally {
    await browser.close();
  }
}