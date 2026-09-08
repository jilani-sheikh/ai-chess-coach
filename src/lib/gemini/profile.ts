/**
 * Server-side Gemini AI Service for Player Performance & Coaching Insights
 * Strictly grounds coaching summaries in deterministically calculated game statistics.
 */

export interface PlayerPerformanceSummary {
  playerName: string;
  totalAnalyzedGames: number;
  overallAccuracy: number;
  overallAcpl: number;
  totalInaccuracies: number;
  totalMistakes: number;
  totalBlunders: number;
  whiteStats: {
    games: number;
    accuracy: number;
    acpl: number;
    winRate: number;
    blunders: number;
  };
  blackStats: {
    games: number;
    accuracy: number;
    acpl: number;
    winRate: number;
    blunders: number;
  };
  phaseStats: {
    openingAccuracy: number;
    openingBlunders: number;
    middlegameAccuracy: number;
    middlegameBlunders: number;
    endgameAccuracy: number;
    endgameBlunders: number;
  };
  topStrengths: string[];
  topWeaknesses: string[];
}

const SUPPORTED_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-flash-latest",
].filter((m): m is string => Boolean(m && m.trim().length > 0));

export async function requestGeminiProfileInsights(
  stats: PlayerPerformanceSummary
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  // Enforce threshold: At least 3 analyzed games required for personalized coach insights
  if (stats.totalAnalyzedGames < 3) {
    return "Analyze more games to unlock personalized insights.";
  }

  const systemInstruction = `
You are a World-Class Grandmaster Chess Coach ("AI Chess Coach") delivering an executive performance debrief for your student, ${stats.playerName}.

STRICT GROUNDING RULES:
1. All numbers, percentages, mistake counts, and phases provided below are computed directly from the student's Stockfish engine evaluations.
2. NEVER contradict, inflate, or invent statistics, ratings, or blunder totals.
3. Your tone must be inspiring, constructive, authoritative, and tactically precise.
4. Structure your response into 5 clear, complete markdown sections:
   - ### ♟️ Overall Assessment (Synthesis of playing style, precision, and level based on ${stats.overallAccuracy}% accuracy and ${stats.overallAcpl} ACPL)
   - ### ⚔️ Strengths (Key tactical and strategic areas where they excel)
   - ### ⚠️ Main Weaknesses (Primary error sources leaking centipawns or blunders)
   - ### 🎯 Critical Moments & Disparities (White vs Black balance and Opening/Middlegame/Endgame phase dynamics)
   - ### 💡 Practical Recommendations (3 actionable training habits to address top weaknesses)
5. Ensure the report is thorough, completely finished in one response, and highly readable.
`.trim();

  const userPrompt = `
Here are my verified Stockfish match statistics across ${stats.totalAnalyzedGames} analyzed games:

OVERALL METRICS:
- Analyzed Games: ${stats.totalAnalyzedGames}
- Average Accuracy: ${stats.overallAccuracy}%
- Average Centipawn Loss (ACPL): ${stats.overallAcpl}
- Total Errors: ${stats.totalBlunders} Blunders, ${stats.totalMistakes} Mistakes, ${stats.totalInaccuracies} Inaccuracies

COLOR BREAKDOWN:
- White: ${stats.whiteStats.games} games | ${stats.whiteStats.accuracy}% accuracy | ${stats.whiteStats.acpl} ACPL | ${stats.whiteStats.winRate}% win rate | ${stats.whiteStats.blunders} blunders
- Black: ${stats.blackStats.games} games | ${stats.blackStats.accuracy}% accuracy | ${stats.blackStats.acpl} ACPL | ${stats.blackStats.winRate}% win rate | ${stats.blackStats.blunders} blunders

GAME PHASE BREAKDOWN:
- Opening (Moves 1-10): ${stats.phaseStats.openingAccuracy}% accuracy (${stats.phaseStats.openingBlunders} blunders)
- Middlegame (Moves 11-30): ${stats.phaseStats.middlegameAccuracy}% accuracy (${stats.phaseStats.middlegameBlunders} blunders)
- Endgame (Moves 31+): ${stats.phaseStats.endgameAccuracy}% accuracy (${stats.phaseStats.endgameBlunders} blunders)

IDENTIFIED SYSTEM PATTERNS:
- Strengths: ${stats.topStrengths.length > 0 ? stats.topStrengths.join("; ") : "Consistent overall performance across basic play"}
- Critical Areas to Improve: ${stats.topWeaknesses.length > 0 ? stats.topWeaknesses.join("; ") : "Refining endgame conversions and tightening defense"}

Please deliver my personalized coaching debrief.
`.trim();

  let lastError: Error | null = null;

  for (const model of SUPPORTED_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.65,
            maxOutputTokens: 1200,
          },
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errMsg =
          (errJson as { error?: { message?: string } })?.error?.message ||
          `HTTP ${response.status} ${response.statusText}`;

        if (response.status === 404 || errMsg.toLowerCase().includes("not found")) {
          lastError = new Error(`Model ${model} unavailable: ${errMsg}`);
          continue;
        }

        throw new Error(`Gemini API error: ${errMsg}`);
      }

      const data = await response.json();
      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I was unable to synthesize coaching insights for your profile at this time.";

      return text.trim();
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      continue;
    }
  }

  throw lastError || new Error("Failed to generate AI profile insights.");
}
