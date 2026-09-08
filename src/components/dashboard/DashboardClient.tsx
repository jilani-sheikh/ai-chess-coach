"use client";

import { useState } from "react";
import Link from "next/link";
import { UploadPgnModal } from "@/components/games/UploadPgnModal";
import { DeleteGameModal } from "@/components/games/DeleteGameModal";
import {
  Upload,
  ChevronRight,
  Swords,
  PieChart,
  Trash2,
  Cpu,
  Target,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";

import { getUserFacingResult } from "@/lib/chess/results";

interface GameRecord {
  id: string;
  white: string;
  black: string;
  result: string;
  userColor?: string | null;
  playedAt: Date | string | null;
  createdAt: Date | string;
  totalMoves: number;
  pgn: string;
  analysis?: {
    status: string;
    accuracy: number | null;
  } | null;
}

interface DashboardClientProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
  stats: {
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    totalMoves: number;
    gamesAnalyzed?: number;
    averageAccuracy?: number | null;
    averageAcpl?: number | null;
    totalInaccuracies?: number;
    totalMistakes?: number;
    totalBlunders?: number;
  };
  recentGames: GameRecord[];
}

export function DashboardClient({ user, stats, recentGames }: DashboardClientProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deleteModalGame, setDeleteModalGame] = useState<{ id: string; title: string } | null>(null);

  const displayName = user.name || user.email?.split("@")[0] || "Player";

  const formatDate = (dateVal: Date | string | null) => {
    if (!dateVal) return "Recent Game";
    const d = new Date(dateVal);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getResultBadge = (result: string, userColor?: string | null) => {
    const userResult = getUserFacingResult(result, userColor);
    if (userResult === "WIN") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
          Win
        </span>
      );
    }
    if (userResult === "LOSS") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-950/60 text-red-400 border border-red-800/50">
          Loss
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/50">
        Draw
      </span>
    );
  };

  const getAnalysisBadge = (analysis?: { status: string; accuracy: number | null } | null) => {
    if (!analysis) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 hidden sm:inline-block">
          Unanalyzed
        </span>
      );
    }
    if (analysis.status === "COMPLETED") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#dfb46c]/15 text-[#f4d084] border border-[#dfb46c]/30 shadow-sm">
          {analysis.accuracy !== null ? `${analysis.accuracy.toFixed(1)}%` : "Done"}
        </span>
      );
    }
    if (analysis.status === "ANALYZING") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-blue-950/60 text-blue-400 border border-blue-800/50">
          Analyzing...
        </span>
      );
    }
    if (analysis.status === "FAILED") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-red-950/60 text-red-400 border border-red-800/50">
          Failed
        </span>
      );
    }
    return null;
  };

  const gamesAnalyzed = stats.gamesAnalyzed || 0;

  return (
    <div className="space-y-10">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#13131a] via-[#1a1a24] to-[#0f0f15] border border-[rgba(223,180,108,0.2)] p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 rounded-full bg-[#dfb46c]/10 blur-3xl pointer-events-none" />

        {/* Luxury Gold King Piece Background Graphic */}
        <div className="absolute right-8 bottom-0 opacity-15 hidden lg:block pointer-events-none">
          <svg width="240" height="280" viewBox="0 0 24 24" fill="none" stroke="#dfb46c" strokeWidth="0.5">
            <path d="M12 2v3M9 3h6M12 8l-3 4h6l-3-4zM7 12l2 8h6l2-8H7zM5 22h14" fill="#dfb46c" fillOpacity="0.2" />
          </svg>
        </div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dfb46c]/15 text-[#f4d084] border border-[#dfb46c]/30 text-xs font-medium uppercase tracking-widest">
            <CrownIcon className="w-3.5 h-3.5" /> Welcome back
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-white">
            {displayName}
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base italic font-serif">
            Every move teaches. Every game makes you better.
          </p>
        </div>
      </div>

      {/* Primary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card rounded-2xl p-6 border border-[rgba(223,180,108,0.18)] relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Games</span>
            <Swords className="w-4 h-4 text-[#dfb46c]" />
          </div>
          <div className="font-serif text-3xl font-bold text-white">{stats.totalGames}</div>
          <p className="text-xs text-zinc-500 mt-1">{stats.wins}W • {stats.losses}L • {stats.draws}D</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card rounded-2xl p-6 border border-[rgba(223,180,108,0.18)] relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold">Win Rate</span>
            <PieChart className="w-4 h-4 text-[#dfb46c]" />
          </div>
          <div className="font-serif text-3xl font-bold text-[#f4d084]">{stats.winRate}%</div>
          <p className="text-xs text-zinc-500 mt-1">Across all uploaded games</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card rounded-2xl p-6 border border-[rgba(223,180,108,0.18)] relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold">Stockfish Analyzed</span>
            <Cpu className="w-4 h-4 text-[#dfb46c]" />
          </div>
          <div className="font-serif text-3xl font-bold text-white">{gamesAnalyzed}</div>
          <p className="text-xs text-zinc-500 mt-1">
            {gamesAnalyzed === 1 ? "1 game analyzed" : `${gamesAnalyzed} games analyzed`}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card rounded-2xl p-6 border border-[rgba(223,180,108,0.18)] relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold">Avg Accuracy</span>
            <Target className="w-4 h-4 text-[#dfb46c]" />
          </div>
          <div className="font-serif text-3xl font-bold text-[#f4d084]">
            {stats.averageAccuracy !== null && stats.averageAccuracy !== undefined
              ? `${stats.averageAccuracy.toFixed(1)}%`
              : "—"}
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {stats.averageAcpl !== null && stats.averageAcpl !== undefined
              ? `Avg ACPL: ${stats.averageAcpl.toFixed(0)} cp`
              : "Analyze games to view accuracy"}
          </p>
        </motion.div>
      </div>

      {/* Stockfish Insights Sub-Bar (Visible when analyses exist) */}
      {gamesAnalyzed > 0 && (
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-[rgba(223,180,108,0.22)] bg-gradient-to-r from-zinc-950/80 via-[#161622]/60 to-zinc-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#dfb46c]/15 text-[#dfb46c] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-serif font-bold text-white">Aggregated Move Quality</span>
              <p className="text-[11px] text-zinc-400">Total mistake classifications across analyzed games</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs font-mono">
            <span className="px-2.5 sm:px-3 py-1 rounded-xl bg-amber-950/40 text-amber-400 border border-amber-800/40">
              {stats.totalInaccuracies || 0} Inaccuracies
            </span>
            <span className="px-2.5 sm:px-3 py-1 rounded-xl bg-orange-950/40 text-orange-400 border border-orange-800/40">
              {stats.totalMistakes || 0} Mistakes
            </span>
            <span className="px-2.5 sm:px-3 py-1 rounded-xl bg-red-950/40 text-red-400 border border-red-800/40">
              {stats.totalBlunders || 0} Blunders
            </span>
          </div>
        </div>
      )}

      {/* Recent Games Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-white">Recent Games</h2>
          <Link
            href="/games"
            className="text-xs font-semibold text-[#dfb46c] hover:text-[#f4d084] flex items-center gap-1 transition-colors"
          >
            View all games <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentGames.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center space-y-4 border border-[rgba(223,180,108,0.15)]">
            <div className="w-12 h-12 rounded-full bg-[#dfb46c]/10 text-[#dfb46c] mx-auto flex items-center justify-center">
              <Swords className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-white">No games uploaded yet</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Upload your first PGN game to start analyzing your moves.
              </p>
            </div>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gold-gradient text-[#0b0b0e] font-semibold text-xs shadow-md"
            >
              Upload PGN Now
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentGames.map((game) => (
              <div
                key={game.id}
                className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border border-[rgba(223,180,108,0.18)]"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-[#dfb46c]/30 flex items-center justify-center shrink-0">
                    <ChessKingIcon className="w-5 h-5 text-[#dfb46c]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-white truncate">
                      {game.white} <span className="text-zinc-500 font-normal">vs</span> {game.black}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {formatDate(game.playedAt || game.createdAt)} • {game.totalMoves} moves
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
                  <div className="flex items-center gap-2">
                    {getAnalysisBadge(game.analysis)}
                    {getResultBadge(game.result, game.userColor)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Delete Option */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModalGame({
                          id: game.id,
                          title: `${game.white} vs ${game.black}`,
                        });
                      }}
                      title="Delete game"
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <Link
                      href={`/games/${game.id}`}
                      className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-[#dfb46c] hover:border-[#dfb46c]/40 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload PGN Card */}
      <div className="glass-card rounded-2xl p-8 sm:p-10 border border-[rgba(223,180,108,0.25)] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-[#dfb46c]/15 border border-[#dfb46c]/30 flex items-center justify-center text-[#dfb46c] shrink-0">
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-white">Upload a new game</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Upload your PGN file and start your journey
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gold-gradient hover:opacity-90 text-[#0b0b0e] font-bold text-sm shadow-lg shadow-[rgba(223,180,108,0.25)] transition-all shrink-0"
        >
          Upload PGN
        </button>
      </div>

      {/* PGN Upload Modal */}
      <UploadPgnModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      {/* Delete Confirmation Modal */}
      <DeleteGameModal
        isOpen={!!deleteModalGame}
        gameId={deleteModalGame?.id || null}
        matchTitle={deleteModalGame?.title}
        onClose={() => setDeleteModalGame(null)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}

function CrownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M2 20h20" />
      <path d="M5 20l-2-12 5 4 4-6 4 6 5-4-2 12" />
    </svg>
  );
}

function ChessKingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 2v3M9 3h6M12 8l-3 4h6l-3-4zM7 12l2 8h6l2-8H7zM5 22h14" />
    </svg>
  );
}
