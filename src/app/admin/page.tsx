// src/app/admin/page.tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function AdminPage() {
    const totalUsers = await prisma.user.count();
    const totalSites = await prisma.site.count();
    const totalScans = await prisma.scan.count();
    // In a real app, you'd also query subscription status from Stripe
  
    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold">Panneau d'administration</h1>
            <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-white p-4 border text-center">
                    <p className="text-4xl font-bold">{totalUsers}</p>
                    <p>Utilisateurs</p>
                </div>
                <div className="rounded-lg bg-white p-4 border text-center">
                    <p className="text-4xl font-bold">{totalSites}</p>
                    <p>Sites</p>
                </div>
                <div className="rounded-lg bg-white p-4 border text-center">
                    <p className="text-4xl font-bold">{totalScans}</p>
                    <p>Scans</p>
                </div>
            </div>
        </div>
    );
}