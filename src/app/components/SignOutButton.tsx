// src/app/components/SignOutButton.tsx
'use client';
import { signOut } from 'next-auth/react';

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="text-slate-600 transition-colors hover:text-slate-900"
    >
      Déconnexion
    </button>
  );
}