import { Chess } from "chess.js";

export interface ParsedPgnMetadata {
  white: string;
  black: string;
  result: string;
  event: string | null;
  site: string | null;
  round: string | null;
  playedAt: Date | null;
  totalMoves: number;
}

export interface ParsedMoveStep {
  index: number;
  moveNumber: number;
  color: "w" | "b";
  san: string;
  fen: string;
  from: string;
  to: string;
  piece: string;
}

export interface ParsedGameFull {
  metadata: ParsedPgnMetadata;
  moves: ParsedMoveStep[];
  startFen: string;
}

/**
 * Sanitizes PGN text for chess.js 1.4.0's internal parser by stripping
 * brace comments {...} and semicolon comments ;... from the movetext section
 * while strictly preserving header tag pairs and quoted values.
 * Throws if unclosed comment braces or unmatched closing braces are detected.
 */
function sanitizePgnForChessJs(pgn: string): string {
  let result = "";
  let inHeader = false;
  let inHeaderString = false;
  let inComment = false;
  let inLineComment = false;

  for (let i = 0; i < pgn.length; i++) {
    const char = pgn[i];

    if (inLineComment) {
      if (char === "\n" || char === "\r") {
        inLineComment = false;
        result += char;
      }
      continue;
    }

    if (inComment) {
      if (char === "}") {
        inComment = false;
        result += " ";
      }
      continue;
    }

    if (inHeader) {
      result += char;
      if (char === '"' && pgn[i - 1] !== "\\") {
        inHeaderString = !inHeaderString;
      } else if (char === "]" && !inHeaderString) {
        inHeader = false;
      }
      continue;
    }

    if (char === "[") {
      inHeader = true;
      result += char;
    } else if (char === "{") {
      inComment = true;
    } else if (char === "}") {
      throw new Error("Invalid PGN file: Unmatched '}' found outside comment.");
    } else if (char === ";") {
      inLineComment = true;
      result += " ";
    } else {
      result += char;
    }
  }

  if (inComment) {
    throw new Error("Invalid PGN file: Unclosed comment '{'.");
  }

  return result;
}

/**
 * Validates and parses a raw PGN string.
 * Throws an error if PGN is invalid or empty.
 */
export function parseAndValidatePgn(pgnText: string): ParsedGameFull {
  const trimmed = pgnText?.trim();
  if (!trimmed) {
    throw new Error("PGN content cannot be empty.");
  }

  const sanitized = sanitizePgnForChessJs(trimmed);

  const chess = new Chess();
  try {
    chess.loadPgn(sanitized);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to parse PGN";
    throw new Error(`Invalid PGN file: ${msg}`);
  }

  // Get headers from chess.js
  const headerMap = chess.header();

  const white = headerMap["White"] && headerMap["White"] !== "?" ? headerMap["White"] : "White Player";
  const black = headerMap["Black"] && headerMap["Black"] !== "?" ? headerMap["Black"] : "Black Player";
  const rawResult = headerMap["Result"] || "*";
  
  // Normalize result
  let result = rawResult;
  if (result !== "1-0" && result !== "0-1" && result !== "1/2-1/2") {
    result = rawResult;
  }

  const event = headerMap["Event"] && headerMap["Event"] !== "?" ? headerMap["Event"] : null;
  const site = headerMap["Site"] && headerMap["Site"] !== "?" ? headerMap["Site"] : null;
  const round = headerMap["Round"] && headerMap["Round"] !== "?" ? headerMap["Round"] : null;
  
  let playedAt: Date | null = null;
  const rawDate = headerMap["Date"];
  if (rawDate && rawDate !== "????.??.??" && rawDate !== "????.??") {
    const parts = rawDate.split(".");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && y > 1800) {
        playedAt = new Date(Date.UTC(y, isNaN(m) ? 0 : m - 1, isNaN(d) ? 1 : d));
      }
    }
  }

  // Extract moves and compute FEN history dynamically at runtime
  const history = chess.history({ verbose: true });
  const totalMoves = history.length;

  // Replay moves from start position to capture intermediate FENs
  const replayChess = new Chess();
  const startFen = replayChess.fen();
  
  const moves: ParsedMoveStep[] = history.map(
    (m: { san: string; color: "w" | "b"; from: string; to: string; piece: string }, idx: number) => {
      replayChess.move(m.san);
      return {
        index: idx,
        moveNumber: Math.floor(idx / 2) + 1,
        color: m.color,
        san: m.san,
        fen: replayChess.fen(),
        from: m.from,
        to: m.to,
        piece: m.piece,
      };
    }
  );

  return {
    metadata: {
      white,
      black,
      result,
      event,
      site,
      round,
      playedAt,
      totalMoves,
    },
    moves,
    startFen,
  };
}
