// src/app/api/restaurants/[id]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fonction pour METTRE À JOUR un restaurant
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const data = await req.json();

  try {
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id },
      data: { email: data.email },
    });
    return NextResponse.json(updatedRestaurant);
  } catch (error) {
    console.error(`[API PATCH /restaurants/${id}]`, error);
    return NextResponse.json({ error: 'Failed to update restaurant' }, { status: 500 });
  }
}