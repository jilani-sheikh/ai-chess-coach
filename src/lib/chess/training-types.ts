/**
 * Pure, client-safe training types and helpers.
 * NO Stockfish / Node.js imports here — safe to import from Client Components.
 */

export type AttemptResult = "CORRECT" | "ACCEPTABLE" | "INCORRECT";

export type TrainingCategory =
  | "Tactical Awareness"
  | "Blunder Prevention"
  | "Endgame Decisions"
  | "Opening Decisions"
  | "Mixed";

export type TrainingDifficulty = "Fundamental" | "Intermediate" | "Advanced";

export interface PuzzleContinuationStep {
  stepIndex: number;
  fenBefore: string;
  bestMoveUci: string;
  bestMoveSan: string;
  opponentResponseUci: string | null;
  opponentResponseSan: string | null;
  fenAfterOpponent: string | null;
}

export interface TrainingPuzzle {
  gameId: string;
  moveAnalysisId: string;
  setupFen: string;
  originalMistakeSan: string;
  bestMoveSan: string;
  bestMoveUci: string;
  category: TrainingCategory;
  difficulty: TrainingDifficulty;
  centipawnLoss: number;
  classification: string;
  moveNumber: number;
  userSideColor: "w" | "b";
  opponentName: string;
  continuationSteps: PuzzleContinuationStep[];
}

/** Aggregates per-step results: any INCORRECT → INCORRECT; all CORRECT → CORRECT; else ACCEPTABLE. */
export function aggregateStepResults(results: AttemptResult[]): AttemptResult {
  if (results.length === 0) return "INCORRECT";
  if (results.some((r) => r === "INCORRECT")) return "INCORRECT";
  if (results.every((r) => r === "CORRECT")) return "CORRECT";
  return "ACCEPTABLE";
}
