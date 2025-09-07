// src/app/api/scan/route.ts
import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';
import { PrismaClient, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import type { AxeResults, Result as AxeResult } from 'axe-core';

const prisma = new PrismaClient();

type AxeIssue = {
  id: string;
  impact: AxeResult['impact'];
  description: string;
  helpUrl: string;
  html: string;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  // FIX: Type the request body
  const body: { url?: string } = await request.json();
  const { url } = body;

  if (!url || !url.startsWith('http')) {
    return NextResponse.json({ error: 'URL valide requise.' }, { status: 400 });
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    let organizationId: string | undefined = undefined;

    if (session?.user?.id) {
      const org = await prisma.organization.findFirst({
        where: { userId: session.user.id },
      });
      if (org) {
        organizationId = org.id;
      }
    }

    const site = await prisma.site.upsert({
      where: { url },
      update: {
        organizationId: organizationId,
      },
      create: {
        url,
        organizationId: organizationId,
      },
    });

    const scan = await prisma.scan.create({
      data: {
        siteId: site.id,
        status: 'RUNNING',
      },
    });
    
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 100000 
    });

    const axeCorePath = path.resolve('./node_modules/axe-core/axe.min.js');
    const axeCoreScript = await fs.readFile(axeCorePath, 'utf-8');
    await page.evaluate(axeCoreScript);
    
    // FIX: Type the evaluated results
    const results: AxeResults = await page.evaluate(() => {
      // FIX: Use @ts-expect-error instead of @ts-ignore
      // @ts-expect-error - axe is injected globally
      return window.axe.run(document, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
        },
      });
    });

    const violations = results.violations;
    const score = Math.max(0, 100 - violations.length * 5);
    
    // FIX: Type the violation in the map function
    const issues: AxeIssue[] = violations.slice(0, 3).map((violation: AxeResult) => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      helpUrl: violation.helpUrl,
      html: violation.nodes[0]?.html || 'Snippet HTML non disponible',
    }));

    const resultJson = { score, issues };

    const updatedScan = await prisma.scan.update({
      where: { id: scan.id },
      // FIX: Cast to Prisma.JsonValue to avoid 'any'
      data: {
        status: 'COMPLETED',
        resultJson: resultJson as Prisma.JsonValue,
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