// src/app/dashboard/AuditButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';

export default function AuditButton() {
  const router = useRouter();

  const handleClick = () => {
    // Redirect the user to the homepage to start a new scan
    router.push('/');
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
    >
      <PlusCircle size={18} />
      Lancer un nouvel audit
    </button>
  );
}