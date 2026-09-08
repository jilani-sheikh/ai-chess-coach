/**
 * Server-side Gemini AI Chess Coach Service
 * Strictly grounds coach explanations in Stockfish evaluation data.
 */

export interface CoachMessage {
  role: "user" | "model";
  text: string;
}

export interface ActiveMoveContext {
  moveIndex: number;
  moveNumber?: number;
  color?: string; // "w" | "b"
  san?: string;
  fen?: string;
  score?: number; // Normalized to White's perspective in pawns/centipawns
  mate?: number | null;
  evalType?: string; // "cp" | "mate"
  centipawnLoss?: number;
  classification?: string; // "best" | "good" | "inaccuracy" | "mistake" | "blunder"
  bestMove?: string; // UCI format e.g. "e2e4"
  bestMoveSan?: string | null; // SAN format e.g. "e4"
  playedMove?: string;
}

export interface MinimalGameContext {
  white: string;
  black: string;
  result: string;
  event?: string | null;
  userColor?: "WHITE" | "BLACK" | null;
  activeMove?: ActiveMoveContext | null;
}

export interface AskCoachParams {
  game: MinimalGameContext;
  messages: CoachMessage[];
  userPrompt: string;
}

const SUPPORTED_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-flash-latest",
].filter((m): m is string => Boolean(m && m.trim().length > 0));

function buildSystemInstruction(game: MinimalGameContext): string {
  const userColor = game.userColor || "WHITE";
  const userSideName = userColor === "WHITE" ? "White" : "Black";
  const opponentSideName = userColor === "WHITE" ? "Black" : "White";
  const userPlayer = userColor === "WHITE" ? game.white : game.black;
  const opponentPlayer = userColor === "WHITE" ? game.black : game.white;

  let moveContextStr = "The user is viewing the starting position (before move 1).";

  if (game.activeMove && game.activeMove.moveIndex >= 0) {
    const m = game.activeMove;
    const moveColorName = m.color === "w" ? "White" : "Black";
    const isPlayerMove =
      (userColor === "WHITE" && m.color === "w") ||
      (userColor === "BLACK" && m.color === "b");

    const evalStr =
      m.evalType === "mate" && m.mate !== null && m.mate !== undefined
        ? `Mate in ${Math.abs(m.mate)} (${m.mate > 0 ? "White mates" : "Black mates"})`
        : m.score !== undefined
        ? `${m.score > 0 ? "+" : ""}${m.score.toFixed(2)} pawns (from White perspective)`
        : "Evaluation not available";

    moveContextStr = `
CURRENT MOVE BEING INSPECTED:
- Move: ${m.moveNumber ? `${m.moveNumber}. ` : ""}${m.san || m.playedMove || "Unknown"}
- Played by: ${moveColorName} (${isPlayerMove ? "User's move" : "Opponent's move"})
- Position FEN: ${m.fen || "N/A"}
- Stockfish Evaluation: ${evalStr}
- Stockfish Classification: ${m.classification ? m.classification.toUpperCase() : "UNCLASSIFIED"}
- Centipawn Loss (CPL): ${m.centipawnLoss ?? 0}
- Engine's Best Move: ${m.bestMoveSan || m.bestMove || "None indicated"}
`.trim();
  }

  return `
You are a Grandmaster Chess Coach ("AI Chess Coach") reviewing a completed game with a student.

MATCHUP:
- White: ${game.white}
- Black: ${game.black}
- Result: ${game.result}
- Student's Side: ${userSideName} (${userPlayer})
- Opponent: ${opponentSideName} (${opponentPlayer})

${moveContextStr}

STRICT COACHING GUIDELINES:
1. Stockfish is the absolute source of truth. NEVER contradict, alter, or invent engine evaluations, classifications, centipawn losses, or best moves.
2. When answering why a move was a blunder, mistake, or inaccuracy, provide one complete, self-contained explanation structured with clear markdown sections:
   - Why the move was flawed/inaccurate
   - What changed in the position or evaluation
   - What Stockfish preferred (${game.activeMove?.bestMoveSan || "the engine line"})
   - Key chess reasoning
   - Practical takeaway for future games
3. For general questions or non-mistake moves, adapt your structure naturally while ensuring your answer is complete, instructional, and self-contained in one response.
4. Speak directly to the student as ${userSideName}.
5. Use markdown formatting cleanly: subheadings (###), bold text for moves (**${game.activeMove?.san || "move"}**), and concise bullet lists. Always finish your thoughts completely.
`.trim();
}

export async function requestGeminiCoachResponse({
  game,
  messages,
  userPrompt,
}: AskCoachParams): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  const systemInstructionText = buildSystemInstruction(game);

  // Keep conversation history bounded to recent turns to avoid bloat
  const recentHistory = messages.slice(-8);

  // Format Gemini API contents
  const contents: Array<{
    role: "user" | "model";
    parts: Array<{ text: string }>;
  }> = [];

  for (const msg of recentHistory) {
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    });
  }

  // Add the current prompt
  contents.push({
    role: "user",
    parts: [{ text: userPrompt }],
  });

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
            parts: [{ text: systemInstructionText }],
          },
          contents,
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

        // If model not found or deprecated, try next candidate model
        if (response.status === 404 || errMsg.toLowerCase().includes("not found")) {
          lastError = new Error(`Model ${model} unavailable: ${errMsg}`);
          continue;
        }

        throw new Error(`Gemini API error: ${errMsg}`);
      }

      const data = await response.json();
      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I was unable to generate coaching feedback for this position.";

      return text.trim();
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // If error is network or non-404, we still try next model if available
      continue;
    }
  }

  throw lastError || new Error("Failed to get a response from Gemini Coach.");
}
