// src/workers/restaurant.ai.processor.ts

// Interface pour les données que nous collectons (plus riche)
export interface RestaurantData {
  googleData: {
    name?: string;
    rating?: number;
    reviewCount?: number;
    address?: string;
    reviews?: string[]; // On ajoute les textes des avis
  };
  websiteData: {
    url?: string;
    hasInstagram?: boolean;
    hasFacebook?: boolean;
    hasTikTok?: boolean; // On ajoute TikTok
    hasTheFork?: boolean;
    hasUberEats?: boolean;
  };
}

// Nouvelle interface pour le rapport, correspondant à votre modèle
export interface RestaurantReport {
  googlePresence: {
    rating: number;
    reviewCount: number;
    negativeKeywords: string[];
  };
  website: {
    status: 'Identifié' | 'Tiers' | 'Aucun';
    url?: string;
    analysis: string;
  };
  socialMedia: {
    facebook: 'Actif' | 'Inactif' | 'Absent';
    instagram: 'Actif' | 'Inactif' | 'Absent';
    tiktok: 'Actif' | 'Inactif' | 'Absent';
  };
  competitorComparison: {
    targetName: string;
    targetState: string;
    competitorName: string;
    competitorStrengths: string;
  };
  conclusion: string;
  recommendation: string;
}

export async function generateRestaurantReportWithAI(data: RestaurantData): Promise<RestaurantReport> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set.");

  const modelToUse = "google/gemini-flash-1.5";

  const systemPrompt = `
    Tu es un consultant expert pour Yonyalabs. Ton but est de générer un audit de présence digitale pour un restaurant en analysant des données brutes. Sois direct, professionnel et orienté solution.
    
    Règles :
    1.  **Présence Google :** Analyse les textes des avis (reviews) pour détecter 1 à 3 mots-clés ou thèmes négatifs récurrents (ex: "cher", "longue attente", "service lent", "piège à touristes"). S'il n'y en a pas, retourne un tableau vide.
    2.  **Site Web :**
        - Si un URL existe mais contient "res-menu.com", "linktr.ee", etc., considère-le comme 'Tiers'.
        - Si aucun URL n'est fourni, mets le statut 'Aucun'.
        - Sinon, mets 'Identifié'.
        - Rédige une brève analyse des conséquences (perte de contrôle, marges...).
    3.  **Réseaux Sociaux :** Pour Facebook, Instagram, et TikTok, si le lien existe, mets le statut 'Actif'. Sinon, mets 'Absent'.
    4.  **Comparaison Concurrentielle :** Crée une comparaison simple. Utilise le nom du restaurant cible. Pour le concurrent, utilise un nom crédible comme "Le Petit Pontoise". Décris sa force principale (site moderne, réservation en ligne). Pour le restaurant cible, résume sa situation (dépendance, pas de site...).
    5.  **Conclusion & Recommandation :** Rédige une conclusion qui commence par un point positif puis identifie le problème principal. La recommandation doit être une action claire et unique menant vers les services de Yonyalabs.
    6.  **Réponds UNIQUEMENT avec un objet JSON** qui correspond parfaitement à la structure TypeScript 'RestaurantReport'.
    
    \`\`\`typescript
    // La structure JSON de sortie attendue
    export interface RestaurantReport {
      googlePresence: { rating: number; reviewCount: number; negativeKeywords: string[]; };
      website: { status: 'Identifié' | 'Tiers' | 'Aucun'; url?: string; analysis: string; };
      socialMedia: { facebook: 'Actif' | 'Inactif' | 'Absent'; instagram: 'Actif' | 'Inactif' | 'Absent'; tiktok: 'Actif' | 'Inactif' | 'Absent'; };
      competitorComparison: { targetName: string; targetState: string; competitorName: string; competitorStrengths: string; };
      conclusion: string;
      recommendation: string;
    }
    \`\`\`
  `;
  
  const userPrompt = `Génère l'audit pour le restaurant en utilisant ces données : ${JSON.stringify(data)}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelToUse,
        messages: [ { role: "system", content: systemPrompt }, { role: "user", content: userPrompt } ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenRouter API HTTP error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const jsonResponse = await response.json();
    const messageContent = jsonResponse.choices[0].message.content;
    return JSON.parse(messageContent) as RestaurantReport;
}