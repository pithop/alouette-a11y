// src/app/dashboard/AddSiteModal.tsx
'use client';
import { useState } from 'react';

export default function AddSiteModal({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = useState('');
  const [plan, setPlan] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const response = await fetch('/api/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, plan }),
    });
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url; // Redirect to Stripe checkout
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <h2 className="text-xl font-bold">Ajouter un nouveau site</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium">URL du site</label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-slate-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Choisir un abonnement</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="mt-1 block w-full rounded-md border-slate-300"
            >
              <option value="basic">Basic - 99€/mois</option>
              <option value="pro">Pro - 249€/mois</option>
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm">Annuler</button>
            <button type="submit" disabled={isLoading} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white">
              {isLoading ? 'Chargement...' : 'Continuer vers le paiement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}