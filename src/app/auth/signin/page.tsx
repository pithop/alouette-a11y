// src/app/auth/signin/page.tsx
'use client';
import { signIn } from 'next-auth/react';

export default function SignInPage() {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    if (email) {
      signIn('email', { email, callbackUrl: '/dashboard' });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-lg border p-8">
        <h1 className="mb-4 text-center text-2xl font-bold">Connexion</h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email" className="block font-medium">Adresse e-mail</label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"
          />
          <button type="submit" className="mt-4 w-full rounded-md bg-blue-600 py-2 text-white">
            Recevoir le lien de connexion
          </button>
        </form>
      </div>
    </div>
  );
}