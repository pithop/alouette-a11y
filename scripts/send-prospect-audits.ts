// scripts/send-prospect-audits.ts
import { PrismaClient } from '@prisma/client';
import { scanQueue } from '../src/lib/queue';
import prospects from './prospects.json';

const prisma = new PrismaClient();

async function main() {
  console.log(`Starting outreach campaign for ${prospects.length} prospects...`);

  for (const prospect of prospects) {
    try {
      const { url, email } = prospect;
      console.log(`Processing ${url} for ${email}...`);

      const site = await prisma.site.upsert({
        where: { url },
        update: {},
        create: { url },
      });

      const scan = await prisma.scan.create({
        data: {
          siteId: site.id,
          status: 'PAID', // This bypasses the payment flow
          userEmail: email,
        },
      });

      await scanQueue.add('generate-full-report', { scanId: scan.id });

      console.log(`Successfully queued full audit for ${url}. Scan ID: ${scan.id}`);
    } catch (error) {
      console.error(`Failed to process prospect ${prospect.url}:`, error);
    }
  }

  console.log('Outreach campaign finished queuing all jobs.');
  // Allow time for Prisma client to disconnect gracefully
  setTimeout(async () => {
    await prisma.$disconnect();
    process.exit(0);
  }, 5000); 
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});