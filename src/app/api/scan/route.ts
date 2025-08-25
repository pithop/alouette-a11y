// src/app/api/scan/route.ts (Corrected)
import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route'; // Import authOptions

const prisma = new PrismaClient();

type AxeIssue = {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical' | null;
  description: string;
  helpUrl: string;
};

export async function POST(request: Request) {
  // 1. Get the current user session
  const session = await getServerSession(authOptions);
  const { url } = await request.json();

  if (!url || !url.startsWith('http')) {
    return NextResponse.json({ error: 'URL valide requise.' }, { status: 400 });
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    let organizationId: string | undefined = undefined;

    // 2. If the user is logged in, find their organization
    if (session?.user?.id) {
      const org = await prisma.organization.findFirst({
        where: { userId: session.user.id },
      });
      if (org) {
        organizationId = org.id;
      }
    }

    // 3. Create or update the Site, now with the organizationId if it exists
    const site = await prisma.site.upsert({
      where: { url },
      update: {
        // If an anonymous site exists, associate it with the org
        organizationId: organizationId,
      },
      create: {
        url,
        organizationId: organizationId,
      },
    });

    // The rest of the logic remains the same...
    const scan = await prisma.scan.create({
      data: {
        siteId: site.id,
        status: 'RUNNING',
      },
    });

    await page.goto(url, { waitUntil: 'networkidle' });

    const axeCorePath = path.resolve('./node_modules/axe-core/axe.min.js');
    const axeCoreScript = await fs.readFile(axeCorePath, 'utf-8');
    await page.evaluate(axeCoreScript);

    const results = await page.evaluate(() => {
      // @ts-ignore
      return (window as any).axe.run(document, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
        },
      });
    });

    const violations = (results as any).violations;
    const score = Math.max(0, 100 - violations.length * 5);

    const issues: AxeIssue[] = violations.slice(0, 3).map((violation: any) => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      helpUrl: violation.helpUrl,
    }));

    const resultJson = { score, issues };

    const updatedScan = await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: 'COMPLETED',
        resultJson: resultJson as any,
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