// src/app/ScanForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ScanForm() {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Une erreur est survenue.');
            }

            // Redirect to the results page
            router.push(`/scan/${data.scanId}`);

        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-xl flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row">
                <input
                    type="url"
                    name="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://votre-site-web.fr"
                    required
                    disabled={isLoading}
                    className="flex-grow rounded-md border border-slate-300 px-4 py-3 text-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    // Changed background to green and adjusted hover/focus colors
                    className="flex items-center justify-center rounded-md bg-green-600 px-8 py-4 text-lg font-semibold text-white shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-400"
                >
                    {isLoading ? (
                        <>
                            <svg className="mr-3 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analyse en cours...
                        </>
                    ) : (
                        "Lancer l'audit express"
                    )}
                </button>
            </div>
            {error && <p className="mt-2 text-center text-red-500">{error}</p>}
        </form>
    );
}