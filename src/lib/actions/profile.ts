"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import {
  PlayerPerformanceSummary,
  requestGeminiProfileInsights,
} from "@/lib/gemini/profile";

export interface RecentAccuracyPoint {
  id: string;
  opponent: string;
  userColor: "WHITE" | "BLACK";
  result: "WIN" | "LOSS" | "DRAW";
  accuracy: number;
  acpl: number;
  date: string;
}

export interface ColorPerformance {
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  accuracy: number;
  acpl: number;
  blunders: number;
  mistakes: number;
  inaccuracies: number;
}

export interface PhasePerformance {
  openingAccuracy: number;
  openingBlunders: number;
  middlegameAccuracy: number;
  middlegameBlunders: number;
  endgameAccuracy: number;
  endgameBlunders: number;
}

export interface ProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
  totalGames: number;
  totalAnalyzedGames: number;
  hasEnoughGamesForInsights: boolean; // >= 3 games threshold
  overallAccuracy: number;
  overallAcpl: number;
  totalBlunders: number;
  totalMistakes: number;
  totalInaccuracies: number;
  whiteStats: ColorPerformance;
  blackStats: ColorPerformance;
  recentTrend: RecentAccuracyPoint[];
  phaseStats: PhasePerformance;
  strengths: string[];
  areasToImprove: string[];
}

/**
 * Deterministically compute player performance metrics across completed Stockfish analyses
 */
export async function getProfileDataAction(): Promise<ProfileData> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    throw new Error("Unauthorized access");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Fetch all user games with completed Stockfish analysis
  const [totalGamesCount, gamesWithAnalysis] = await Promise.all([
    db.game.count({ where: { userId } }),
    db.game.findMany({
      where: {
        userId,
        analysis: {
          status: "COMPLETED",
        },
      },
      orderBy: {
        playedAt: "desc",
      },
      include: {
        analysis: {
          include: {
            moves: {
              select: {
                moveNumber: true,
                color: true,
                accuracy: true,
                classification: true,
                centipawnLoss: true,
              },
            },
          },
        },
      },
    }),
  ]);

  // Filter games that have a valid userColor (WHITE or BLACK)
  const validGames = gamesWithAnalysis.filter(
    (g: (typeof gamesWithAnalysis)[number]) =>
      g.userColor &&
      (g.userColor.toUpperCase() === "WHITE" || g.userColor.toUpperCase() === "BLACK")
  );

  const totalAnalyzedGames = validGames.length;
  const hasEnoughGames = totalAnalyzedGames >= 3;

  // Initialize aggregates
  let totalUserAccuracySum = 0;
  let totalUserAcplSum = 0;
  let totalBlunders = 0;
  let totalMistakes = 0;
  let totalInaccuracies = 0;

  // Color-specific aggregates
  const whiteAgg = {
    games: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    accuracySum: 0,
    acplSum: 0,
    blunders: 0,
    mistakes: 0,
    inaccuracies: 0,
  };

  const blackAgg = {
    games: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    accuracySum: 0,
    acplSum: 0,
    blunders: 0,
    mistakes: 0,
    inaccuracies: 0,
  };

  // Phase-specific move aggregates
  const phaseAgg = {
    openingAccuracySum: 0,
    openingCount: 0,
    openingBlunders: 0,
    middlegameAccuracySum: 0,
    middlegameCount: 0,
    middlegameBlunders: 0,
    endgameAccuracySum: 0,
    endgameCount: 0,
    endgameBlunders: 0,
  };

  const recentTrend: RecentAccuracyPoint[] = [];

  for (const game of validGames) {
    const analysis = game.analysis!;
    const isWhite = game.userColor!.toUpperCase() === "WHITE";
    const userColorTarget = isWhite ? "w" : "b";

    // Extract side-specific metrics
    const userAcc = isWhite
      ? analysis.whiteAccuracy ?? analysis.accuracy ?? 0
      : analysis.blackAccuracy ?? analysis.accuracy ?? 0;

    const userAcpl = isWhite
      ? analysis.whiteAcpl ?? analysis.acpl ?? 0
      : analysis.blackAcpl ?? analysis.acpl ?? 0;

    const blunders = isWhite ? analysis.whiteBlunders : analysis.blackBlunders;
    const mistakes = isWhite ? analysis.whiteMistakes : analysis.blackMistakes;
    const inaccuracies = isWhite
      ? analysis.whiteInaccuracies
      : analysis.blackInaccuracies;

    totalUserAccuracySum += userAcc;
    totalUserAcplSum += userAcpl;
    totalBlunders += blunders;
    totalMistakes += mistakes;
    totalInaccuracies += inaccuracies;

    // Determine result from user's perspective
    let userResult: "WIN" | "LOSS" | "DRAW" = "DRAW";
    if (game.result === "1/2-1/2") {
      userResult = "DRAW";
    } else if (isWhite) {
      userResult = game.result === "1-0" ? "WIN" : "LOSS";
    } else {
      userResult = game.result === "0-1" ? "WIN" : "LOSS";
    }

    if (isWhite) {
      whiteAgg.games += 1;
      if (userResult === "WIN") whiteAgg.wins += 1;
      else if (userResult === "LOSS") whiteAgg.losses += 1;
      else whiteAgg.draws += 1;

      whiteAgg.accuracySum += userAcc;
      whiteAgg.acplSum += userAcpl;
      whiteAgg.blunders += blunders;
      whiteAgg.mistakes += mistakes;
      whiteAgg.inaccuracies += inaccuracies;
    } else {
      blackAgg.games += 1;
      if (userResult === "WIN") blackAgg.wins += 1;
      else if (userResult === "LOSS") blackAgg.losses += 1;
      else blackAgg.draws += 1;

      blackAgg.accuracySum += userAcc;
      blackAgg.acplSum += userAcpl;
      blackAgg.blunders += blunders;
      blackAgg.mistakes += mistakes;
      blackAgg.inaccuracies += inaccuracies;
    }

    // Add to recent trend (up to 12 most recent)
    if (recentTrend.length < 12) {
      recentTrend.push({
        id: game.id,
        opponent: isWhite ? game.black : game.white,
        userColor: isWhite ? "WHITE" : "BLACK",
        result: userResult,
        accuracy: Number(userAcc.toFixed(1)),
        acpl: Number(userAcpl.toFixed(1)),
        date: game.playedAt
          ? new Date(game.playedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : new Date(game.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
      });
    }

    // Aggregate user moves by phase
    if (analysis.moves && analysis.moves.length > 0) {
      for (const move of analysis.moves) {
        if (move.color !== userColorTarget) continue;

        const isBlunder = move.classification === "blunder";

        if (move.moveNumber <= 10) {
          phaseAgg.openingCount += 1;
          phaseAgg.openingAccuracySum += move.accuracy;
          if (isBlunder) phaseAgg.openingBlunders += 1;
        } else if (move.moveNumber <= 30) {
          phaseAgg.middlegameCount += 1;
          phaseAgg.middlegameAccuracySum += move.accuracy;
          if (isBlunder) phaseAgg.middlegameBlunders += 1;
        } else {
          phaseAgg.endgameCount += 1;
          phaseAgg.endgameAccuracySum += move.accuracy;
          if (isBlunder) phaseAgg.endgameBlunders += 1;
        }
      }
    }
  }

  // Calculate overall averages
  const overallAccuracy =
    totalAnalyzedGames > 0
      ? Number((totalUserAccuracySum / totalAnalyzedGames).toFixed(1))
      : 0;

  const overallAcpl =
    totalAnalyzedGames > 0
      ? Number((totalUserAcplSum / totalAnalyzedGames).toFixed(1))
      : 0;

  // Calculate color performance objects
  const whiteStats: ColorPerformance = {
    games: whiteAgg.games,
    wins: whiteAgg.wins,
    losses: whiteAgg.losses,
    draws: whiteAgg.draws,
    winRate:
      whiteAgg.games > 0
        ? Math.round((whiteAgg.wins / whiteAgg.games) * 100)
        : 0,
    accuracy:
      whiteAgg.games > 0
        ? Number((whiteAgg.accuracySum / whiteAgg.games).toFixed(1))
        : 0,
    acpl:
      whiteAgg.games > 0
        ? Number((whiteAgg.acplSum / whiteAgg.games).toFixed(1))
        : 0,
    blunders: whiteAgg.blunders,
    mistakes: whiteAgg.mistakes,
    inaccuracies: whiteAgg.inaccuracies,
  };

  const blackStats: ColorPerformance = {
    games: blackAgg.games,
    wins: blackAgg.wins,
    losses: blackAgg.losses,
    draws: blackAgg.draws,
    winRate:
      blackAgg.games > 0
        ? Math.round((blackAgg.wins / blackAgg.games) * 100)
        : 0,
    accuracy:
      blackAgg.games > 0
        ? Number((blackAgg.accuracySum / blackAgg.games).toFixed(1))
        : 0,
    acpl:
      blackAgg.games > 0
        ? Number((blackAgg.acplSum / blackAgg.games).toFixed(1))
        : 0,
    blunders: blackAgg.blunders,
    mistakes: blackAgg.mistakes,
    inaccuracies: blackAgg.inaccuracies,
  };

  // Calculate phase performances
  const phaseStats: PhasePerformance = {
    openingAccuracy:
      phaseAgg.openingCount > 0
        ? Number((phaseAgg.openingAccuracySum / phaseAgg.openingCount).toFixed(1))
        : 0,
    openingBlunders: phaseAgg.openingBlunders,
    middlegameAccuracy:
      phaseAgg.middlegameCount > 0
        ? Number(
            (phaseAgg.middlegameAccuracySum / phaseAgg.middlegameCount).toFixed(1)
          )
        : 0,
    middlegameBlunders: phaseAgg.middlegameBlunders,
    endgameAccuracy:
      phaseAgg.endgameCount > 0
        ? Number((phaseAgg.endgameAccuracySum / phaseAgg.endgameCount).toFixed(1))
        : 0,
    endgameBlunders: phaseAgg.endgameBlunders,
  };

  // Compute deterministic strengths & weaknesses (strictly requiring >= 3 analyzed games)
  const strengths: string[] = [];
  const areasToImprove: string[] = [];

  if (hasEnoughGames) {
    // Strengths evaluation
    if (phaseStats.openingAccuracy >= 82) {
      strengths.push(
        `High Opening Precision: Consistently navigating the first 10 moves with ${phaseStats.openingAccuracy}% average accuracy.`
      );
    }
    if (overallAcpl <= 35 && overallAcpl > 0) {
      strengths.push(
        `Disciplined Positional Control: Low overall ACPL of ${overallAcpl}, showing patient pawn structure management.`
      );
    }
    if (whiteStats.games >= 2 && whiteStats.winRate >= 50) {
      strengths.push(
        `Aggressive Initiative with White: Delivering a ${whiteStats.winRate}% win rate when controlling the first move.`
      );
    }
    if (blackStats.games >= 2 && blackStats.winRate >= 50) {
      strengths.push(
        `Resilient Black Repertoire: Successfully holding a ${blackStats.winRate}% win rate playing as Black.`
      );
    }
    if (phaseAgg.endgameCount >= 10 && phaseStats.endgameAccuracy >= 80) {
      strengths.push(
        `Endgame Technique: Maintaining ${phaseStats.endgameAccuracy}% accuracy in the deep endgame phase.`
      );
    }
    const blunderPerGame = totalBlunders / totalAnalyzedGames;
    if (blunderPerGame <= 1.0) {
      strengths.push(
        `Tactical Vigilance: Averaging only ${blunderPerGame.toFixed(1)} blunders per match.`
      );
    }

    if (strengths.length === 0) {
      strengths.push(
        `Solid Fundamental Baseline: Reaching ${overallAccuracy}% overall accuracy across ${totalAnalyzedGames} analyzed matches.`
      );
    }

    // Areas to improve evaluation
    if (blunderPerGame > 1.2) {
      areasToImprove.push(
        `Blunder Vulnerability: Averaging ${blunderPerGame.toFixed(1)} blunders per game. Tactical calculation exercises recommended.`
      );
    }
    if (
      whiteStats.games >= 1 &&
      blackStats.games >= 1 &&
      whiteStats.accuracy - blackStats.accuracy > 6
    ) {
      areasToImprove.push(
        `Black Defense Deficit: Playing Black yields ${blackStats.accuracy}% accuracy vs ${whiteStats.accuracy}% with White.`
      );
    }
    if (
      phaseStats.middlegameBlunders > phaseStats.openingBlunders &&
      phaseStats.middlegameBlunders > phaseStats.endgameBlunders
    ) {
      areasToImprove.push(
        `Middlegame Complexity Leaks: Highest concentration of tactical errors occurs between moves 11 and 30 (${phaseStats.middlegameBlunders} blunders).`
      );
    }
    if (phaseStats.openingAccuracy < 75 && phaseAgg.openingCount > 0) {
      areasToImprove.push(
        `Opening Repertoire Gaps: Opening accuracy sits at ${phaseStats.openingAccuracy}%, suggesting memorization or developmental timing flaws.`
      );
    }
    if (phaseStats.endgameAccuracy < 70 && phaseAgg.endgameCount > 0) {
      areasToImprove.push(
        `Endgame Conversion: Accuracy declines to ${phaseStats.endgameAccuracy}% in moves 31+, indicating difficulty converting winning advantages.`
      );
    }

    if (areasToImprove.length === 0) {
      areasToImprove.push(
        `Refining Critical Decisions: Tightening CPL (${overallAcpl}) in complicated tactical transitions.`
      );
    }
  }

  return {
    user: {
      id: user.id,
      name: user.name || user.email.split("@")[0],
      email: user.email,
      createdAt: new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    },
    totalGames: totalGamesCount,
    totalAnalyzedGames,
    hasEnoughGamesForInsights: hasEnoughGames,
    overallAccuracy,
    overallAcpl,
    totalBlunders,
    totalMistakes,
    totalInaccuracies,
    whiteStats,
    blackStats,
    recentTrend,
    phaseStats,
    strengths,
    areasToImprove,
  };
}

/**
 * On-demand Server Action to generate or refresh Gemini coaching insights.
 * Only called when explicitly triggered by the user in the UI.
 */
export async function generateProfileInsightsAction(): Promise<{
  success: boolean;
  insights?: string;
  error?: string;
}> {
  try {
    const profile = await getProfileDataAction();

    if (!profile.hasEnoughGamesForInsights) {
      return {
        success: true,
        insights: "Analyze more games to unlock personalized insights.",
      };
    }

    const payload: PlayerPerformanceSummary = {
      playerName: profile.user.name,
      totalAnalyzedGames: profile.totalAnalyzedGames,
      overallAccuracy: profile.overallAccuracy,
      overallAcpl: profile.overallAcpl,
      totalInaccuracies: profile.totalInaccuracies,
      totalMistakes: profile.totalMistakes,
      totalBlunders: profile.totalBlunders,
      whiteStats: {
        games: profile.whiteStats.games,
        accuracy: profile.whiteStats.accuracy,
        acpl: profile.whiteStats.acpl,
        winRate: profile.whiteStats.winRate,
        blunders: profile.whiteStats.blunders,
      },
      blackStats: {
        games: profile.blackStats.games,
        accuracy: profile.blackStats.accuracy,
        acpl: profile.blackStats.acpl,
        winRate: profile.blackStats.winRate,
        blunders: profile.blackStats.blunders,
      },
      phaseStats: {
        openingAccuracy: profile.phaseStats.openingAccuracy,
        openingBlunders: profile.phaseStats.openingBlunders,
        middlegameAccuracy: profile.phaseStats.middlegameAccuracy,
        middlegameBlunders: profile.phaseStats.middlegameBlunders,
        endgameAccuracy: profile.phaseStats.endgameAccuracy,
        endgameBlunders: profile.phaseStats.endgameBlunders,
      },
      topStrengths: profile.strengths,
      topWeaknesses: profile.areasToImprove,
    };

    const insights = await requestGeminiProfileInsights(payload);
    return { success: true, insights };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Failed to generate coaching insights.";
    return { success: false, error: msg };
  }
}
