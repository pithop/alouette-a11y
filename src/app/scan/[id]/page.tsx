// src/app/scan/[id]/page.tsx
import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import CheckoutButton from './CheckoutButton';
import { AlertTriangle, CheckCircle, Target, HelpCircle } from 'lucide-react';

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
const getImpactDetails = (impact: AxeIssue['impact']) => {
    switch (impact) {
        case 'critical':
            return { color: 'text-red-600', Icon: AlertTriangle, label: 'Critique' };
        case 'serious':
            return { color: 'text-orange-600', Icon: AlertTriangle, label: 'Sérieux' };
        case 'moderate':
            return { color: 'text-yellow-600', Icon: AlertTriangle, label: 'Modéré' };
        default:
            return { color: 'text-blue-600', Icon: HelpCircle, label: 'Mineur' };
    }
};

export default async function ScanResultPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const scan = await prisma.scan.findUnique({
        where: { id },
    });

    if (!scan || !scan.resultJson) {
        notFound();
    }

    const { score, issues = [] } = (scan.resultJson || {}) as unknown as ScanResult;

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white shadow-sm">
                <div className="container mx-auto flex h-20 items-center justify-between px-4">
                    <a href="/" className="text-2xl font-bold text-blue-600">Alouette A11Y</a>
                </div>
            </header>

            <main className="container mx-auto p-4 py-12 md:p-8">
                <div className="mx-auto max-w-4xl">
                    <h1 className="mb-2 text-center text-3xl font-bold text-slate-800">
                        Résultat de votre Audit Express
                    </h1>

                    {/* Score Section */}
                    <div className="my-8 flex flex-col items-center">
                        <div className={`text-6xl font-bold ${score > 80 ? 'text-green-600' : score > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {score} / 100
                        </div>
                        <p className="mt-2 text-lg text-slate-600">Score d'accessibilité estimé</p>
                    </div>

                    {/* Issues Section */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold text-slate-700">
                            {issues.length > 0 ? `Principaux problèmes identifiés (${issues.length})` : 'Félicitations ! Aucun problème majeur détecté.'}
                        </h2>

                        {issues.map((issue) => {
                            const { color, Icon, label } = getImpactDetails(issue.impact);
                            return (
                                <div key={issue.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                                    <h3 className="mb-2 text-xl font-semibold text-slate-800">Problème : {issue.description}</h3>
                                    <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Icon className={`${color} h-5 w-5`} />
                                            <span className="font-semibold">Impact :</span>
                                            <span className={color}>{label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Target className="h-5 w-5 text-slate-500" />
                                            <span className="font-semibold">Critère :</span>
                                            <span className="text-slate-600">{issue.id}</span>
                                        </div>
                                    </div>
                                    <a
                                        href={issue.helpUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold text-blue-600 hover:underline">
                                        Comment corriger ce problème ? ↗
                                    </a>
                                </div>
                            );
                        })}

                        {issues.length === 0 && (
                            <div className="flex flex-col items-center rounded-lg border-2 border-dashed border-green-300 bg-green-50 p-8 text-center">
                                <CheckCircle className="h-12 w-12 text-green-500" />
                                <p className="mt-4 text-lg text-green-800">Votre page a passé avec succès les tests automatisés pour les problèmes les plus courants. Pour une analyse complète, un audit manuel est recommandé.</p>
                            </div>
                        )}
                    </div>

                    {/* CTA Section */}
                    <div className="mt-12 rounded-lg bg-blue-600 p-8 text-center text-white">
                        <h2 className="text-2xl font-bold">Passez à l'étape supérieure</h2>
                        <p className="mx-auto mt-2 max-w-2xl">
                            Obtenez une analyse complète de toutes les pages de votre site, des captures d'écran, et un rapport PDF détaillé conforme aux exigences RGAA.
                        </p>
                        <CheckoutButton scanId={params.id} />

                    </div>
                </div>
            </main>
        </div>
    );
}