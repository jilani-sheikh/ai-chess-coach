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
2. If the active move is a blunder, mistake, or inaccuracy, explain the concrete chess reason why (e.g. pinned piece, lost tempo, undefended squares, King safety, missed tactical sequence) and explain why the engine's recommended best move (${game.activeMove?.bestMoveSan || "the engine line"}) is superior.
3. If the active move is a best or good move, praise the idea and explain what strategic or tactical purpose it accomplishes.
4. Speak directly to the student as ${userSideName}. If reviewing an opponent's move, explain how it affects the student's position.
5. Keep your responses instructional, engaging, and concise (typically 2 to 4 focused paragraphs or key bullet points). Do not write repetitive boilerplate or lengthy walls of text.
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
            temperature: 0.7,
            maxOutputTokens: 800,
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
