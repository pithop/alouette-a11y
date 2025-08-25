// src/app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const { scanId } = await request.json();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!scanId) {
    return NextResponse.json({ error: 'Scan ID is required' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Rapport d’audit express RGAA',
              description: `Analyse complète pour le scan ID: ${scanId}`,
            },
            unit_amount: 4900, // 49.00 EUR in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // We embed the scanId in the metadata to retrieve it in the webhook
      metadata: {
        scanId: scanId,
      },
      // On success, redirect to a confirmation page. We'll handle the actual logic in a webhook.
      success_url: `${appUrl}/scan/${scanId}?payment=success`,
      cancel_url: `${appUrl}/scan/${scanId}?payment=cancelled`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe session creation failed:', error);
    return NextResponse.json({ error: 'Could not create checkout session' }, { status: 500 });
  }
}