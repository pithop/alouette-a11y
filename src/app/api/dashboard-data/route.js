// src/app/api/dashboard-data/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // CORRECTION : Le chemin d'import a changé

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const totalScans = await prisma.scan.count({
      where: { site: { organization: { userId: session.user.id } } },
    });

    const totalSites = await prisma.site.count({
      where: { organization: { userId: session.user.id } },
    });

    // Vous pouvez ajouter d'autres statistiques ici

    return NextResponse.json({
      totalScans,
      totalSites,
    });
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}