// src/workers/restaurant.report.processor.ts
import { chromium } from 'playwright';
import * as nodemailer from 'nodemailer';
import { RestaurantReport } from './restaurant.ai.processor';

export class RestaurantReportProcessor {
  async generatePdf(report: RestaurantReport, restaurantName: string): Promise<Buffer> {
    const reportHtml = this.generateReportHtml(report, restaurantName);
    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(reportHtml, { waitUntil: 'networkidle' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    return pdfBuffer;
  }

  async sendEmail(to: string, restaurantName: string, report: RestaurantReport, pdfBuffer: Buffer) {
    if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
      throw new Error("Missing email credentials in .env file");
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
        },
    });

    const emailHtml = this.generateEmailHtml(restaurantName, report);
    
    await transporter.sendMail({
      from: `"Younes de Yonyalabs" <${process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER}>`,
      to,
      subject: `Votre présence en ligne pour ${restaurantName}`,
      html: emailHtml,
      attachments: [{
        filename: `rapport-presence-en-ligne-${restaurantName.replace(/\s+/g, '-')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }],
    });
    console.log(`✅ Email de prospection envoyé avec succès à ${to}`);
  }
  
  private generateEmailHtml(restaurantName: string, report: RestaurantReport): string {
    return `
      <!DOCTYPE html><html><body style="font-family: Arial, sans-serif; background-color: #f4f4f7; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
          <h1 style="color: #1e3a8a;">Votre réputation en ligne est excellente… mais pas totalement maîtrisée</h1>
          <p style="color: #333; font-size: 16px;">Bonjour,</p>
          <p style="color: #333; font-size: 16px;">En analysant la présence en ligne de <strong>${restaurantName}</strong>, nous avons remarqué que vous bénéficiez d’une excellente réputation avec une note de <strong>${report.googlePresence.rating} ★</strong> sur plus de <strong>${report.googlePresence.reviewCount}</strong> avis. 🎉</p>
          <p style="color: #333; font-size: 16px;">Cependant, votre image dépend aujourd’hui principalement de plateformes tierces. Cela vous prive :</p>
          <ul style="color: #333; font-size: 16px; padding-left: 20px;">
            <li>du contrôle total de votre image,</li>
            <li>d’une relation directe avec vos clients,</li>
            <li>et d’une partie importante de vos marges.</li>
          </ul>
          <p style="color: #333; font-size: 16px;">Chez Yonyalabs, nous aidons les restaurants à reprendre le contrôle de leur présence digitale.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://yonyalabs.com" style="background-color: #1e3a8a; color: white; padding: 12px 20px; border-radius: 5px; text-decoration: none; font-size: 16px;">Prendre un rendez-vous gratuit</a>
          </div>
          <p style="color: #333; font-size: 16px;">Nous proposons un audit gratuit de 15 minutes pour discuter du rapport ci-joint et vous montrer concrètement les opportunités d’amélioration. Seriez-vous disponible la semaine prochaine ?</p>
          <hr style="border: none; border-top: 1px solid #cccccc;" />
          <p style="color: #555; font-size: 14px;">
            Cordialement,<br/>
            <strong>Younes Ait Abdellah</strong><br/>
            Digital Strategist – Yonyalabs<br/>
            📞 0605740011 | 🌐 yonyalabs.com
          </p>
        </div>
      </body></html>
    `;
  }

  private generateReportHtml(report: RestaurantReport, restaurantName: string): string {
    const styles = `body{font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;background-color:#fff;color:#1a202c;-webkit-print-color-adjust:exact}.container{max-width:800px;margin:auto;padding:48px;background-color:white;border:1px solid #e2e8f0}.header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #1e3a8a;padding-bottom:16px}.header h1{font-size:32px;font-weight:bold;color:#1e3a8a;margin:0}.header span{font-size:16px;color:#4a5568}.section{margin-top:40px}.section-title{font-size:20px;font-weight:bold;color:#1e3a8a;margin-bottom:16px;display:flex;align-items:center;gap:8px}.card-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}.card{border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center}.card-value{font-size:24px;font-weight:bold;color:#1e3a8a}.card-label{font-size:14px;color:#718096}.analysis-box{background-color:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-top:16px}.competitor-table{width:100%;border-collapse:collapse;margin-top:16px}.competitor-table th,.competitor-table td{border:1px solid #e2e8f0;padding:12px;text-align:left}.competitor-table th{background-color:#f7fafc}.conclusion{background-color:#eef2ff;border-radius:8px;padding:24px;border-left:4px solid #4338ca;margin-top:40px}.footer{text-align:center;margin-top:40px;padding-top:24px;border-top:1px solid #e2e8f0;font-size:12px;color:#6b7280}`;
    const socialMediaStatusColor = (status: string) => status === 'Actif' ? '#38a169' : '#a0aec0';

    return `
      <!DOCTYPE html><html lang="fr"><head><title>Audit pour ${restaurantName}</title><style>${styles}</style></head><body>
      <div class="container">
        <div class="header"><h1>Audit de Présence Digitale</h1><span>Pour : <strong>${restaurantName}</strong></span></div>
        <div class="section">
          <h2 class="section-title">⭐ Présence Google & Fiche Business</h2>
          <div class="card-grid">
            <div class="card"><p class="card-value">${report.googlePresence.rating} ★</p><p class="card-label">Note moyenne</p></div>
            <div class="card"><p class="card-value">${report.googlePresence.reviewCount}</p><p class="card-label">Nombre d'avis</p></div>
            <div class="card"><p class="card-value" style="font-size:14px; color: ${report.googlePresence.negativeKeywords.length > 0 ? '#c53030' : '#38a169'}">${report.googlePresence.negativeKeywords.length > 0 ? report.googlePresence.negativeKeywords.join(', ') : 'Aucun détecté'}</p><p class="card-label">Mots-clés négatifs</p></div>
          </div>
        </div>
        <div class="section"><h2 class="section-title">🌍 Site Web Officiel</h2><div class="analysis-box"><p><strong>Statut :</strong> ${report.website.status}</p><p><strong>Analyse :</strong> ${report.website.analysis}</p></div></div>
        <div class="section"><h2 class="section-title">📱 Réseaux Sociaux</h2>
          <div class="card-grid">
            <div class="card"><p class="card-value">Facebook</p><p class="card-label" style="color: ${socialMediaStatusColor(report.socialMedia.facebook)}">${report.socialMedia.facebook}</p></div>
            <div class="card"><p class="card-value">Instagram</p><p class="card-label" style="color: ${socialMediaStatusColor(report.socialMedia.instagram)}">${report.socialMedia.instagram}</p></div>
            <div class="card"><p class="card-value">TikTok</p><p class="card-label" style="color: ${socialMediaStatusColor(report.socialMedia.tiktok)}">${report.socialMedia.tiktok}</p></div>
          </div>
        </div>
        <div class="section"><h2 class="section-title">📊 Comparaison Concurrentielle</h2>
          <table class="competitor-table"><thead><tr><th>Concurrent</th><th>Présence Digitale</th><th>Forces</th></tr></thead>
            <tbody>
              <tr><td><strong>${report.competitorComparison.competitorName}</strong></td><td style="color:green">✔ Site officiel</td><td>${report.competitorComparison.competitorStrengths}</td></tr>
              <tr><td><strong>${report.competitorComparison.targetName}</strong></td><td style="color:red">❌ Aucune vitrine officielle</td><td>${report.competitorComparison.targetState}</td></tr>
            </tbody>
          </table>
        </div>
        <div class="conclusion"><h3>Conclusion & Recommandation</h3><p>${report.conclusion}</p><p><strong>Recommandation :</strong> ${report.recommendation}</p></div>
        <div class="footer"><p>Rapport généré par Yonyalabs | yonyalabs.com</p></div>
      </div>
      </body></html>
    `;
  }
}