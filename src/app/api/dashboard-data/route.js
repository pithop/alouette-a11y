// src/app/api/dashboard-data/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const organization = await prisma.organization.findFirst({
    where: { userId: session.user.id },
    include: {
      sites: {
        include: {
          scans: { orderBy: { createdAt: 'desc' } },
        },
      },
    },
  });

  return NextResponse.json(organization);
}