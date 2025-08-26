// src/app/components/UserNav.tsx
'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import SignOutButton from './SignOutButton';

export default function UserNav() {
  const { data: session } = useSession();

  return (
    <nav className="flex items-center space-x-6 text-sm font-medium">
      <Link
        href="/#tarifs"
        className="hidden text-slate-600 transition-colors hover:text-slate-900 sm:block"
      >
        Tarifs
      </Link>

      {session ? (
        <>
          <Link
            href="/dashboard"
            className="text-slate-600 transition-colors hover:text-slate-900"
          >
            Tableau de bord
          </Link>
          <SignOutButton />
        </>
      ) : (
        <Link
          href="/api/auth/signin"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          Connexion
        </Link>
      )}
    </nav>
  );
}