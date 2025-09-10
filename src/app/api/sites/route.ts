// src/app/api/sites/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // CORRECTION : Import depuis le fichier partagé
import { scanQueue } from '@/lib/queue';
import { Stripe } from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { url, plan } = await request.json();
    if (!url || !plan) {
      return NextResponse.json({ error: 'URL and plan are required' }, { status: 400 });
    }

    const organization = await prisma.organization.findFirst({
      where: { userId: session.user.id },
    });
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Create the Site in the database
    const site = await prisma.site.create({
      data: { url, organizationId: organization.id },
    });

    // Create a Stripe Checkout Session for the subscription
    const priceId = plan === 'pro' ? process.env.STRIPE_PRO_PRICE_ID : process.env.STRIPE_BASIC_PRICE_ID;
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribe=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribe=cancelled`,
      metadata: {
        userId: session.user.id,
        siteId: site.id,
        plan: plan,
      },
    });

    // Schedule the repeatable job in BullMQ
    const repeatOptions = plan === 'pro' 
      ? { pattern: '0 0 * * 1' } // Tous les lundis à minuit pour le plan Pro
      : { every: 30 * 24 * 60 * 60 * 1000 }; // Environ tous les 30 jours pour le plan Basique
    
    await scanQueue.add('scheduled-scan', { siteId: site.id }, {
      repeat: repeatOptions,
      jobId: `scan-${site.id}` // ID unique pour éviter les doublons
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error in /api/sites:", error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}