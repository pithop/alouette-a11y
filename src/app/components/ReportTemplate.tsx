// src/app/components/ReportTemplate.tsx
import React from 'react';

const groupViolations = (violations: any[]) => {
  const grouped: { [key: string]: { name: string; violations: any[] } } = {};
  violations.forEach((v) => {
    const key = v.rgaa.rgaa;
    if (!grouped[key]) {
      grouped[key] = { name: v.rgaa.name, violations: [] };
    }
    grouped[key].violations.push(v);
  });
  return grouped;
};

export const ReportTemplate = ({ siteUrl, results }: { siteUrl: string; results: { totalViolations: number; violations: any[] } }) => {
  const grouped = groupViolations(results.violations);
  const score = Math.max(0, 100 - results.violations.length * 5);
  const scoreColor = score >= 80 ? '#16a34a' : score >= 50 ? '#f97316' : '#dc2626';

  return (
    <html lang="fr">
      <head>
        <meta charSet="UTF-8" />
        <style>{`
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; color: #1f2937; }
          .container { max-width: 800px; margin: auto; padding: 40px; background-color: white; }
          .header { text-align: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 24px; }
          .header h1 { font-size: 32px; font-weight: bold; color: #1e3a8a; margin: 0; }
          .summary { margin-top: 40px; text-align: center; }
          .score-card { background-color: #f3f4f6; border-radius: 12px; padding: 24px; display: inline-block; }
          .score { font-size: 72px; font-weight: bold; color: ${scoreColor}; }
          .section-title { font-size: 24px; font-weight: bold; margin-top: 48px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; color: #1e3a8a; }
          .criterion-group { margin-top: 24px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
          .criterion-header { background-color: #f3f4f6; padding: 12px 16px; font-weight: bold; }
          .violation-item { padding: 16px; border-top: 1px solid #e5e7eb; }
          .violation-desc { font-weight: 500; margin: 0; }
          .violation-impact { font-size: 14px; color: #ef4444; margin-top: 8px; font-weight: bold; }
          .footer { text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1>Rapport d’Audit d’Accessibilité RGAA</h1>
            <p style={{ marginTop: '8px', color: '#6b7280' }}>Pour le site : <a href={siteUrl} style={{ color: '#3b82f6' }}>{siteUrl}</a></p>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>Généré le : ${new Date().toLocaleDateString('fr-FR')}</p>
          </div>
          <div className="summary">
            <div className="score-card">
              <p style={{ margin: 0, textTransform: 'uppercase', fontSize: '14px', color: '#4b5563' }}>Score Global</p>
              <p className="score">{score}<span style={{fontSize: '40px'}}>/100</span></p>
            </div>
            <p style={{ marginTop: '24px', fontSize: '18px' }}>Total de <strong>{results.totalViolations}</strong> problèmes potentiels détectés sur 5 pages.</p>
          </div>
          <h2 className="section-title">Détail des non-conformités</h2>
          {Object.entries(grouped).map(([rgaa, group]) => (
            <div key={rgaa} className="criterion-group">
              <div className="criterion-header">
                Critère RGAA {rgaa}: {group.name} ({group.violations.length} instances)
              </div>
              {group.violations.map((v, index) => (
                <div key={index} className="violation-item">
                  <p className="violation-desc">{v.help}</p>
                  <p className="violation-impact">Impact : {v.impact}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="footer">
          <p>Rapport généré par Alouette A11Y.</p>
          <p>Cet audit automatisé est un premier diagnostic et ne remplace pas un audit manuel complet réalisé par un expert.</p>
        </div>
      </body>
    </html>
  );
};