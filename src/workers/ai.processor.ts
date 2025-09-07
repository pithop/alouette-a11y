// src/workers/ai.processor.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Result as AxeResult } from 'axe-core';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

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
  }>;
}

// FIX: Add a specific type for the violations array
type MappedViolation = {
    id: string;
    impact: AxeResult['impact'];
    description: string;
    helpUrl: string;
    html: string;
    rgaa: { rgaa: string; name: string; };
};

export async function processViolationsWithAI(violations: MappedViolation[]): Promise<ProcessedReport> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Tu es un expert en accessibilité web (RGAA/WCAG) qui rédige des rapports pour des non-techniciens (mairies, PME).
    Je vais te fournir un tableau JSON de violations d'accessibilité brutes provenant de l'outil Axe-Core.
    Ta tâche est de transformer ces données brutes en un rapport clair, concis et actionnable en français.

    Voici les règles :
    1.  **Regroupe les erreurs similaires** : Si plusieurs violations concernent le même composant (ex: le même bouton avec un problème de contraste sur 5 pages), regroupe-les en une seule entrée.
    2.  **Simplifie le langage** : N'utilise pas de jargon technique. Explique chaque problème comme si tu parlais à un chef de projet, pas à un développeur.
    3.  **Fournis des solutions concrètes** : Pour chaque groupe de problèmes, donne une recommandation claire et simple sur la manière de le corriger.
    4.  **Rédige un résumé** : Commence par un "executiveSummary" qui résume en 2-3 phrases les problèmes les plus critiques.
    5.  **Sois concis** : Le but est d'aider, pas de submerger.
    6.  **Réponds UNIQUEMENT avec un objet JSON** valide qui correspond à la structure TypeScript 'ProcessedReport' suivante, sans aucun autre texte ou formatage.

    \`\`\`typescript
    interface ProcessedReport {
      executiveSummary: string; // Résumé en 2-3 phrases des problèmes les plus importants.
      scoreExplanation: string; // Explique brièvement ce que le score signifie.
      issueGroups: Array<{
        title: string; // Un titre descriptif pour le groupe de problèmes (ex: "Les images de la galerie n'ont pas de description").
        rgaaCriterion: string; // Le critère RGAA principal (ex: "RGAA 3.3").
        impact: 'critical' | 'serious' | 'moderate'; // L'impact le plus élevé du groupe.
        count: number; // Le nombre d'occurrences de ce problème.
        explanation: string; // Explication simple du problème en français.
        howToFix: string; // Guide simple pour corriger le problème en français.
        exampleHtml: string; // Un seul extrait de code HTML représentatif du problème.
      }>;
    }
    \`\`\`

    Voici les données de violations brutes :
    ${JSON.stringify(violations)}
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  const jsonResponse = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
  
  try {
    return JSON.parse(jsonResponse) as ProcessedReport;
  } catch (e) {
    console.error("Failed to parse Gemini's JSON response:", e);
    console.error("Raw response was:", responseText);
    throw new Error("Could not get a valid JSON response from the AI.");
  }
}