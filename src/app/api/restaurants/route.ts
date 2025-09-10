// src/app/api/restaurants/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, Restaurant } from '@prisma/client';

const prisma = new PrismaClient();
type RestaurantInput = Omit<Restaurant, 'id' | 'createdAt'>;

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
    const restaurantsData: RestaurantInput[] = await req.json();
    const validRestaurants = restaurantsData.filter((r) => r && r.name);

    if (validRestaurants.length === 0) {
      return NextResponse.json({ message: 'No valid restaurants to add' }, { status: 400 });
    }
    
    // Prisma createMany attend des données qui correspondent au modèle
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