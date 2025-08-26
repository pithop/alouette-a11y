// src/app/dashboard/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { PlusCircle, Download } from 'lucide-react';
import Header from '@/app/components/Header';
import AddSiteModal from './AddSiteModal';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

type SiteWithScans = {
    id: string;
    url: string;
    scans: { id: string; createdAt: Date; status: string; resultJson: any }[];
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sites, setSites] = useState<SiteWithScans[]>([]);
  const [orgName, setOrgName] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/api/auth/signin');
    if (status === 'authenticated') {
      fetch('/api/dashboard-data').then(res => res.json()).then(data => {
        setOrgName(data.name);
        setSites(data.sites);
      });
    }
  }, [status]);

  if (status === 'loading') return <p>Chargement...</p>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto p-4 py-8 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tableau de bord</h1>
            {/* FIX: Changed text color for better contrast */}
            <p className="text-lg text-slate-700">{orgName}</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700">
            <PlusCircle size={18} />
            Ajouter un site
          </button>
        </div>
        
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-slate-800">Rapports d'audit par site</h2>
          {sites.length === 0 ? (
            <div className="mt-4 rounded-lg border-2 border-dashed bg-white p-12 text-center">
              <p className="text-slate-600">Vous n'avez pas encore de site. Cliquez sur "Ajouter un site" pour commencer le suivi.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-6">
              {sites.map(site => (
                <div key={site.id} className="rounded-lg border bg-white p-4 shadow-sm">
                  <h3 className="font-semibold text-slate-900">{site.url}</h3>
                  <ul className="mt-2 divide-y divide-slate-100 text-sm">
                    {site.scans.map(scan => (
                      <li key={scan.id} className="flex items-center justify-between py-3">
                        <div>
                          <span className="font-medium text-slate-700">Scan du {new Date(scan.createdAt).toLocaleString('fr-FR')}</span>
                          <span className="ml-4 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{scan.status}</span>
                        </div>
                        <a href="#" className="flex items-center gap-1 font-semibold text-blue-600 hover:underline">
                          <Download size={14}/> PDF
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      {isModalOpen && <AddSiteModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}