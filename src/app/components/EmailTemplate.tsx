// src/app/components/EmailTemplate.tsx
import React from 'react';

export const EmailTemplate = ({ siteUrl, score, totalViolations }: { siteUrl: string; score: number; totalViolations: number; }) => {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', color: '#333', backgroundColor: '#f9fafb', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: 'auto', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '40px' }}>
        <h1 style={{ color: '#1e3a8a', fontSize: '28px', fontWeight: 'bold' }}>Alouette A11Y</h1>
        <h2 style={{ fontSize: '22px', marginTop: '32px', fontWeight: '600' }}>Votre rapport d'audit est prêt !</h2>
        <p style={{ color: '#374151' }}>Bonjour,</p>
        <p style={{ color: '#374151', lineHeight: '1.5' }}>
          L'audit d'accessibilité complet pour le site <strong>{siteUrl}</strong> est terminé. Vous trouverez le rapport PDF détaillé en pièce jointe.
        </p>
        <div style={{ backgroundColor: '#f1f5f9', padding: '24px', borderRadius: '8px', marginTop: '24px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', color: '#475569' }}>Votre Score d'Accessibilité</p>
          <p style={{ fontSize: '60px', fontWeight: 'bold', margin: '8px 0', color: `${score >= 80 ? '#16a34a' : score >= 50 ? '#f97316' : '#dc2626'}` }}>
            {score}/100
          </p>
          <p style={{ margin: 0, color: '#475569' }}>
            Basé sur <strong>{totalViolations}</strong> problèmes détectés
          </p>
        </div>
        <a 
          href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`} 
          style={{ display: 'block', width: 'fit-content', backgroundColor: '#2563eb', color: 'white', padding: '14px 28px', margin: '32px auto 0', textDecoration: 'none', borderRadius: '6px', fontWeight: '600' }}
        >
          Accéder à votre tableau de bord
        </a>
        <p style={{ marginTop: '40px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
          Merci d'utiliser Alouette A11Y pour améliorer l'accessibilité du web.
        </p>
      </div>
    </div>
  );
};