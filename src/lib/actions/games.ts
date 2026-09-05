"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { parseAndValidatePgn } from "@/lib/chess/pgn";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export interface UploadGameResult {
  success: boolean;
  gameId?: string;
  error?: string;
}

export interface DeleteGameResult {
  success: boolean;
  error?: string;
}

export async function uploadPgnAction(
  pgnText: string,
  userColor: "WHITE" | "BLACK" = "WHITE"
): Promise<UploadGameResult> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return { success: false, error: "Unauthorized. Please log in first." };
  }

  try {
    const parsed = parseAndValidatePgn(pgnText);
    const { metadata } = parsed;

    const game = await db.game.create({
      data: {
        userId,
        pgn: pgnText.trim(),
        white: metadata.white,
        black: metadata.black,
        result: metadata.result,
        event: metadata.event,
        site: metadata.site,
        round: metadata.round,
        playedAt: metadata.playedAt,
        totalMoves: metadata.totalMoves,
        userColor: userColor || "WHITE",
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/games");

    return { success: true, gameId: game.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process PGN file.";
    return { success: false, error: message };
  }
}

export async function updateGameUserColorAction(
  gameId: string,
  userColor: "WHITE" | "BLACK"
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return { success: false, error: "Unauthorized." };
  }

  const game = await db.game.findUnique({
    where: { id: gameId },
    select: { userId: true },
  });

  if (!game || game.userId !== userId) {
    return { success: false, error: "Game not found or access denied." };
  }

  await db.game.update({
    where: { id: gameId },
    data: { userColor },
  });

  revalidatePath(`/games/${gameId}`);
  return { success: true };
}

export async function getUserGamesAction(params?: {
  search?: string;
  resultFilter?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    throw new Error("Unauthorized access");
  }

  const search = params?.search?.trim();
  const resultFilter = params?.resultFilter;
  const sortBy = params?.sortBy || "recent";
  const page = Math.max(1, params?.page || 1);
  const limit = Math.max(1, Math.min(50, params?.limit || 10));
  const skip = (page - 1) * limit;

  // Build Prisma where clause
  const where: Prisma.GameWhereInput = {
    userId,
  };

  if (search) {
    (where as Prisma.GameWhereInput).OR = [
      { white: { contains: search, mode: "insensitive" } },
      { black: { contains: search, mode: "insensitive" } },
      { event: { contains: search, mode: "insensitive" } },
    ];
  }

  if (resultFilter && resultFilter !== "all") {
    if (resultFilter === "win") {
      where.result = "1-0";
    } else if (resultFilter === "loss") {
      where.result = "0-1";
    } else if (resultFilter === "draw") {
      where.result = "1/2-1/2";
    }
  }

  let orderBy: Prisma.GameOrderByWithRelationInput = { createdAt: "desc" };
  if (sortBy === "oldest") {
    orderBy = { createdAt: "asc" };
  } else if (sortBy === "moves") {
    orderBy = { totalMoves: "desc" };
  }

  const [games, totalCount] = await Promise.all([
    db.game.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        analysis: {
          select: {
            status: true,
            accuracy: true,
          },
        },
      },
    }),
    db.game.count({ where }),
  ]);

  return {
    games,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
}

export async function getDashboardDataAction() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    throw new Error("Unauthorized access");
  }

  const [
    totalGames,
    wins,
    losses,
    draws,
    totalMovesAggregate,
    recentGames,
    gamesAnalyzed,
    analysisAggregates,
  ] = await Promise.all([
    db.game.count({ where: { userId } }),
    db.game.count({ where: { userId, result: "1-0" } }),
    db.game.count({ where: { userId, result: "0-1" } }),
    db.game.count({ where: { userId, result: "1/2-1/2" } }),
    db.game.aggregate({
      where: { userId },
      _sum: { totalMoves: true },
    }),
    db.game.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        analysis: {
          select: {
            status: true,
            accuracy: true,
          },
        },
      },
    }),
    db.gameAnalysis.count({
      where: {
        game: { userId },
        status: "COMPLETED",
      },
    }),
    db.gameAnalysis.aggregate({
      where: {
        game: { userId },
        status: "COMPLETED",
      },
      _avg: {
        accuracy: true,
        acpl: true,
      },
      _sum: {
        inaccuracies: true,
        mistakes: true,
        blunders: true,
      },
    }),
  ]);

  const totalMoves = totalMovesAggregate._sum.totalMoves || 0;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
  const averageAccuracy = analysisAggregates._avg.accuracy
    ? Number(analysisAggregates._avg.accuracy.toFixed(1))
    : null;
  const averageAcpl = analysisAggregates._avg.acpl
    ? Number(analysisAggregates._avg.acpl.toFixed(1))
    : null;
  const totalInaccuracies = analysisAggregates._sum.inaccuracies || 0;
  const totalMistakes = analysisAggregates._sum.mistakes || 0;
  const totalBlunders = analysisAggregates._sum.blunders || 0;

  return {
    stats: {
      totalGames,
      wins,
      losses,
      draws,
      winRate,
      totalMoves,
      gamesAnalyzed,
      averageAccuracy,
      averageAcpl,
      totalInaccuracies,
      totalMistakes,
      totalBlunders,
    },
    recentGames,
    user: session!.user,
  };
}

export async function getGameDetailsAction(gameId: string) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    throw new Error("Unauthorized access");
  }

  const game = await db.game.findUnique({
    where: { id: gameId },
    include: {
      analysis: {
        include: {
          moves: {
            orderBy: { moveIndex: "asc" },
          },
        },
      },
    },
  });

  if (!game || game.userId !== userId) {
    return null;
  }

  // Parse moves at runtime
  const parsed = parseAndValidatePgn(game.pgn);

  return {
    game,
    parsed,
  };
}

export async function deleteGameAction(gameId: string): Promise<DeleteGameResult> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return { success: false, error: "Unauthorized action." };
  }

  // Confirm ownership before deletion
  const existingGame = await db.game.findUnique({
    where: { id: gameId },
    select: { userId: true },
  });

  if (!existingGame || existingGame.userId !== userId) {
    return { success: false, error: "Game not found or access denied." };
  }

  await db.game.delete({
    where: { id: gameId },
  });

  revalidatePath("/dashboard");
  revalidatePath("/games");

  return { success: true };
}
