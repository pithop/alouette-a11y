// src/workers/report.processor.tsx

import { chromium } from 'playwright';
import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { renderToStaticMarkup } from 'react-dom/server';
import { EmailTemplate } from '@/app/components/EmailTemplate';
import { ReportTemplate } from '@/app/components/ReportTemplate';
import { ProcessedReport } from './ai.processor';
import React from 'react';

export class ReportProcessor {
  async generate(siteUrl: string, results: ProcessedReport): Promise<Buffer> {
    let browser = null;
    try {
      browser = await chromium.launch({ args: ['--no-sandbox'] });
      const page = await browser.newPage();
      
      const reportHtml = renderToStaticMarkup(
        <ReportTemplate siteUrl={siteUrl} results={results} />
      );

      await page.setContent(reportHtml, { waitUntil: 'networkidle' });
      return await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      });
    } finally {
      if (browser) await browser.close();
    }
  }

  async sendEmail(to: string, siteUrl: string, results: ProcessedReport, pdfBuffer: Buffer) {
    if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
      throw new Error('Missing email credentials in environment variables');
    }

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_SERVER_PORT) || 587,
        secure: false, // Port 587 uses STARTTLS
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
    });

    try {
      await transporter.verify();
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      throw new Error(`SMTP connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const totalIssues = results.issueGroups.reduce((acc, group) => acc + group.count, 0);
    const score = Math.max(0, 100 - totalIssues * 5);

    // FIX: Add 'await' here because render() is now an async function
    const emailHtml = await render(
      <EmailTemplate 
        siteUrl={siteUrl} 
        score={score}
        totalViolations={totalIssues}
        summary={results.executiveSummary}
      />
    );
    
    try {
      console.log(`Sending email to ${to}...`);
      await transporter.sendMail({
          from: `"Alouette A11Y" <${process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER}>`,
          to: to,
          subject: `Votre rapport d'audit RGAA pour ${siteUrl} est prêt !`,
          html: emailHtml,
          attachments: [{
              filename: 'rapport-accessibilite.pdf',
              content: pdfBuffer,
              contentType: 'application/pdf',
          }],
      });
      console.log(`Email successfully sent to ${to}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error(`Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}