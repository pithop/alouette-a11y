// src/workers/ai.processor.ts

import { Result as AxeResult } from 'axe-core';

export interface ProcessedReport {
  executiveSummary: string;
  scoreExplanation: string;
  issueGroups: Array<{
    title: string;
    rgaaCriterion: string;
    impact: 'critical' | 'serious' | 'moderate';
    count: number;
    explanation: string;
    howToFix: string;
    exampleHtml: string;
    screenshot?: string;
  }>;
}

type MappedViolation = {
    id: string;
    impact: AxeResult['impact'];
    description: string;
    helpUrl: string;
    html: string;
    rgaa: { rgaa: string; name: string; };
    screenshot?: string;
};

export async function processViolationsWithAI(violations: MappedViolation[]): Promise<ProcessedReport> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set in environment variables.");

  const screenshotMap = new Map<string, string>();

  const violationsForAI = violations.map(v => {
    if (v.screenshot && v.html) {
      screenshotMap.set(v.html, v.screenshot);
    }
    const { screenshot, ...rest } = v;
    return rest;
  });

  // --- MODEL UPDATED ---
  // Switched to Gemini Flash 1.5 from your list.
  // It has a very large context window, solving the size limit error.
  const modelToUse = "google/gemini-flash-1.5";
  // ---------------------

  const systemPrompt = `
    Tu es un expert en accessibilité web (RGAA/WCAG) qui rédige des rapports pour des non-techniciens (mairies, PME).
    Je vais te fournir un tableau JSON de violations d'accessibilité brutes. Ta tâche est de transformer ces données en un rapport clair et actionnable en français.

    Règles:
    1. Regroupe les erreurs similaires en une seule entrée.
    2. Simplifie le langage. Pas de jargon technique.
    3. Fournis des solutions concrètes et simples.
    4. Pour chaque groupe, choisis UN SEUL exemple de code HTML ('exampleHtml') pour illustrer le problème.
    5. Rédige un "executiveSummary" concis (2-3 phrases) sur les problèmes critiques.
    6. Réponds UNIQUEMENT avec un objet JSON valide qui correspond à la structure TypeScript 'ProcessedReport' suivante, sans aucun autre texte, explication ou formatage.

    \`\`\`typescript
    interface ProcessedReport {
      executiveSummary: string;
      scoreExplanation: string;
      issueGroups: Array<{
        title: string;
        rgaaCriterion: string;
        impact: 'critical' | 'serious' | 'moderate';
        count: number;
        explanation: string;
        howToFix: string;
        exampleHtml: string;
      }>;
    }
    \`\`\`
  `;

  const userPrompt = `Voici les données de violations brutes à analyser: ${JSON.stringify(violationsForAI)}`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelToUse,
        messages: [ { role: "system", content: systemPrompt }, { role: "user", content: userPrompt } ],
        stream: false,
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenRouter API HTTP error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const jsonResponse = await response.json();

    if (!jsonResponse.choices || jsonResponse.choices.length === 0) {
      console.error("--- OpenRouter Error Response ---");
      console.error(JSON.stringify(jsonResponse, null, 2));
      const errorMessage = jsonResponse.error?.message || "The API response did not contain any 'choices'.";
      throw new Error(`OpenRouter API Error: ${errorMessage}`);
    }
    
    const messageContent = jsonResponse.choices[0].message.content;
    const cleanedJson = messageContent.replace(/```json/g, '').replace(/```/g, '').trim();
    const processedReport = JSON.parse(cleanedJson) as ProcessedReport;

    for (const group of processedReport.issueGroups) {
      if (screenshotMap.has(group.exampleHtml)) {
        group.screenshot = screenshotMap.get(group.exampleHtml);
      }
    }

    return processedReport;

  } catch (error) {
    console.error("Failed to process violations with OpenRouter:", error);
    throw new Error("Could not get a valid JSON response from the AI via OpenRouter.");
  }
}