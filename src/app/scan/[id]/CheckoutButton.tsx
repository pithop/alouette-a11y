// src/app/scan/[id]/CheckoutButton.tsx
'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

// Make sure to add your Stripe public key to your .env file
// NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutButton({ scanId }: { scanId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId }),
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading}
      className="mt-6 rounded-md bg-white px-8 py-3 text-lg font-bold text-blue-600 shadow-lg transition hover:bg-slate-100 disabled:opacity-50"
    >
      {isLoading ? 'Chargement...' : 'Téléchargez le rapport PDF complet (49€)'}
    </button>
  );
}