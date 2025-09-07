// src/app/scan/[id]/CheckoutButton.tsx
'use client';

import { useState } from 'react';
// FIX: loadStripe is now used
import { loadStripe } from '@stripe/stripe-js';

// FIX: Removed unused stripePromise constant by initializing inside the function
// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutButton({ scanId }: { scanId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      // Initialize stripe here
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      if (!stripe) {
        throw new Error('Stripe.js has not loaded yet.');
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId }),
      });

      const session = await response.json();
      
      // Redirect to checkout
      const result = await stripe.redirectToCheckout({
        sessionId: session.sessionId,
      });

      if (result.error) {
        console.error(result.error.message);
      }

    } catch (error) {
      console.error('Checkout failed:', error);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading}
      // FIX: Escaped apostrophe
      className="mt-6 rounded-md bg-white px-8 py-3 text-lg font-bold text-blue-600 shadow-lg transition hover:bg-slate-100 disabled:opacity-50"
    >
      {isLoading ? 'Chargement...' : 'Téléchargez le rapport PDF complet (49€)'}
    </button>
  );
}