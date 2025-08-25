// src/app/components/Header.tsx
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import SignOutButton from './SignOutButton';

export default async function Header() {
  const session = await getServerSession(authOptions);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-bold text-blue-700 tracking-tight">
          Alouette A11Y
        </Link>

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
      </div>
    </header>
  );
}