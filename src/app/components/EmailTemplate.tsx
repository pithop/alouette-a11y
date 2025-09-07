// src/app/components/EmailTemplate.tsx
import React from 'react';

export interface EmailTemplateProps {
  siteUrl: string;
  score: number;
  totalViolations: number;
  summary: string;
}

export const EmailTemplate = ({ siteUrl, score, totalViolations, summary }: EmailTemplateProps) => {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', color: '#333', backgroundColor: '#f9fafb', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: 'auto', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '40px' }}>
        <h1 style={{ color: '#1e3a8a', fontSize: '28px', fontWeight: 'bold' }}>Alouette A11Y</h1>
        {/* FIX: Escaped apostrophe */}
        <h2 style={{ fontSize: '22px', marginTop: '32px', fontWeight: '600' }}>Votre rapport d&apos;audit est prêt !</h2>
        <p style={{ color: '#374151' }}>Bonjour,</p>
        <p style={{ color: '#374151', lineHeight: '1.5' }}>
          {/* FIX: Escaped apostrophe */}
          L&apos;audit d&apos;accessibilité complet pour le site <strong>{siteUrl}</strong> est terminé. Vous trouverez le rapport PDF détaillé en pièce jointe.
        </p>
        
        <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#eef2ff', borderLeft: '4px solid #4f46e5', borderRadius: '4px' }}>
          {/* FIX: Escaped apostrophe */}
          <p style={{ margin: '0', fontWeight: '600', color: '#3730a3' }}>Résumé des points clés :</p>
          <p style={{ margin: '8px 0 0 0', color: '#4338ca', lineHeight: '1.5' }}>
            {summary}
          </p>
        </div>

        <div style={{ backgroundColor: '#f1f5f9', padding: '24px', borderRadius: '8px', marginTop: '24px', textAlign: 'center' }}>
          {/* FIX: Escaped apostrophe */}
          <p style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', color: '#475569' }}>Votre Score d&apos;Accessibilité</p>
          <p style={{ fontSize: '60px', fontWeight: 'bold', margin: '8px 0', color: `${score >= 80 ? '#16a34a' : score >= 50 ? '#f97316' : '#dc2626'}` }}>
            {score}/100
          </p>
          <p style={{ margin: 0, color: '#475569' }}>
            {/* FIX: Escaped apostrophe */}
            Basé sur <strong>{totalViolations}</strong> groupe(s) de problèmes détectés
          </p>
        </div>
        
        <a 
          href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`} 
          style={{ display: 'block', width: 'fit-content', backgroundColor: '#2563eb', color: 'white', padding: '14px 28px', margin: '32px auto 0', textDecoration: 'none', borderRadius: '6px', fontWeight: '600' }}
        >
          Accéder à votre tableau de bord
        </a>
        <p style={{ marginTop: '40px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
          {/* FIX: Escaped apostrophe */}
          Merci d&apos;utiliser Alouette A11Y pour améliorer l&apos;accessibilité du web.
        </p>
      </div>
    </div>
  );
};