import ScanForm from './ScanForm';
import { ShieldCheck, BarChart, FileText, BadgeCheck, Zap } from 'lucide-react';
import Header from './components/Header';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="bg-white font-sans text-slate-800">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="border-b border-slate-200 bg-slate-50 py-16 text-center md:py-24">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-6xl">
              Votre site est-il conforme à la loi RGAA ?
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 md:text-xl">
              Lancez un audit d'accessibilité en quelques secondes et recevez un rapport express pour vous mettre en conformité avant l'échéance de 2025.
            </p>
            <div className="mx-auto mt-8 max-w-2xl">
              <ScanForm />
            </div>
            <div className="mt-4 text-sm text-slate-500">
              Analyse instantanée et gratuite. Aucune inscription requise.
            </div>
          </div>
        </section>

        {/* "How it Works" Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold">Un processus simple en 3 étapes</h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600">
              Passez de l'incertitude à la conformité en quelques minutes.
            </p>
            <div className="mt-12 grid grid-cols-1 gap-8 text-left md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
                  <span className="text-xl font-bold">1</span>
                </div>
                <h3 className="mt-6 text-xl font-semibold">Lancez l'audit</h3>
                <p className="mt-2 text-slate-600">Entrez simplement l'URL de votre site. Notre robot analyse votre page en temps réel.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
                  <span className="text-xl font-bold">2</span>
                </div>
                <h3 className="mt-6 text-xl font-semibold">Obtenez votre score</h3>
                <p className="mt-2 text-slate-600">Recevez une note sur 100 et découvrez vos non-conformités les plus critiques.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
                  <span className="text-xl font-bold">3</span>
                </div>
                <h3 className="mt-6 text-xl font-semibold">Passez à l'action</h3>
                <p className="mt-2 text-slate-600">Téléchargez le rapport PDF complet pour un plan d'action détaillé et des preuves de conformité.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="border-t border-slate-200 bg-white py-16 md:py-24">
          <div className="container mx-auto grid grid-cols-1 gap-12 px-4 md:grid-cols-2 md:items-center">
            <div className="rounded-lg bg-slate-100 p-8">
              {/* Placeholder for an image or graphic */}
              <FileText className="mx-auto h-32 w-32 text-slate-300" />
            </div>
            <div>
              <h3 className="text-3xl font-bold">Plus qu'une simple conformité.</h3>
              <p className="mt-4 text-lg text-slate-600">
                Rendre votre site accessible, c'est aussi une opportunité pour votre organisation.
              </p>
              <ul className="mt-6 space-y-4 text-lg text-slate-700">
                <li className="flex items-start">
                  <BadgeCheck className="mr-3 mt-1 h-6 w-6 flex-shrink-0 text-green-600" />
                  <span><strong>Évitez les sanctions :</strong> Protégez-vous contre des amendes pouvant aller jusqu'à 75 000 €.</span>
                </li>
                <li className="flex items-start">
                  <BadgeCheck className="mr-3 mt-1 h-6 w-6 flex-shrink-0 text-green-600" />
                  <span><strong>Élargissez votre audience :</strong> Touchez les 20% de la population ayant un handicap.</span>
                </li>
                <li className="flex items-start">
                  <BadgeCheck className="mr-3 mt-1 h-6 w-6 flex-shrink-0 text-green-600" />
                  <span><strong>Améliorez votre image :</strong> Montrez votre engagement pour l'inclusion et les valeurs citoyennes.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="tarifs" className="border-t border-slate-200 bg-white py-16 text-center md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold">Des tarifs adaptés à vos besoins</h2>
            <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
              <div className="rounded-lg border p-6 text-left">
                <h3 className="text-xl font-bold">Rapport Express</h3>
                <p className="mt-2 text-4xl font-bold">49 €</p>
                <p className="text-slate-500">Paiement unique</p>
                <ul className="mt-4 space-y-2 text-slate-600"><li>✓ Audit jusqu'à 5 pages</li><li>✓ Rapport PDF détaillé</li></ul>
              </div>
              <div className="rounded-lg border-2 border-blue-600 p-6 text-left">
                <h3 className="text-xl font-bold">Abonnement Mensuel</h3>
                <p className="mt-2 text-4xl font-bold">99 €<span className="text-lg font-normal">/mois</span></p>
                <p className="text-slate-500">Suivi continu</p>
                <ul className="mt-4 space-y-2 text-slate-600"><li>✓ Audit mensuel automatisé</li><li>✓ Suivi des tendances</li></ul>
              </div>
              <div className="rounded-lg border p-6 text-left">
                <h3 className="text-xl font-bold">Pro</h3>
                <p className="mt-2 text-4xl font-bold">249 €<span className="text-lg font-normal">/mois</span></p>
                <p className="text-slate-500">Pour les agences</p>
                <ul className="mt-4 space-y-2 text-slate-600"><li>✓ Audits illimités</li><li>✓ Alertes par e-mail</li></ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-100 py-8">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p>&copy; {new Date().getFullYear()} Alouette A11Y. Tous droits réservés.</p>
          <p className="mt-2">
            <a href="#" className="hover:underline">Contact</a> | <a href="#" className="hover:underline">Conformité RGAA et accessibilité numérique</a>
          </p>
        </div>
      </footer>
    </div>
  );
}