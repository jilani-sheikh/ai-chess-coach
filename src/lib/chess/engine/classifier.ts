import { MoveClassification } from "./types";

/**
 * Classification thresholds in centipawns (configurable).
 */
export const CLASSIFICATION_THRESHOLDS = {
  BEST_MAX_CPL: 15,
  GOOD_MAX_CPL: 50,
  INACCURACY_MAX_CPL: 150,
  MISTAKE_MAX_CPL: 300,
} as const;

/**
 * Normalizes a score in pawns/mate to a clamped centipawn scale [-1000, +1000]
 * for move quality calculations, avoiding distortion in completely won/lost positions.
 */
export function normalizeToClampedCp(scoreInPawns: number, mate: number | null): number {
  if (mate !== null) {
    // mate > 0: White mates in N; mate < 0: Black mates in N
    return mate > 0 ? 1000 : -1000;
  }
  const cp = scoreInPawns * 100;
  return Math.max(-1000, Math.min(1000, cp));
}

/**
 * Calculates centipawn loss from the moving player's perspective.
 *
 * @param whiteScoreBefore White-perspective score before the move
 * @param whiteMateBefore White-perspective mate before the move (null if none)
 * @param whiteScoreAfter White-perspective score after the move
 * @param whiteMateAfter White-perspective mate after the move (null if none)
 * @param color Color of the player who made the move ('w' | 'b')
 * @param isBestMove Whether the played move matched the engine's suggested best move
 */
export function calculateCentipawnLoss(
  whiteScoreBefore: number,
  whiteMateBefore: number | null,
  whiteScoreAfter: number,
  whiteMateAfter: number | null,
  color: "w" | "b",
  isBestMove: boolean
): number {
  if (isBestMove) {
    return 0;
  }

  // Handle special mate transitions
  const isWhite = color === "w";
  const movingMateBefore = whiteMateBefore !== null ? (isWhite ? whiteMateBefore : -whiteMateBefore) : null;
  const movingMateAfter = whiteMateAfter !== null ? (isWhite ? whiteMateAfter : -whiteMateAfter) : null;

  // If player had a forced mate and still has a forced mate, negligible loss
  if (movingMateBefore !== null && movingMateBefore > 0 && movingMateAfter !== null && movingMateAfter > 0) {
    return 0;
  }

  // If player had a forced mate and blundered it away completely
  if (movingMateBefore !== null && movingMateBefore > 0 && (movingMateAfter === null || movingMateAfter < 0)) {
    return 600; // Major blunder penalty
  }

  // If opponent already had an unstoppable mate before the move
  if (movingMateBefore !== null && movingMateBefore < 0 && movingMateAfter !== null && movingMateAfter < 0) {
    return 0; // Position was already lost
  }

  // If player allowed opponent to find a forced mate
  if ((movingMateBefore === null || movingMateBefore > 0) && movingMateAfter !== null && movingMateAfter < 0) {
    return 600; // Blunder leading to forced mate
  }

  const cpBefore = normalizeToClampedCp(whiteScoreBefore, whiteMateBefore);
  const cpAfter = normalizeToClampedCp(whiteScoreAfter, whiteMateAfter);

  // Convert to moving player's perspective:
  // For White: higher White score is better, so loss = cpBefore - cpAfter
  // For Black: lower White score is better (higher Black score), so loss = (-cpBefore) - (-cpAfter) = cpAfter - cpBefore
  const movingLoss = isWhite ? cpBefore - cpAfter : cpAfter - cpBefore;

  // Centipawn loss is always non-negative and finite
  const loss = Math.max(0, Math.round(movingLoss));
  return Number.isFinite(loss) ? loss : 0;
}

/**
 * Classifies a move based on centipawn loss and engine best move match.
 */
export function classifyMove(centipawnLoss: number, isBestMove: boolean): MoveClassification {
  if (isBestMove || centipawnLoss <= CLASSIFICATION_THRESHOLDS.BEST_MAX_CPL) {
    return "best";
  }
  if (centipawnLoss <= CLASSIFICATION_THRESHOLDS.GOOD_MAX_CPL) {
    return "good";
  }
  if (centipawnLoss <= CLASSIFICATION_THRESHOLDS.INACCURACY_MAX_CPL) {
    return "inaccuracy";
  }
  if (centipawnLoss <= CLASSIFICATION_THRESHOLDS.MISTAKE_MAX_CPL) {
    return "mistake";
  }
  return "blunder";
}

/**
 * Project-defined move accuracy metric:
 * Accuracy = 100 * exp(-0.004 * CPL), bounded to [0, 100].
 * Explicitly project-defined and transparent.
 */
export function calculateMoveAccuracy(centipawnLoss: number): number {
  if (centipawnLoss <= 0) return 100;
  const acc = 100 * Math.exp(-0.004 * centipawnLoss);
  return Number(Math.max(0, Math.min(100, acc)).toFixed(1));
}

/**
 * Calculates average accuracy for a set of move accuracies.
 */
export function calculateAverageAccuracy(accuracies: number[]): number {
  if (accuracies.length === 0) return 100;
  const sum = accuracies.reduce((a, b) => a + b, 0);
  return Number((sum / accuracies.length).toFixed(1));
}

/**
 * Calculates Average Centipawn Loss (ACPL).
 */
export function calculateAcpl(cplList: number[]): number {
  if (cplList.length === 0) return 0;
  const sum = cplList.reduce((a, b) => a + b, 0);
  return Number((sum / cplList.length).toFixed(1));
}
