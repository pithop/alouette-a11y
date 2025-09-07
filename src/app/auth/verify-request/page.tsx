// src/app/auth/verify-request/page.tsx
import Link from 'next/link';
import { Mail } from 'lucide-react';

export default function VerifyRequestPage() {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-sm text-center">
          <Mail className="mx-auto h-12 w-12 text-blue-600" />
          {/* FIX: Escaped apostrophe */}
          <h1 className="mt-6 text-3xl font-bold tracking-tight">Vérifiez votre e-mail</h1>
          <p className="mt-4 text-slate-600">
            {/* FIX: Escaped apostrophe */}
            Un lien de connexion a été envoyé à votre adresse e-mail.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Pensez à vérifier votre dossier de courrier indésirable (spam).
          </p>
        </div>
      </div>
      <div className="hidden bg-slate-100 lg:flex lg:items-center lg:justify-center">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-blue-700">
            Alouette A11Y
          </Link>
          {/* FIX: Escaped apostrophes */}
          <p className="mt-2 text-slate-600">L&apos;audit d&apos;accessibilité RGAA, simplifié.</p>
        </div>
      </div>
    </div>
  );
}