// src/app/components/ReportTemplate.tsx

import React from 'react';
import { ProcessedReport } from '@/workers/ai.processor';

export const ReportTemplate = ({ siteUrl, results }: { siteUrl: string; results: ProcessedReport }) => {
  const penalty = results.issueGroups.reduce((acc, group) => {
    if (group.impact === 'critical') {
      return acc + group.count * 5;
    }
    if (group.impact === 'serious') {
      return acc + group.count * 2;
    }
    if (group.impact === 'moderate') {
      return acc + group.count * 1;
    }
    return acc;
  }, 0);

  const totalIssues = results.issueGroups.reduce((acc, group) => acc + group.count, 0);
  const score = Math.max(0, 100 - penalty);
  const scoreColor = score >= 80 ? '#16a34a' : score >= 50 ? '#f97316' : '#dc2626';

  const styles = `
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; color: #1f2937; -webkit-print-color-adjust: exact; }
    .container { max-width: 800px; margin: auto; padding: 40px; background-color: white; }
    .header { text-align: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 24px; }
    .header h1 { font-size: 32px; font-weight: bold; color: #1e3a8a; margin: 0; }
    .summary { margin-top: 40px; text-align: center; }
    .score-card { background-color: #f3f4f6; border-radius: 12px; padding: 24px; display: inline-block; }
    .score { font-size: 72px; font-weight: bold; color: ${scoreColor}; }
    .executive-summary { margin-top: 32px; padding: 20px; background-color: #eef2ff; border-radius: 8px; border-left: 4px solid #4338ca; }
    .section-title { font-size: 24px; font-weight: bold; margin-top: 48px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; color: #1e3a8a; }
    .issue-group { margin-top: 24px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; page-break-inside: avoid; }
    .issue-header { background-color: #f3f4f6; padding: 16px; font-size: 18px; font-weight: bold; }
    .issue-content { padding: 16px; }
    .issue-content h4 { font-size: 16px; color: #1e3a8a; margin-top: 20px; margin-bottom: 8px; }
    .issue-content p { margin: 0 0 12px 0; line-height: 1.6; }
    .meta-info { display: flex; gap: 24px; margin-top: 8px; font-size: 14px; }
    .meta-item { background-color: #e5e7eb; padding: 4px 12px; border-radius: 16px; font-weight: 500; }
    .footer { text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
    code { background-color: #1f2937; color: #d1d5db; padding: 12px; border-radius: 4px; display: block; white-space: pre-wrap; word-break: break-all; font-size: 13px; }
    .screenshot { max-width: 100%; height: auto; border: 1px solid #d1d5db; border-radius: 4px; margin-top: 12px; }
  `;

  return (
    <html lang="fr">
      <head>
        <meta charSet="UTF-8" />
        <title>{`Rapport d'Accessibilité RGAA pour ${siteUrl}`}</title>
        <style>{styles}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1>Rapport d&apos;Audit d&apos;Accessibilité RGAA</h1>
            <p style={{ marginTop: '8px', color: '#6b7280' }}>Pour le site : <a href={siteUrl} style={{ color: '#3b82f6' }}>{siteUrl}</a></p>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>Généré le : {new Date().toLocaleDateString('fr-FR')}</p>
          </div>
          <div className="summary">
            <div className="score-card">
              <p style={{ margin: 0, textTransform: 'uppercase', fontSize: '14px', color: '#4b5563' }}>Score Global</p>
              <p className="score">{score}<span style={{ fontSize: '40px' }}>/100</span></p>
            </div>
            <div className="executive-summary">
              <h3 style={{ marginTop: 0, color: '#1e3a8a' }}>Résumé Principal</h3>
              <p style={{ margin: 0 }}>{results.executiveSummary}</p>
            </div>
            <p style={{ marginTop: '24px', fontSize: '16px', color: '#4b5563' }}>{results.scoreExplanation}</p>
          </div>

          <h2 className="section-title">Détail des non-conformités ({totalIssues} au total)</h2>

          {results.issueGroups.map((group, index) => (
            <div key={index} className="issue-group">
              <div className="issue-header">
                {group.title}
                <div className="meta-info">
                  <span className="meta-item">Impact: {group.impact}</span>
                  <span className="meta-item">{group.count} instances</span>
                  <span className="meta-item">Critère: {group.rgaaCriterion}</span>
                </div>
              </div>
              <div className="issue-content">
                <h4>Qu&apos;est-ce que cela signifie ?</h4>
                <p>{group.explanation}</p>

                <h4>Comment le corriger ?</h4>
                <p>{group.howToFix}</p>

                <h4>Exemple de code concerné :</h4>
                <code>{group.exampleHtml}</code>

                {group.screenshot && (
                  <>
                    <h4>Visualisation du problème :</h4>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="screenshot"
                      src={`data:image/png;base64,${group.screenshot}`}
                      alt={`Capture d'écran pour le problème : ${group.title}`}
                    />
                  </>
                )}
              </div>
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