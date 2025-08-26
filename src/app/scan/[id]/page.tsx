// src/app/scan/[id]/page.tsx
import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import CheckoutButton from './CheckoutButton';
import { ShieldAlert } from 'lucide-react';
import Header from '@/app/components/Header';

const prisma = new PrismaClient();

// Define types for our data to ensure type safety
type AxeIssue = {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical' | null;
  description: string;
  helpUrl: string;
};

type ScanResult = {
  score: number;
  issues: AxeIssue[];
};

// Helper to get color and icon based on impact level
const getScoreDetails = (score: number) => {
  if (score >= 80) return { color: 'text-green-600', bgColor: 'bg-green-100', label: 'Bon' };
  if (score >= 50) return { color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'Moyen' };
  return { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Faible' };
};

// French translations for common issues
const issueTranslations: Record<string, { title: string; fix: string }> = {
  'color-contrast': {
    title: 'Texte insuffisamment contrasté',
    fix: 'Augmentez le contraste entre le texte et son arrière-plan à un ratio de 4.5:1 minimum.',
  },
  list: {
    title: 'Les listes ne sont pas structurées correctement',
    fix: 'Utilisez les balises sémantiques <ul>, <ol>, et <li> pour toutes les listes.',
  },
  'image-alt': {
    title: 'Image sans alternative textuelle',
    fix: "Ajoutez un attribut 'alt' descriptif à toutes les images informatives.",
  },
  'link-name': {
    title: 'Le lien n’a pas d’intitulé accessible',
    fix: 'Assurez-vous que chaque lien <a> contient du texte ou un attribut aria-label qui décrit sa destination.',
  },
};

export default async function ScanResultPage({ params }: { params: { id: string } }) {
  const scan = await prisma.scan.findUnique({
    where: { id: params.id },
    include: { site: true },
  });

  if (!scan || !scan.resultJson) {
    notFound();
  }

  const { score, issues = [] } = (scan.resultJson || {}) as unknown as ScanResult;
  const scoreDetails = getScoreDetails(score);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header />
      <main className="container mx-auto p-4 py-12 md:p-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-4 text-center text-3xl font-bold text-slate-800">
            Résultats de votre audit express pour
          </h1>
          <p className="break-all text-center text-lg text-blue-700">{scan.site.url}</p>

          {/* Score Card */}
          <div className={`mt-8 rounded-lg border ${scoreDetails.bgColor.replace('bg-', 'border-')} p-6 text-center`}>
            <p className="text-sm font-medium uppercase tracking-wider text-slate-600">Score d'accessibilité</p>
            <div className={`mt-2 text-7xl font-bold ${scoreDetails.color}`}>
              {score}<span className="text-4xl">/100</span>
            </div>
            <p className={`mt-2 font-semibold ${scoreDetails.color}`}>{scoreDetails.label}</p>
          </div>

          {/* Issues Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold text-slate-700">
              {issues.length > 0 ? `Les ${issues.length} problème(s) les plus critiques` : "Félicitations ! Aucun problème majeur détecté."}
            </h2>
            <div className="mt-6 space-y-4">
              {issues.map((issue) => {
                const translation = issueTranslations[issue.id] || { title: issue.description, fix: "Correction spécifique requise." };
                return (
                  <div key={issue.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                          <ShieldAlert className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-slate-800">{translation.title}</h3>
                        <p className="mt-2 text-sm text-slate-600"><span className="font-semibold">Impact :</span> Fort – Peut bloquer l'accès à l'information pour certains utilisateurs.</p>
                        <p className="mt-1 text-sm text-slate-600"><span className="font-semibold">Correction :</span> {translation.fix}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-16 rounded-lg border-2 border-blue-600 bg-white p-8 text-center shadow-lg">
            <h2 className="text-2xl font-bold text-slate-900">Passez à l'étape supérieure</h2>
            <p className="mx-auto mt-2 max-w-2xl text-slate-700">
              Obtenez le rapport complet (PDF détaillé, analyse de 5 pages, preuves de conformité RGAA) pour un plan d'action clair et professionnel.
            </p>
            <div className="mt-6">
              <CheckoutButton scanId={params.id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}