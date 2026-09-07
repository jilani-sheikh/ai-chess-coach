/**
 * Phase 6: Deterministic training puzzle extraction and attempt evaluation.
 *
 * Reuses existing Phase 3 Stockfish, CPL, and classification utilities.
 * No duplication of engine logic.
 */

import { Chess } from "chess.js";
import {
  StockfishSession,
  uciToSan,
} from "@/lib/chess/engine/stockfish";
import {
  calculateCentipawnLoss,
  CLASSIFICATION_THRESHOLDS,
} from "@/lib/chess/engine/classifier";
import type {
  AttemptResult,
  TrainingCategory,
  TrainingDifficulty,
  PuzzleContinuationStep,
  TrainingPuzzle,
} from "@/lib/chess/training-types";

// Re-export all shared types so consumers can import from one place
export type {
  AttemptResult,
  TrainingCategory,
  TrainingDifficulty,
  PuzzleContinuationStep,
  TrainingPuzzle,
} from "@/lib/chess/training-types";
export { aggregateStepResults } from "@/lib/chess/training-types";

export interface AttemptEvaluationResult {
  result: AttemptResult;
  cplAfter: number;               // CPL of user's attempted move vs engine best
  userMoveSan: string;            // Validated SAN of user's attempt
  bestMoveSan: string;            // Engine best SAN for the puzzle
  bestMoveUci: string;
  scoreAfterPawns: number;        // Stockfish score from White perspective after attempt
  mate: number | null;
}

// ── Category & Difficulty Determination ───────────────────────────────────

/**
 * Deterministically classifies a puzzle into a training category based on
 * position context (move number and CPL).
 */
export function determinePuzzleCategory(
  moveNumber: number,
  centipawnLoss: number,
  classification: string
): TrainingCategory {
  if (moveNumber <= 10) return "Opening Decisions";
  if (moveNumber >= 31) return "Endgame Decisions";

  // Middlegame: sub-classify by severity
  if (classification === "blunder" || centipawnLoss >= 200) {
    return "Blunder Prevention";
  }
  return "Tactical Awareness";
}

/**
 * Determines difficulty from centipawn loss magnitude.
 */
export function determineDifficulty(centipawnLoss: number): TrainingDifficulty {
  if (centipawnLoss >= 250) return "Fundamental";      // Very bad move
  if (centipawnLoss >= 100) return "Intermediate";
  return "Advanced";                                    // Subtle inaccuracy
}

// ── Puzzle Eligibility ─────────────────────────────────────────────────────

const MIN_CPL_FOR_PUZZLE = 60;

export function isPuzzleEligible(
  classification: string,
  centipawnLoss: number
): boolean {
  if (classification === "best" || classification === "good") return false;
  if (centipawnLoss < MIN_CPL_FOR_PUZZLE) return false;
  return true;
}

// ── FEN Before Mistake Reconstruction ─────────────────────────────────────

/**
 * Returns the FEN state before move at targetMoveIndex was played.
 */
export function getFenBeforeMove(
  moves: Array<{ san: string }>,
  targetMoveIndex: number
): string {
  const chess = new Chess();
  for (let i = 0; i < targetMoveIndex; i++) {
    chess.move(moves[i].san);
  }
  return chess.fen();
}

// ── Multi-Step Continuation Builder ───────────────────────────────────────

/**
 * Builds a multi-step puzzle continuation using Stockfish's principal variation (PV).
 *
 * Uses ONE evaluation at the setup position to extract the full PV —
 * no redundant per-ply searches. The PV alternates:
 *   USER[0] → OPP[0] → USER[1] → OPP[1] → USER[2]
 *
 * Stops early when:
 *   - PV is naturally shorter than maxUserMoves
 *   - Position is game-over after any move
 *   - A PV move is invalid (hash collision, rare)
 *
 * @param session - Caller-owned StockfishSession (init/destroy outside)
 * @param setupFen - Position where the user should find an improvement
 * @param maxUserMoves - Target user decisions (default 3, may be fewer)
 */
export async function buildPuzzleContinuation(
  session: StockfishSession,
  setupFen: string,
  maxUserMoves: number = 3
): Promise<PuzzleContinuationStep[]> {
  try {
    // Single deep evaluation — the PV contains the full continuation for free
    const evalResult = await session.evaluatePosition(setupFen, {
      depth: 16,
      timeoutMs: 12000,
    });

    const pvString = evalResult.pv ?? "";
    const pvMoves = pvString.trim().split(" ").filter((m) => m.length >= 4);

    // Fallback: PV empty but bestMove available → single step
    if (pvMoves.length === 0) {
      const bm = evalResult.bestMove;
      if (bm && bm !== "(none)") {
        const san = uciToSan(setupFen, bm);
        if (san) {
          return [
            {
              stepIndex: 0,
              fenBefore: setupFen,
              bestMoveUci: bm,
              bestMoveSan: san,
              opponentResponseUci: null,
              opponentResponseSan: null,
              fenAfterOpponent: null,
            },
          ];
        }
      }
      return [];
    }

    const steps: PuzzleContinuationStep[] = [];
    // Use chess.js to track running game state as we walk the PV
    const chess = new Chess(setupFen);

    for (let userIdx = 0; userIdx < maxUserMoves; userIdx++) {
      const userPvIdx = userIdx * 2;   // 0, 2, 4
      const oppPvIdx = userPvIdx + 1;  // 1, 3, 5

      if (userPvIdx >= pvMoves.length) break; // PV exhausted

      const fenBefore = chess.fen();
      const userMoveUci = pvMoves[userPvIdx];

      // Apply user's best PV move
      let bestMoveSan: string;
      try {
        const from = userMoveUci.slice(0, 2);
        const to = userMoveUci.slice(2, 4);
        const promotion = userMoveUci.length > 4 ? userMoveUci[4] : undefined;
        const mv = chess.move({ from, to, promotion });
        if (!mv) break;
        bestMoveSan = mv.san;
      } catch {
        break; // Invalid PV move — stop
      }

      // Check natural game end after user's best move (e.g. checkmate in 1)
      if (chess.isGameOver()) {
        steps.push({
          stepIndex: userIdx,
          fenBefore,
          bestMoveUci: userMoveUci,
          bestMoveSan,
          opponentResponseUci: null,
          opponentResponseSan: null,
          fenAfterOpponent: null,
        });
        break;
      }

      // Apply opponent PV response
      let opponentResponseUci: string | null = null;
      let opponentResponseSan: string | null = null;
      let fenAfterOpponent: string | null = null;

      if (oppPvIdx < pvMoves.length) {
        const oppMoveUci = pvMoves[oppPvIdx];
        try {
          const from = oppMoveUci.slice(0, 2);
          const to = oppMoveUci.slice(2, 4);
          const promotion = oppMoveUci.length > 4 ? oppMoveUci[4] : undefined;
          const oppMv = chess.move({ from, to, promotion });
          if (oppMv) {
            opponentResponseUci = oppMoveUci;
            opponentResponseSan = oppMv.san;
            fenAfterOpponent = chess.fen();
          }
        } catch {
          // PV opponent move invalid — stop continuation here
        }
      }

      steps.push({
        stepIndex: userIdx,
        fenBefore,
        bestMoveUci: userMoveUci,
        bestMoveSan,
        opponentResponseUci,
        opponentResponseSan,
        fenAfterOpponent,
      });

      // Stop if no valid opponent response or game ended
      if (!fenAfterOpponent || chess.isGameOver()) break;
    }

    return steps;
  } catch (err) {
    console.error("[buildPuzzleContinuation] Error:", err);
    return [];
  }
}

// ── Attempt Evaluation ─────────────────────────────────────────────────────

/**
 * Thresholds for accepting a training attempt:
 *   CORRECT:    Move exactly matches engine best move (UCI)
 *   ACCEPTABLE: CPL of user's move ≤ 40 (low-loss alternative)
 *   INCORRECT:  CPL > 40
 */
const ACCEPTABLE_CPL_THRESHOLD = 40;

/**
 * Evaluates a single-step training attempt against the engine.
 * Reuses StockfishSession and calculateCentipawnLoss from Phase 3.
 * Does NOT call Gemini.
 */
export async function evaluateTrainingAttempt(
  setupFen: string,
  userMoveSan: string,
  bestMoveUci: string,
  bestMoveSan: string
): Promise<AttemptEvaluationResult> {
  const chess = new Chess(setupFen);
  let validatedMove;
  try {
    validatedMove = chess.move(userMoveSan);
  } catch {
    throw new Error(`Invalid move "${userMoveSan}" in position ${setupFen}`);
  }
  if (!validatedMove) {
    throw new Error(`Move "${userMoveSan}" is illegal in position ${setupFen}`);
  }

  const userMoveUci = `${validatedMove.from}${validatedMove.to}${validatedMove.promotion ?? ""}`;
  const fenAfterAttempt = chess.fen();

  // Exact match → CORRECT immediately, no Stockfish call needed
  const isExactBest =
    userMoveUci === bestMoveUci ||
    validatedMove.san === bestMoveSan;

  if (isExactBest) {
    return {
      result: "CORRECT",
      cplAfter: 0,
      userMoveSan: validatedMove.san,
      bestMoveSan,
      bestMoveUci,
      scoreAfterPawns: 0,
      mate: null,
    };
  }

  // Non-exact: evaluate CPL via Stockfish
  const session = new StockfishSession();
  try {
    await session.init();

    const evalBefore = await session.evaluatePosition(setupFen, { depth: 10 });
    const evalAfter = await session.evaluatePosition(fenAfterAttempt, { depth: 10 });

    const sideToMove = setupFen.split(" ")[1] || "w";
    const moveColor = sideToMove as "w" | "b";

    const cplAfter = calculateCentipawnLoss(
      evalBefore.score,
      evalBefore.mate,
      evalAfter.score,
      evalAfter.mate,
      moveColor,
      false
    );

    const result: AttemptResult =
      cplAfter <= ACCEPTABLE_CPL_THRESHOLD ? "ACCEPTABLE" : "INCORRECT";

    return {
      result,
      cplAfter,
      userMoveSan: validatedMove.san,
      bestMoveSan,
      bestMoveUci,
      scoreAfterPawns: evalAfter.score,
      mate: evalAfter.mate,
    };
  } finally {
    session.destroy();
  }
}


// ── Puzzle Extraction from User Games ────────────────────────────────────

export interface PuzzleCandidate {
  gameId: string;
  gameWhite: string;
  gameBlack: string;
  userColor: "WHITE" | "BLACK";
  moveAnalysisId: string;
  moveIndex: number;
  moveNumber: number;
  san: string;
  bestMoveSan: string;
  bestMoveUci: string;
  centipawnLoss: number;
  classification: string;
  pgn: string;
}

/**
 * Builds a TrainingPuzzle skeleton from a candidate.
 * continuationSteps is initialized empty; caller must call buildPuzzleContinuation.
 */
export function buildPuzzleFromCandidate(
  candidate: PuzzleCandidate,
  pgnMoves: Array<{ san: string }>
): TrainingPuzzle {
  const setupFen = getFenBeforeMove(pgnMoves, candidate.moveIndex);
  const category = determinePuzzleCategory(
    candidate.moveNumber,
    candidate.centipawnLoss,
    candidate.classification
  );
  const difficulty = determineDifficulty(candidate.centipawnLoss);
  const userSideColor = candidate.userColor === "WHITE" ? "w" : "b";
  const opponentName =
    candidate.userColor === "WHITE" ? candidate.gameBlack : candidate.gameWhite;

  return {
    gameId: candidate.gameId,
    moveAnalysisId: candidate.moveAnalysisId,
    setupFen,
    originalMistakeSan: candidate.san,
    bestMoveSan: candidate.bestMoveSan,
    bestMoveUci: candidate.bestMoveUci,
    category,
    difficulty,
    centipawnLoss: candidate.centipawnLoss,
    classification: candidate.classification,
    moveNumber: candidate.moveNumber,
    userSideColor,
    opponentName,
    continuationSteps: [], // populated by buildPuzzleContinuation in server action
  };
}

// ── Category Recommendation from Profile Statistics ───────────────────────

export function recommendTrainingCategory(
  middlegameBlunders: number,
  endgameBlunders: number,
  openingBlunders: number,
  totalBlunders: number,
  totalGames: number
): TrainingCategory {
  if (totalGames === 0 || totalBlunders === 0) return "Mixed";
  if (middlegameBlunders >= endgameBlunders && middlegameBlunders >= openingBlunders) {
    return totalBlunders / totalGames >= 1.2
      ? "Blunder Prevention"
      : "Tactical Awareness";
  }
  if (endgameBlunders >= middlegameBlunders && endgameBlunders >= openingBlunders) {
    return "Endgame Decisions";
  }
  if (openingBlunders >= middlegameBlunders && openingBlunders >= endgameBlunders) {
    return "Opening Decisions";
  }
  return "Mixed";
}

// ── Re-exports ─────────────────────────────────────────────────────────────
export { CLASSIFICATION_THRESHOLDS, ACCEPTABLE_CPL_THRESHOLD };
