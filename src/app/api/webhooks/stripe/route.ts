// src/app/api/webhooks/stripe/route.ts
import { NextResponse } from 'next/server';
import { Stripe } from 'stripe';
import { headers } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { scanQueue } from '@/lib/queue';

const prisma = new PrismaClient();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey || !webhookSecret) {
  throw new Error('Stripe secret keys are not set in the environment variables.');
}

const stripe = new Stripe(stripeSecretKey);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) { // FIX: Type the error
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const scanId = session.metadata?.scanId;
    const userEmail = session.customer_details?.email;

    if (!scanId || !userEmail) {
      console.error('Webhook missing scanId or userEmail in metadata');
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'PAID',
        userEmail: userEmail,
      },
    });

    await scanQueue.add('generate-full-report', { scanId });
    console.log(`Added job to queue for scanId: ${scanId}`);
  }

  return NextResponse.json({ received: true });
}