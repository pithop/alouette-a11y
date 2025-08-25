// src/app/dashboard/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  // Fetch the user's organization, its sites, and their scans
  const organization = await prisma.organization.findFirst({
    where: { userId: session.user.id },
    include: {
      sites: {
        include: {
          scans: {
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <button className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
          Lancer un nouvel audit
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold">
          {organization ? organization.name : 'Votre Organisation'}
        </h2>
        {organization?.sites.length === 0 && (
          <p className="mt-4 text-slate-600">
            Vous n'avez pas encore de site. Lancez votre premier audit pour commencer.
          </p>
        )}
        <div className="mt-4 space-y-6">
          {organization?.sites.map((site) => (
            <div key={site.id} className="rounded-lg border bg-white p-4">
              <h3 className="font-bold">{site.url}</h3>
              <ul className="mt-2 list-inside list-disc">
                {site.scans.map((scan) => (
                  <li key={scan.id}>
                    Scan du {new Date(scan.createdAt).toLocaleDateString('fr-FR')} - Statut : {scan.status}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}