// src/app/components/EmailTemplate.tsx
import React from 'react';

export const EmailTemplate = ({ siteUrl, score, totalViolations, scanId }: { siteUrl: string; score: number; totalViolations: number; scanId: string }) => {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
      <div style={{ maxWidth: '600px', margin: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '40px' }}>
        <h1 style={{ color: '#2563eb', fontSize: '24px' }}>Alouette A11Y</h1>
        <h2 style={{ fontSize: '20px', marginTop: '32px' }}>Votre rapport d'audit est prêt !</h2>
        <p>Bonjour,</p>
        <p>
          L'audit d'accessibilité complet pour le site <strong>{siteUrl}</strong> est terminé.
        </p>
        <div style={{ backgroundColor: '#f1f5f9', padding: '24px', borderRadius: '8px', marginTop: '24px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase' }}>Score Global</p>
          <p style={{ fontSize: '48px', fontWeight: 'bold', margin: '8px 0', color: `${score >= 80 ? '#16a34a' : score >= 50 ? '#f97316' : '#dc2626'}` }}>
            {score}/100
          </p>
          <p style={{ margin: 0 }}>
            <strong>{totalViolations}</strong> problèmes détectés
          </p>
        </div>
        <p style={{ marginTop: '32px' }}>
          Vous pouvez télécharger le rapport PDF détaillé qui est attaché à cet e-mail.
        </p>
        <a 
          href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`} 
          style={{ display: 'inline-block', backgroundColor: '#2563eb', color: 'white', padding: '12px 24px', marginTop: '16px', textDecoration: 'none', borderRadius: '4px' }}
        >
          Accéder à votre tableau de bord
        </a>
        <p style={{ marginTop: '32px', fontSize: '12px', color: '#94a3b8' }}>
          Merci d'utiliser Alouette A11Y pour améliorer l'accessibilité du web.
        </p>
      </div>
    </div>
  );
};