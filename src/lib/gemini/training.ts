/**
 * Phase 6: Server-side Gemini service for explaining training attempt results.
 * Called ONLY on explicit user request ("Explain with AI"), never automatically.
 */

const SUPPORTED_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-flash-latest",
].filter((m): m is string => Boolean(m && m.trim().length > 0));

export interface TrainingExplainParams {
  setupFen: string;
  userMoveSan: string;
  bestMoveSan: string;
  bestMoveUci: string;
  cplAfter: number;
  result: "CORRECT" | "ACCEPTABLE" | "INCORRECT";
  category: string;
  moveNumber: number;
  classification: string;   // Original mistake classification (blunder/mistake/inaccuracy)
  originalMistakeSan: string;
  stepSummary?: string; // Optional multi-step context for the full continuation
}

export async function requestGeminiTrainingExplanation(
  params: TrainingExplainParams
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  const {
    setupFen,
    userMoveSan,
    bestMoveSan,
    cplAfter,
    result,
    category,
    moveNumber,
    classification,
    originalMistakeSan,
    stepSummary,
  } = params;

  const resultLabel =
    result === "CORRECT"
      ? "correctly found the engine's best move"
      : result === "ACCEPTABLE"
      ? "found an acceptable alternative with low centipawn loss"
      : "chose a suboptimal move";

  const multiStepSection = stepSummary
    ? `\n\nFULL CONTINUATION BREAKDOWN:\n${stepSummary}`
    : "";

  const systemInstruction = `
You are a Grandmaster Chess Coach ("AI Coach") explaining a training drill to a student.

STRICT GROUNDING RULES:
1. Base your explanation entirely on the provided FEN, moves, and Stockfish evaluations.
2. NEVER invent or alter engine evaluations, centipawn losses, or move quality assessments.
3. Be concise, educational, and actionable. Target 2–3 short paragraphs.
4. If the student's move was CORRECT or ACCEPTABLE, acknowledge their success then explain the key idea.
5. If the student's move was INCORRECT, explain in concrete chess terms why the attempted move falls short and what makes the recommended move better.
`.trim();

  const userPrompt = `
TRAINING DRILL REVIEW — Category: ${category}

Original Position (Move ${moveNumber}): ${setupFen}
Original game mistake: ${originalMistakeSan} (${classification})
Engine's best move for this puzzle: ${bestMoveSan}

Student's first move attempt: ${userMoveSan}
Overall outcome: The student ${resultLabel}.
Centipawn loss (step 1 vs engine best): ${cplAfter} CPL${multiStepSection}

Please explain the key chess ideas in this position and the continuation. Focus on concrete tactical or strategic themes that the student should remember.${result === "INCORRECT" ? ` Explain what makes ${bestMoveSan} superior and what the student missed.` : " Acknowledge their success and reinforce the key idea."}
`.trim();

  let lastError: Error | null = null;

  for (const model of SUPPORTED_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.65, maxOutputTokens: 600 },
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
        "Unable to generate an explanation for this position.";

      return text.trim();
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      continue;
    }
  }

  throw lastError || new Error("Failed to generate Gemini training explanation.");
}
