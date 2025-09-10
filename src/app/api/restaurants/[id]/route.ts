// src/app/api/restaurants/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'; // CORRECTION: Import de NextRequest
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// CORRECTION: Mise à jour de la signature de la fonction
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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