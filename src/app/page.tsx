// src/app/page.tsx
import { ShieldCheck } from 'lucide-react';
import ScanForm from './ScanForm'; // Import the new component

export default function HomePage() {
  return (
    <div className="bg-slate-50 text-slate-800">
      {/* ... (Header remains the same) ... */}
      <header className="container mx-auto flex h-20 items-center justify-between px-4">
        <h1 className="text-2xl font-bold text-blue-600">Alouette A11Y</h1>
        <nav>
          <a href="#prix" className="text-slate-600 hover:text-blue-600">
            Tarifs
          </a>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="bg-white py-20 text-center">
          <div className="container mx-auto px-4">
            <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
              Audit d’accessibilité RGAA en 2 minutes.
            </h2>
            <p className="mb-8 text-lg text-slate-600 md:text-xl">
              Testez votre site web, obtenez un rapport express et mettez-vous en conformité avec la loi française.
            </p>

            {/* Use the ScanForm component here */}
            <ScanForm />

          </div>
        </section>

        {/* ... (RGAA Explanation and Footer remain the same) ... */}
        <section id="rgaa" className="py-16">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-blue-500" />
            <h3 className="mb-4 text-3xl font-bold">
              Pourquoi la conformité RGAA est-elle obligatoire ?
            </h3>
            <div className="prose prose-lg mx-auto text-left text-slate-700">
              <p>
                Le <strong>Référentiel Général d’Amélioration de l’Accessibilité (RGAA)</strong> est la norme technique imposée par la loi française pour rendre les sites web publics et de grandes entreprises accessibles aux personnes en situation de handicap.
              </p>
              <p>
                À partir de 2025, les sanctions pour non-conformité se renforcent. Les mairies, universités, et même les PME doivent fournir une déclaration d’accessibilité et un plan d’action. Ne pas s'y conformer vous expose à des <strong>sanctions financières</strong> et à des risques juridiques.
              </p>
              <p>
                Notre outil vous aide à réaliser un premier diagnostic rapide pour identifier les non-conformités les plus critiques et vous guider vers une mise en conformité complète.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-100 py-8">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p>&copy; {new Date().getFullYear()} Alouette A11Y. Tous droits réservés.</p>
          <p className="mt-2">
            Placeholder pour contact, mentions légales, etc.
          </p>
        </div>
      </footer>
    </div>
  );
}