"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { parseAndValidatePgn } from "@/lib/chess/pgn";
import { StockfishSession } from "@/lib/chess/engine/stockfish";
import type {
  TrainingPuzzle,
  AttemptResult,
  TrainingCategory,
} from "@/lib/chess/training-types";
import {
  evaluateTrainingAttempt,
  buildPuzzleFromCandidate,
  buildPuzzleContinuation,
  aggregateStepResults,
  isPuzzleEligible,
  recommendTrainingCategory,
} from "@/lib/chess/training";
import type { PuzzleCandidate } from "@/lib/chess/training";
import { requestGeminiTrainingExplanation } from "@/lib/gemini/training";

// ── Shared helpers ──────────────────────────────────────────────────────────

async function getVerifiedUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

// ── Exported types ──────────────────────────────────────────────────────────

export interface TrainingStats {
  sessionsCompleted: number;
  puzzlesAttempted: number;
  puzzlesSolved: number;
  trainingAccuracy: number;
  categoryBreakdown: Record<string, { attempted: number; solved: number }>;
}

export interface TrainingDashboardData {
  stats: TrainingStats;
  recommendedCategory: TrainingCategory;
  availablePuzzleCount: number;
  hasEnoughGames: boolean;
}

export interface SessionStartResult {
  success: boolean;
  sessionId?: string;
  puzzles?: TrainingPuzzle[];
  error?: string;
}

/** Per-step evaluation result (no DB write). */
export interface PuzzleStepEvalResult {
  success: boolean;
  result?: AttemptResult;
  cplAfter?: number;
  userMoveSan?: string;
  error?: string;
}

/** Summary for persisting a completed puzzle attempt to DB. */
export interface CompletePuzzleAttemptParams {
  sessionId: string;
  puzzle: TrainingPuzzle;
  stepResults: Array<{
    result: AttemptResult;
    cplAfter: number;
    userMoveSan: string;
  }>;
}

export interface CompletePuzzleAttemptResult {
  success: boolean;
  aggregateResult?: AttemptResult;
  error?: string;
}

export interface ExplainAttemptResult {
  success: boolean;
  explanation?: string;
  error?: string;
}

export interface SessionCompleteResult {
  success: boolean;
  score?: number;
  total?: number;
  accuracy?: number;
  categoriesPracticed?: string[];
  error?: string;
}

// ── Dashboard Data ──────────────────────────────────────────────────────────

export async function getTrainingDashboardDataAction(): Promise<TrainingDashboardData> {
  const userId = await getVerifiedUserId();

  const [sessions, recentAttempts, gameStats] = await Promise.all([
    db.trainingSession.findMany({
      where: { userId, status: "COMPLETED" },
      select: { id: true, solvedCount: true, completedPuzzles: true, category: true },
    }),
    db.trainingAttempt.findMany({
      where: { userId },
      select: { result: true, category: true },
    }),
    db.game.findMany({
      where: {
        userId,
        userColor: { not: null },
        analysis: { status: "COMPLETED" },
      },
      select: {
        analysis: {
          select: {
            moves: {
              where: {
                classification: { in: ["blunder", "mistake", "inaccuracy"] },
                centipawnLoss: { gte: 60 },
              },
              select: { id: true },
            },
          },
        },
      },
    }),
  ]);

  const categoryBreakdown: Record<string, { attempted: number; solved: number }> = {};
  for (const attempt of recentAttempts) {
    const cat = attempt.category;
    if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { attempted: 0, solved: 0 };
    categoryBreakdown[cat].attempted += 1;
    if (attempt.result === "CORRECT" || attempt.result === "ACCEPTABLE") {
      categoryBreakdown[cat].solved += 1;
    }
  }

  const puzzlesAttempted = recentAttempts.length;
  const puzzlesSolved = recentAttempts.filter(
    (a) => a.result === "CORRECT" || a.result === "ACCEPTABLE"
  ).length;
  const trainingAccuracy =
    puzzlesAttempted > 0 ? Math.round((puzzlesSolved / puzzlesAttempted) * 100) : 0;

  const availablePuzzleCount = gameStats.reduce(
    (total, g) => total + (g.analysis?.moves.length ?? 0),
    0
  );

  // Recommend category from blunder phase distribution
  const phaseStats = await db.game.findMany({
    where: { userId, userColor: { not: null }, analysis: { status: "COMPLETED" } },
    select: {
      userColor: true,
      analysis: {
        select: {
          moves: {
            where: { classification: "blunder" },
            select: { moveNumber: true, color: true },
          },
        },
      },
    },
  });

  let openingBlunders = 0, middlegameBlunders = 0, endgameBlunders = 0, totalBlunders = 0;
  for (const game of phaseStats) {
    const userSide = game.userColor?.toUpperCase() === "WHITE" ? "w" : "b";
    for (const move of game.analysis?.moves ?? []) {
      if (move.color !== userSide) continue;
      totalBlunders++;
      if (move.moveNumber <= 10) openingBlunders++;
      else if (move.moveNumber <= 30) middlegameBlunders++;
      else endgameBlunders++;
    }
  }

  const recommendedCategory = recommendTrainingCategory(
    middlegameBlunders, endgameBlunders, openingBlunders, totalBlunders, phaseStats.length
  );

  return {
    stats: { sessionsCompleted: sessions.length, puzzlesAttempted, puzzlesSolved, trainingAccuracy, categoryBreakdown },
    recommendedCategory,
    availablePuzzleCount,
    hasEnoughGames: availablePuzzleCount >= 3,
  };
}

// ── Start a Training Session ────────────────────────────────────────────────

/**
 * Builds up to `count` training puzzles from the user's analyzed mistakes.
 * For each puzzle, runs ONE Stockfish evaluation to get the PV, then builds
 * up to 3 user-decision steps from the PV — no redundant per-ply searches.
 */
export async function startTrainingSessionAction(
  category: TrainingCategory = "Mixed",
  count: number = 5
): Promise<SessionStartResult> {
  const userId = await getVerifiedUserId();

  const games = await db.game.findMany({
    where: {
      userId,
      userColor: { not: null },
      analysis: { status: "COMPLETED" },
    },
    select: {
      id: true,
      pgn: true,
      white: true,
      black: true,
      userColor: true,
      analysis: {
        select: {
          moves: {
            where: {
              classification: { in: ["blunder", "mistake", "inaccuracy"] },
              centipawnLoss: { gte: 60 },
            },
            select: {
              id: true,
              moveIndex: true,
              moveNumber: true,
              san: true,
              centipawnLoss: true,
              classification: true,
              bestMoveSan: true,
              bestMove: true,
            },
            orderBy: { centipawnLoss: "desc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const candidates: PuzzleCandidate[] = [];

  for (const game of games) {
    if (!game.userColor || !game.analysis?.moves.length) continue;
    const userSide = game.userColor.toUpperCase() === "WHITE" ? "w" : "b";

    let pgnMoves: Array<{ san: string }> | null = null;
    try {
      const parsed = parseAndValidatePgn(game.pgn);
      pgnMoves = parsed.moves;
    } catch {
      continue;
    }

    for (const move of game.analysis.moves) {
      if (!isPuzzleEligible(move.classification, move.centipawnLoss)) continue;
      if (!move.bestMoveSan || !move.bestMove) continue;

      // Verify side to move matches the user's color
      try {
        const { Chess } = await import("chess.js");
        const chess = new Chess();
        for (let i = 0; i < move.moveIndex; i++) chess.move(pgnMoves![i].san);
        const fen = chess.fen();
        if (fen.split(" ")[1] !== userSide) continue; // skip opponent's move positions
      } catch {
        continue;
      }

      candidates.push({
        gameId: game.id,
        gameWhite: game.white,
        gameBlack: game.black,
        userColor: game.userColor.toUpperCase() as "WHITE" | "BLACK",
        moveAnalysisId: move.id,
        moveIndex: move.moveIndex,
        moveNumber: move.moveNumber,
        san: move.san,
        bestMoveSan: move.bestMoveSan,
        bestMoveUci: move.bestMove,
        centipawnLoss: move.centipawnLoss,
        classification: move.classification,
        pgn: game.pgn,
      });
    }
  }

  if (candidates.length === 0) {
    return { success: false, error: "No training puzzles found. Analyze more games first." };
  }

  // Shuffle and build puzzle skeletons
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  const skeletons: TrainingPuzzle[] = [];

  for (const candidate of shuffled) {
    if (skeletons.length >= count * 3) break; // over-select to allow category filtering
    try {
      const parsed = parseAndValidatePgn(candidate.pgn);
      const puzzle = buildPuzzleFromCandidate(candidate, parsed.moves);
      if (category !== "Mixed" && puzzle.category !== category) continue;
      skeletons.push(puzzle);
    } catch {
      // skip
    }
  }

  if (skeletons.length === 0) {
    return {
      success: false,
      error: `No ${category} puzzles available. Try Mixed or analyze more games.`,
    };
  }

  const selected = skeletons.slice(0, count);

  // ONE Stockfish session for all continuations (efficiency — reuse process)
  const sfSession = new StockfishSession();
  await sfSession.init();

  const finalPuzzles: TrainingPuzzle[] = [];
  try {
    for (const puzzle of selected) {
      let continuationSteps = await buildPuzzleContinuation(sfSession, puzzle.setupFen, 3);

      // Fallback: if continuation failed, use the stored bestMove as single-step
      if (continuationSteps.length === 0 && puzzle.bestMoveUci && puzzle.bestMoveSan) {
        continuationSteps = [
          {
            stepIndex: 0,
            fenBefore: puzzle.setupFen,
            bestMoveUci: puzzle.bestMoveUci,
            bestMoveSan: puzzle.bestMoveSan,
            opponentResponseUci: null,
            opponentResponseSan: null,
            fenAfterOpponent: null,
          },
        ];
      }

      if (continuationSteps.length > 0) {
        finalPuzzles.push({ ...puzzle, continuationSteps });
      }
    }
  } finally {
    sfSession.destroy();
  }

  if (finalPuzzles.length === 0) {
    return { success: false, error: "Failed to build training puzzles. Please try again." };
  }

  const session = await db.trainingSession.create({
    data: {
      userId,
      category,
      totalPuzzles: finalPuzzles.length,
      completedPuzzles: 0,
      solvedCount: 0,
      status: "ACTIVE",
    },
  });

  return { success: true, sessionId: session.id, puzzles: finalPuzzles };
}

// ── Submit a Single Puzzle Step (no DB write) ───────────────────────────────

/**
 * Evaluates ONE user decision step within a multi-step puzzle.
 * Uses Stockfish to compute CPL if the move is not the exact engine best.
 * Does NOT write to the database — call completePuzzleAttemptAction after all steps.
 */
export async function submitPuzzleStepAction(params: {
  sessionId: string;
  stepFen: string;
  userMoveSan: string;
  bestMoveUci: string;
  bestMoveSan: string;
}): Promise<PuzzleStepEvalResult> {
  const userId = await getVerifiedUserId();

  const session = await db.trainingSession.findUnique({
    where: { id: params.sessionId },
    select: { userId: true, status: true },
  });
  if (!session || session.userId !== userId) {
    return { success: false, error: "Session not found or access denied." };
  }
  if (session.status === "COMPLETED") {
    return { success: false, error: "Session already completed." };
  }

  try {
    const evalResult = await evaluateTrainingAttempt(
      params.stepFen,
      params.userMoveSan,
      params.bestMoveUci,
      params.bestMoveSan
    );
    return {
      success: true,
      result: evalResult.result,
      cplAfter: evalResult.cplAfter,
      userMoveSan: evalResult.userMoveSan,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Step evaluation failed.";
    return { success: false, error: msg };
  }
}

// ── Complete a Puzzle Attempt (writes to DB) ────────────────────────────────

/**
 * Called once per puzzle after all steps are completed (or skipped).
 * Aggregates step results, persists to TrainingAttempt, and updates session counters.
 */
export async function completePuzzleAttemptAction(
  params: CompletePuzzleAttemptParams
): Promise<CompletePuzzleAttemptResult> {
  const userId = await getVerifiedUserId();

  const session = await db.trainingSession.findUnique({
    where: { id: params.sessionId },
    select: { userId: true, status: true, completedPuzzles: true, solvedCount: true },
  });
  if (!session || session.userId !== userId) {
    return { success: false, error: "Session not found or access denied." };
  }

  const game = await db.game.findUnique({
    where: { id: params.puzzle.gameId },
    select: { userId: true },
  });
  if (!game || game.userId !== userId) {
    return { success: false, error: "Game access denied." };
  }

  const { stepResults, puzzle } = params;

  const aggregateResult = aggregateStepResults(stepResults.map((s) => s.result));
  const avgCpl =
    stepResults.length > 0
      ? Math.round(stepResults.reduce((sum, s) => sum + s.cplAfter, 0) / stepResults.length)
      : 0;

  const isSolved = aggregateResult !== "INCORRECT";
  const firstStep = stepResults[0];

  await db.trainingAttempt.create({
    data: {
      sessionId: params.sessionId,
      userId,
      gameId: puzzle.gameId,
      moveAnalysisId: puzzle.moveAnalysisId,
      setupFen: puzzle.setupFen,
      userMove: firstStep?.userMoveSan ?? "",
      bestMove: puzzle.bestMoveSan,
      bestMoveUci: puzzle.bestMoveUci,
      result: aggregateResult,
      cplAfter: avgCpl,
      category: puzzle.category,
      stepsCompleted: stepResults.length,
      stepsTotal: puzzle.continuationSteps.length,
    },
  });

  await db.trainingSession.update({
    where: { id: params.sessionId },
    data: {
      completedPuzzles: session.completedPuzzles + 1,
      solvedCount: session.solvedCount + (isSolved ? 1 : 0),
    },
  });

  return { success: true, aggregateResult };
}

// ── Explicit AI Explanation (on-demand only) ───────────────────────────────

/**
 * Called ONLY when the user clicks "Explain with AI".
 * Accepts full multi-step context so Gemini can cover the whole continuation.
 * Not persisted.
 */
export async function explainAttemptAction(params: {
  sessionId: string;
  puzzle: TrainingPuzzle;
  userMoveSan: string;    // First step's user move (for context)
  result: AttemptResult;
  cplAfter: number;
  stepSummary?: string;   // Optional multi-step narrative for Gemini
}): Promise<ExplainAttemptResult> {
  const userId = await getVerifiedUserId();

  const session = await db.trainingSession.findUnique({
    where: { id: params.sessionId },
    select: { userId: true },
  });
  if (!session || session.userId !== userId) {
    return { success: false, error: "Session not found or access denied." };
  }

  try {
    const explanation = await requestGeminiTrainingExplanation({
      setupFen: params.puzzle.setupFen,
      userMoveSan: params.userMoveSan,
      bestMoveSan: params.puzzle.bestMoveSan,
      bestMoveUci: params.puzzle.bestMoveUci,
      cplAfter: params.cplAfter,
      result: params.result,
      category: params.puzzle.category,
      moveNumber: params.puzzle.moveNumber,
      classification: params.puzzle.classification,
      originalMistakeSan: params.puzzle.originalMistakeSan,
      stepSummary: params.stepSummary,
    });
    return { success: true, explanation };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to generate explanation.";
    return { success: false, error: msg };
  }
}

// ── Complete a Session ──────────────────────────────────────────────────────

export async function completeTrainingSessionAction(
  sessionId: string
): Promise<SessionCompleteResult> {
  const userId = await getVerifiedUserId();

  const session = await db.trainingSession.findUnique({
    where: { id: sessionId },
    select: {
      userId: true,
      completedPuzzles: true,
      solvedCount: true,
      attempts: { select: { category: true, result: true } },
    },
  });
  if (!session || session.userId !== userId) {
    return { success: false, error: "Session not found or access denied." };
  }

  await db.trainingSession.update({
    where: { id: sessionId },
    data: { status: "COMPLETED" },
  });

  const categoriesPracticed = [...new Set(session.attempts.map((a) => a.category))];
  const total = session.completedPuzzles;
  const score = session.solvedCount;
  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;

  return { success: true, score, total, accuracy, categoriesPracticed };
}
