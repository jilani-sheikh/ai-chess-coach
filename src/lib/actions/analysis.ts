"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { analyzeGamePgn } from "@/lib/chess/engine";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export interface AnalysisActionResult {
  success: boolean;
  error?: string;
}

export async function analyzeGameAction(
  gameId: string,
  depth = 10,
  userColor?: "WHITE" | "BLACK"
): Promise<AnalysisActionResult> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  // Verify game ownership
  const game = await db.game.findUnique({
    where: { id: gameId },
    select: { id: true, userId: true, pgn: true, userColor: true },
  });

  if (!game || game.userId !== userId) {
    return { success: false, error: "Game not found or access denied." };
  }

  if (userColor && game.userColor !== userColor) {
    await db.game.update({
      where: { id: gameId },
      data: { userColor },
    });
  }

  // Create or update analysis status to ANALYZING
  const existingAnalysis = await db.gameAnalysis.findUnique({
    where: { gameId },
    select: { id: true },
  });

  let analysisId: string;
  if (existingAnalysis) {
    analysisId = existingAnalysis.id;
    await db.gameAnalysis.update({
      where: { id: analysisId },
      data: {
        status: "ANALYZING",
        errorMessage: null,
      },
    });
  } else {
    const created = await db.gameAnalysis.create({
      data: {
        gameId,
        status: "ANALYZING",
      },
    });
    analysisId = created.id;
  }

  try {
    const summary = await analyzeGamePgn(game.pgn, { depth });

    await db.$transaction(async (tx: Prisma.TransactionClient) => {
      // Clear old moves if re-analyzing
      await tx.moveAnalysis.deleteMany({
        where: { analysisId },
      });

      // Update parent GameAnalysis record
      await tx.gameAnalysis.update({
        where: { id: analysisId },
        data: {
          status: "COMPLETED",
          engine: summary.engine,
          depth: summary.depth,
          accuracy: summary.accuracy,
          whiteAccuracy: summary.whiteAccuracy,
          blackAccuracy: summary.blackAccuracy,
          acpl: summary.acpl,
          whiteAcpl: summary.whiteAcpl,
          blackAcpl: summary.blackAcpl,
          inaccuracies: summary.inaccuracies,
          mistakes: summary.mistakes,
          blunders: summary.blunders,
          whiteInaccuracies: summary.whiteInaccuracies,
          whiteMistakes: summary.whiteMistakes,
          whiteBlunders: summary.whiteBlunders,
          blackInaccuracies: summary.blackInaccuracies,
          blackMistakes: summary.blackMistakes,
          blackBlunders: summary.blackBlunders,
          errorMessage: null,
        },
      });

      // Insert move-by-move results
      if (summary.moves.length > 0) {
        await tx.moveAnalysis.createMany({
          data: summary.moves.map((m) => ({
            analysisId,
            moveIndex: m.moveIndex,
            moveNumber: m.moveNumber,
            color: m.color,
            san: m.san,
            fen: m.fen,
            score: m.score,
            mate: m.mate,
            evalType: m.evalType,
            bestMove: m.bestMove,
            bestMoveSan: m.bestMoveSan,
            playedMove: m.playedMove,
            centipawnLoss: m.centipawnLoss,
            classification: m.classification,
            accuracy: m.accuracy,
          })),
        });
      }
    });

    revalidatePath(`/games/${gameId}`);
    revalidatePath("/dashboard");
    revalidatePath("/games");

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Analysis failed unexpectedly.";
    await db.gameAnalysis
      .update({
        where: { id: analysisId },
        data: {
          status: "FAILED",
          errorMessage: message,
        },
      })
      .catch(() => {});

    return { success: false, error: message };
  }
}

export async function getGameAnalysisAction(gameId: string) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    throw new Error("Unauthorized access.");
  }

  const game = await db.game.findUnique({
    where: { id: gameId },
    select: { userId: true },
  });

  if (!game || game.userId !== userId) {
    return null;
  }

  const analysis = await db.gameAnalysis.findUnique({
    where: { gameId },
    include: {
      moves: {
        orderBy: { moveIndex: "asc" },
      },
    },
  });

  return analysis;
}
