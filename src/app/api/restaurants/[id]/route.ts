// src/app/api/restaurants/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// CORRECTION FINALE : On type 'params' comme étant une promesse
export async function PATCH(
  req: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // On utilise 'await' pour résoudre la promesse
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