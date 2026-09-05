export type MoveClassification = "best" | "good" | "inaccuracy" | "mistake" | "blunder";

export interface EngineEvaluationResult {
  fen: string;
  depth: number;
  bestMove: string; // UCI format e.g. "e2e4"
  bestMoveSan?: string | null; // SAN format e.g. "e4"
  evalType: "cp" | "mate";
  score: number; // Normalized to White perspective in pawns (e.g. +1.25 = White +1.25 pawns, -0.80 = Black +0.80 pawns)
  mate: number | null; // Mate in N moves (+ = White mates, - = Black mates, null if not mate)
  pv?: string;
}

export interface AnalyzedMove {
  moveIndex: number;
  moveNumber: number;
  color: "w" | "b";
  san: string;
  fen: string;
  score: number; // White perspective
  mate: number | null;
  evalType: "cp" | "mate";
  bestMove: string; // UCI
  bestMoveSan: string | null;
  playedMove: string; // SAN
  centipawnLoss: number; // Non-negative loss in centipawns
  classification: MoveClassification;
  accuracy: number; // 0 - 100%
}

export interface GameAnalysisSummary {
  engine: string;
  depth: number;
  accuracy: number;
  whiteAccuracy: number;
  blackAccuracy: number;
  acpl: number;
  whiteAcpl: number;
  blackAcpl: number;
  inaccuracies: number;
  mistakes: number;
  blunders: number;
  whiteInaccuracies: number;
  whiteMistakes: number;
  whiteBlunders: number;
  blackInaccuracies: number;
  blackMistakes: number;
  blackBlunders: number;
  moves: AnalyzedMove[];
}

export interface EngineOptions {
  depth?: number;
  timeoutMs?: number;
}
