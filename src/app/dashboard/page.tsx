// src/app/dashboard/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';
import Header from '@/app/components/Header';
import AuditButton from './AuditButton'; // 1. Import the new component

const prisma = new PrismaClient();

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  const organization = await prisma.organization.findFirst({
    where: { userId: session.user.id },
    include: {
      sites: {
        include: {
          scans: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto p-4 py-8 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tableau de bord</h1>
            <p className="text-slate-600">{organization?.name || 'Votre Organisation'}</p>
          </div>
          {/* 2. Use the new AuditButton component */}
          <AuditButton />
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold">Vos Sites</h2>
          {organization?.sites.length === 0 ? (
            <div className="mt-4 rounded-lg border-2 border-dashed bg-white p-12 text-center">
              <p className="text-slate-600">Vous n'avez pas encore de site. Lancez votre premier audit pour commencer.</p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {organization?.sites.map((site) => (
                <div key={site.id} className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                  <h3 className="break-all font-bold text-slate-800">{site.url}</h3>
                  <div className="mt-4">
                    <p className="text-sm text-slate-500">Dernier scan :</p>
                    {site.scans[0] ? (
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-green-600">
                          {((site.scans[0].resultJson as any)?.score) ?? 'N/A'}
                          <span className="text-xl">/100</span>
                        </p>
                        <p className="text-sm text-slate-500">
                          le {new Date(site.scans[0].createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    ) : (
                      <p>Aucun scan trouvé.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}