// src/app/api/restaurants/audit/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';

const prisma = new PrismaClient();
const redisUrl = new URL(process.env.REDIS_URL || 'redis://localhost:6379');
const connection = { host: redisUrl.hostname, port: Number(redisUrl.port) };
const restaurantQueue = new Queue('restaurant-audits', { connection });

export async function POST(req: Request) {
  try {
    const restaurantData = await req.json(); // Ceci est UN SEUL restaurant

    if (!restaurantData.name) {
      return NextResponse.json({ error: 'Restaurant name is required' }, { status: 400 });
    }

    // On crée l'enregistrement du restaurant
    const restaurant = await prisma.restaurant.create({
      data: { 
        name: restaurantData.name, 
        email: restaurantData.email, 
        website: restaurantData.website, 
        address: restaurantData.address, 
        phone: restaurantData.phone, 
        category: restaurantData.category 
      },
    });

    const newAudit = await prisma.restaurantAudit.create({
      data: { restaurantId: restaurant.id, status: 'PENDING' },
    });

    await restaurantQueue.add('generate-restaurant-audit', {
      restaurantId: restaurant.id, 
      auditId: newAudit.id,
    });
    
    console.log(`[API] Job ajouté à la file d'attente pour ${restaurant.name} (Audit ID: ${newAudit.id})`);
    return NextResponse.json({ message: 'Audit started', auditId: newAudit.id }, { status: 202 });

  } catch (error) {
    console.error('Failed to start audit:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}