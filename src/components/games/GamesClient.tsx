"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MiniBoardPreview } from "@/components/games/MiniBoardPreview";
import { UploadPgnModal } from "@/components/games/UploadPgnModal";
import { DeleteGameModal } from "@/components/games/DeleteGameModal";
import { Search, Plus, ChevronRight, ChevronLeft, Trash2, LayoutList, LayoutGrid, Swords, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GameRecord {
  id: string;
  white: string;
  black: string;
  result: string;
  event: string | null;
  playedAt: Date | string | null;
  createdAt: Date | string;
  totalMoves: number;
  pgn: string;
  analysis?: {
    status: string;
    accuracy: number | null;
  } | null;
}

interface GamesClientProps {
  initialGames: GameRecord[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  currentSearch: string;
  currentResultFilter: string;
  currentSortBy: string;
}

export function GamesClient({
  initialGames,
  totalCount,
  totalPages,
  currentPage,
  currentSearch,
  currentResultFilter,
  currentSortBy,
}: GamesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(currentSearch);
  const [resultFilter, setResultFilter] = useState(currentResultFilter);
  const [sortBy, setSortBy] = useState(currentSortBy);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deleteModalGame, setDeleteModalGame] = useState<{ id: string; title: string } | null>(null);

  const updateFilters = (newParams: { search?: string; result?: string; sort?: string; page?: number }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newParams.search !== undefined) {
      if (newParams.search) params.set("search", newParams.search);
      else params.delete("search");
    }
    if (newParams.result !== undefined) {
      if (newParams.result !== "all") params.set("result", newParams.result);
      else params.delete("result");
    }
    if (newParams.sort !== undefined) {
      if (newParams.sort !== "recent") params.set("sort", newParams.sort);
      else params.delete("sort");
    }
    if (newParams.page !== undefined) {
      if (newParams.page > 1) params.set("page", newParams.page.toString());
      else params.delete("page");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search, page: 1 });
  };

  const formatDate = (dateVal: Date | string | null) => {
    if (!dateVal) return "Date Unknown";
    const d = new Date(dateVal);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getResultBadge = (result: string) => {
    if (result === "1-0") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
          Win
        </span>
      );
    }
    if (result === "0-1") {
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

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white">
            My Games
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            All your uploaded chess games in one place. ({totalCount} total)
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="px-6 py-3 rounded-xl bg-gold-gradient hover:opacity-90 text-[#0b0b0e] font-bold text-sm shadow-lg shadow-[rgba(223,180,108,0.2)] flex items-center justify-center gap-2 transition-all self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          Upload PGN
        </button>
      </div>

      {/* Filter and Toolbar */}
      <div className="glass-card rounded-2xl p-4 border border-[rgba(223,180,108,0.18)] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search games..."
            className="w-full bg-[#0b0b0e] border border-zinc-800 focus:border-[#dfb46c] rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#dfb46c]"
          />
        </form>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap w-full md:w-auto justify-between md:justify-end">
          {/* Result Filter */}
          <select
            value={resultFilter}
            onChange={(e) => {
              setResultFilter(e.target.value);
              updateFilters({ result: e.target.value, page: 1 });
            }}
            className="bg-[#0b0b0e] border border-zinc-800 focus:border-[#dfb46c] rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="all">All Results</option>
            <option value="win">Wins Only</option>
            <option value="loss">Losses Only</option>
            <option value="draw">Draws Only</option>
          </select>

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              updateFilters({ sort: e.target.value, page: 1 });
            }}
            className="bg-[#0b0b0e] border border-zinc-800 focus:border-[#dfb46c] rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest</option>
            <option value="moves">Most Moves</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-[#0b0b0e] p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "list" ? "bg-zinc-800 text-[#dfb46c]" : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="List View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid" ? "bg-zinc-800 text-[#dfb46c]" : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Game Cards Content */}
      {initialGames.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center space-y-4 border border-[rgba(223,180,108,0.15)]">
          <div className="w-14 h-14 rounded-full bg-[#dfb46c]/10 text-[#dfb46c] mx-auto flex items-center justify-center">
            <Swords className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-white">No games found</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              {currentSearch
                ? `No games matching "${currentSearch}". Try adjusting your filters.`
                : "You haven't uploaded any chess games yet."}
            </p>
          </div>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-gold-gradient text-[#0b0b0e] font-semibold text-xs shadow-md"
          >
            Upload a Game
          </button>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 gap-5"
              : "space-y-4"
          }
        >
          <AnimatePresence mode="popLayout">
            {initialGames.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-5 border border-[rgba(223,180,108,0.18)]"
              >
                {/* Board Thumbnail & Game Info */}
                <div className="flex items-center gap-4 min-w-0">
                  <MiniBoardPreview pgn={game.pgn} />

                  <div className="min-w-0 space-y-1.5">
                    <h3 className="font-serif text-base sm:text-lg font-bold text-white truncate">
                      {game.white} <span className="text-zinc-500 text-sm font-sans font-normal">vs</span> {game.black}
                    </h3>
                    
                    <p className="text-xs text-zinc-400 flex items-center gap-2">
                      <span className="flex items-center gap-1 text-zinc-300">
                        <Calendar className="w-3.5 h-3.5 text-[#dfb46c]" />
                        {formatDate(game.playedAt || game.createdAt)}
                      </span>
                      {game.event && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[150px]">{game.event}</span>
                        </>
                      )}
                    </p>

                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-xs font-mono font-semibold text-zinc-300">
                        {game.result}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {game.totalMoves} moves
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side actions & result badge */}
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 shrink-0">
                  {game.analysis?.status === "COMPLETED" && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#dfb46c]/15 text-[#f4d084] border border-[#dfb46c]/30 shadow-sm">
                      {game.analysis.accuracy !== null ? `${game.analysis.accuracy.toFixed(1)}%` : "Done"}
                    </span>
                  )}
                  {getResultBadge(game.result)}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setDeleteModalGame({
                          id: game.id,
                          title: `${game.white} vs ${game.black}`,
                        })
                      }
                      title="Delete game"
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-xl border border-transparent hover:border-red-900/40 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <Link
                      href={`/games/${game.id}`}
                      className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-[#dfb46c] hover:border-[#dfb46c]/40 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => updateFilters({ page: currentPage - 1 })}
            disabled={currentPage <= 1}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-40 hover:text-[#dfb46c]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs text-zinc-400 font-medium px-3">
            Page <span className="text-white font-semibold">{currentPage}</span> of {totalPages}
          </span>

          <button
            onClick={() => updateFilters({ page: currentPage + 1 })}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-40 hover:text-[#dfb46c]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Modal */}
      <UploadPgnModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => router.refresh()}
      />

      {/* Delete Modal */}
      <DeleteGameModal
        isOpen={!!deleteModalGame}
        gameId={deleteModalGame?.id || null}
        matchTitle={deleteModalGame?.title}
        onClose={() => setDeleteModalGame(null)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
