// src/app/components/Header.tsx
import Link from 'next/link';
import UserNav from './UserNav'; // Import the new client component

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-bold text-blue-700 tracking-tight">
          Alouette A11Y
        </Link>
        {/* The navigation logic is now handled on the client */}
        <UserNav />
      </div>
    </header>
  );
}