// src/app/api/restaurants/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fonction pour LIRE tous les restaurants
export async function GET() {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(restaurants);
}

// Fonction pour AJOUTER une liste de restaurants
export async function POST(req: Request) {
  try {
    const restaurantsData = await req.json(); // Ceci est une LISTE de restaurants

    // Le .filter est CORRECT ici
    const validRestaurants = restaurantsData.filter((r: any) => r && r.name);

    if (validRestaurants.length === 0) {
      return NextResponse.json({ message: 'No valid restaurants to add' }, { status: 400 });
    }

    await prisma.restaurant.createMany({
      data: validRestaurants,
      skipDuplicates: true,
    });
    
    return NextResponse.json({ message: 'List processed' }, { status: 201 });
  } catch (error) {
    console.error('[API /restaurants POST]', error);
    return NextResponse.json({ error: 'Failed to process list' }, { status: 500 });
  }
}