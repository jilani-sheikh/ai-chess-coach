"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ParsedMoveStep, ParsedPgnMetadata } from "@/lib/chess/pgn";
import { DeleteGameModal } from "@/components/games/DeleteGameModal";
import { EvaluationBar } from "@/components/games/EvaluationBar";
import { EvaluationGraph } from "@/components/games/EvaluationGraph";
import { MoveAnalysisCard } from "@/components/games/MoveAnalysisCard";
import { AnalysisOverviewCard } from "@/components/games/AnalysisOverviewCard";
import {
  ArrowLeft,
  Download,
  Share2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Calendar,
  Swords,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

const Chessboard = dynamic(() => import("react-chessboard").then((m) => m.Chessboard), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-square bg-[#181822] rounded-2xl flex items-center justify-center text-sm text-zinc-500">
      Loading Chessboard...
    </div>
  ),
});

export interface MoveAnalysisRecord {
  id: string;
  moveIndex: number;
  moveNumber: number;
  color: string;
  san: string;
  fen: string;
  score: number;
  mate: number | null;
  evalType: string;
  bestMove: string;
  bestMoveSan: string | null;
  playedMove: string;
  centipawnLoss: number;
  classification: string;
  accuracy: number;
}

export interface GameAnalysisRecord {
  id: string;
  status: string;
  engine: string;
  depth: number;
  accuracy: number | null;
  whiteAccuracy: number | null;
  blackAccuracy: number | null;
  acpl: number | null;
  whiteAcpl: number | null;
  blackAcpl: number | null;
  inaccuracies: number;
  mistakes: number;
  blunders: number;
  whiteInaccuracies: number;
  whiteMistakes: number;
  whiteBlunders: number;
  blackInaccuracies: number;
  blackMistakes: number;
  blackBlunders: number;
  errorMessage?: string | null;
  moves: MoveAnalysisRecord[];
}

interface GameRecord {
  id: string;
  white: string;
  black: string;
  result: string;
  event: string | null;
  site: string | null;
  round: string | null;
  playedAt: Date | string | null;
  createdAt: Date | string;
  totalMoves: number;
  userColor?: string | null;
  pgn: string;
  analysis?: GameAnalysisRecord | null;
}

interface GameDetailsClientProps {
  game: GameRecord;
  parsed: {
    metadata: ParsedPgnMetadata;
    moves: ParsedMoveStep[];
    startFen: string;
  };
}

export function GameDetailsClient({ game, parsed }: GameDetailsClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { moves, startFen } = parsed;

  // Move index: -1 means initial starting board state, 0 is after 1st move, etc.
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(moves.length - 1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  // Board orientation state ("white" | "black" | null): null means follow game.userColor default
  const [userOrientation, setUserOrientation] = useState<"white" | "black" | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Derived effective board orientation
  const boardOrientation: "white" | "black" =
    userOrientation ?? (game.userColor === "BLACK" ? "black" : "white");

  const movesEndRef = useRef<HTMLDivElement>(null);

  // Derive active FEN position
  const currentFen =
    currentMoveIndex < 0
      ? startFen
      : moves[currentMoveIndex]?.fen || startFen;

  // Autoplay timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying) {
      const intervalMs = 1200 / playbackSpeed;
      timer = setInterval(() => {
        setCurrentMoveIndex((prev) => {
          if (prev >= moves.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, playbackSpeed, moves.length]);

  // Download PGN handler
  const handleDownloadPgn = () => {
    const blob = new Blob([game.pgn], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${game.white}_vs_${game.black}.pgn`.replace(/[^a-zA-Z0-9._-]/g, "_");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Share link handler
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateVal: Date | string | null) => {
    if (!dateVal) return "Date Unknown";
    const d = new Date(dateVal);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getResultBadge = (result: string) => {
    if (result === "1-0") {
      return (
        <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-800/60 shadow-sm">
          1 - 0 Win
        </span>
      );
    }
    if (result === "0-1") {
      return (
        <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-red-950/70 text-red-400 border border-red-800/60 shadow-sm">
          0 - 1 Loss
        </span>
      );
    }
    return (
      <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-amber-950/70 text-amber-400 border border-amber-800/60 shadow-sm">
        ½ - ½ Draw
      </span>
    );
  };

  const getClassificationDot = (classification?: string) => {
    if (!classification) return null;
    switch (classification) {
      case "best":
        return <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 inline-block shadow-sm" title="Best" />;
      case "good":
        return <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 inline-block shadow-sm" title="Good" />;
      case "inaccuracy":
        return <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 inline-block shadow-sm" title="Inaccuracy" />;
      case "mistake":
        return <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 inline-block shadow-sm" title="Mistake" />;
      case "blunder":
        return <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 inline-block shadow-sm animate-pulse" title="Blunder" />;
      default:
        return null;
    }
  };

  // Active Move Analysis data
  const analysisMoves = game.analysis?.moves || [];
  const currentMoveAnalysis =
    currentMoveIndex >= 0
      ? analysisMoves.find((m) => m.moveIndex === currentMoveIndex) || null
      : null;

  // Active Evaluation Score for vertical bar
  const activeScore = currentMoveAnalysis ? currentMoveAnalysis.score : 0.2;
  const activeMate = currentMoveAnalysis ? currentMoveAnalysis.mate : null;
  const activeEvalType = (currentMoveAnalysis?.evalType as "cp" | "mate") || "cp";

  // Group moves into pairs (1. e4 e5, 2. Nf3 Nc6...)
  const movePairs: {
    moveNumber: number;
    whiteMove?: ParsedMoveStep & { analysis?: MoveAnalysisRecord };
    blackMove?: ParsedMoveStep & { analysis?: MoveAnalysisRecord };
  }[] = [];

  moves.forEach((m) => {
    const pairIndex = m.moveNumber - 1;
    if (!movePairs[pairIndex]) {
      movePairs[pairIndex] = { moveNumber: m.moveNumber };
    }
    const moveWithAnalysis = {
      ...m,
      analysis: analysisMoves.find((am) => am.moveIndex === m.index),
    };
    if (m.color === "w") {
      movePairs[pairIndex].whiteMove = moveWithAnalysis;
    } else {
      movePairs[pairIndex].blackMove = moveWithAnalysis;
    }
  });

  return (
    <div className="space-y-8">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/games"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-[#dfb46c] mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Games
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
            {game.white} <span className="text-zinc-500 font-sans font-normal text-xl">vs</span> {game.black}
          </h1>
          <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
            <span>{game.event || "Casual Game"}</span>
            <span>•</span>
            <span>{formatDate(game.playedAt || game.createdAt)}</span>
          </p>
        </div>

        {/* Top Actions & Result Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          {getResultBadge(game.result)}

          <button
            onClick={handleShare}
            className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#dfb46c]/40 text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-2 transition-all"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-[#dfb46c]" />}
            {copied ? "Copied Link" : "Share"}
          </button>

          <button
            onClick={handleDownloadPgn}
            className="px-4 py-2 rounded-xl bg-gold-gradient hover:opacity-90 text-[#0b0b0e] font-bold text-xs flex items-center gap-2 shadow-md transition-all"
          >
            <Download className="w-4 h-4" />
            Download PGN
          </button>

          <button
            onClick={() => setIsDeleteOpen(true)}
            title="Delete Game"
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-900/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Chessboard, Eval Bar, Playback & Graph (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="glass-card rounded-3xl p-4 sm:p-6 border border-[rgba(223,180,108,0.22)] shadow-2xl space-y-6">
            {/* Board Container with Side-by-Side Eval Bar */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 max-w-[620px] mx-auto">
              {/* Vertical Evaluation Bar (visible when analysis completed or active) */}
              {game.analysis?.status === "COMPLETED" && (
                <div className="h-[280px] sm:h-[480px]">
                  <EvaluationBar
                    score={activeScore}
                    mate={activeMate}
                    evalType={activeEvalType}
                  />
                </div>
              )}

              {/* Chessboard */}
              <div className="flex-1 aspect-square rounded-2xl overflow-hidden border border-[rgba(223,180,108,0.3)] shadow-xl">
                <Chessboard
                  options={{
                    position: currentFen,
                    boardOrientation,
                    allowDragging: false,
                    darkSquareStyle: { backgroundColor: "#769656" },
                    lightSquareStyle: { backgroundColor: "#eeedd2" },
                  }}
                />
              </div>
            </div>

            {/* Playback & Controls Bar */}
            <div className="space-y-4 pt-2 border-t border-zinc-800/80">
              {/* Button Bar */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentMoveIndex(-1);
                    }}
                    title="First Move"
                    className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-[#dfb46c] hover:border-[#dfb46c]/40 transition-colors"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentMoveIndex((prev) => Math.max(-1, prev - 1));
                    }}
                    title="Previous Move"
                    className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-[#dfb46c] hover:border-[#dfb46c]/40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    title={isPlaying ? "Pause Playback" : "Autoplay Moves"}
                    className="px-4 py-2.5 rounded-xl bg-gold-gradient text-[#0b0b0e] font-bold text-xs flex items-center gap-1.5 shadow-md hover:opacity-90 transition-opacity"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    {isPlaying ? "Pause" : "Play"}
                  </button>

                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentMoveIndex((prev) => Math.min(moves.length - 1, prev + 1));
                    }}
                    title="Next Move"
                    className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-[#dfb46c] hover:border-[#dfb46c]/40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentMoveIndex(moves.length - 1);
                    }}
                    title="Last Move"
                    className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-[#dfb46c] hover:border-[#dfb46c]/40 transition-colors"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>

                  {/* Flip Board Toggle Button */}
                  <button
                    onClick={() =>
                      setUserOrientation(boardOrientation === "white" ? "black" : "white")
                    }
                    title="Flip Board Orientation"
                    className="px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-[#dfb46c] hover:border-[#dfb46c]/40 transition-colors flex items-center gap-1.5 text-xs font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#dfb46c]" />
                    <span>Flip Board</span>
                  </button>
                </div>

                {/* Speed selector */}
                <select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-300 focus:outline-none"
                >
                  <option value={1}>1x Speed</option>
                  <option value={1.5}>1.5x Speed</option>
                  <option value={2}>2x Speed</option>
                </select>
              </div>

              {/* Progress Scrubber Slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min={-1}
                  max={moves.length - 1}
                  value={currentMoveIndex}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setCurrentMoveIndex(parseInt(e.target.value, 10));
                  }}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#dfb46c]"
                />
                <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                  <span>Start (0/{moves.length})</span>
                  <span>
                    Move {currentMoveIndex < 0 ? 0 : currentMoveIndex + 1} / {moves.length}
                  </span>
                  <span>End</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Evaluation Graph (White Perspective) */}
          {game.analysis?.status === "COMPLETED" && (
            <EvaluationGraph
              moves={analysisMoves}
              currentMoveIndex={currentMoveIndex}
              onSelectMove={(idx) => {
                setIsPlaying(false);
                setCurrentMoveIndex(idx);
              }}
            />
          )}
        </div>

        {/* Right Column: Move Matrix, Analysis Cards & Game Info (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Analysis Overview Card (Actions + Accuracy + Mistakes) */}
          <AnalysisOverviewCard
            gameId={game.id}
            whitePlayer={game.white}
            blackPlayer={game.black}
            userColor={game.userColor}
            analysis={game.analysis || null}
            onAnalysisUpdated={() => {
              startTransition(() => {
                router.refresh();
              });
            }}
          />

          {/* Selected Move Analysis Inspector (if analyzed) */}
          {game.analysis?.status === "COMPLETED" && (
            <MoveAnalysisCard move={currentMoveAnalysis} />
          )}

          {/* Moves List Box with Move-Quality Badges */}
          <div className="glass-card rounded-3xl p-5 border border-[rgba(223,180,108,0.2)] space-y-4">
            <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Swords className="w-4 h-4 text-[#dfb46c]" /> Move History
            </h3>

            <div className="max-h-[360px] overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
              {movePairs.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center">No move list available.</p>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-zinc-500 border-b border-zinc-800/60">
                      <th className="pb-2 w-10 font-mono">#</th>
                      <th className="pb-2">White</th>
                      <th className="pb-2">Black</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/30">
                    {movePairs.map((pair) => (
                      <tr key={pair.moveNumber} className="hover:bg-zinc-900/40">
                        <td className="py-1.5 font-mono text-zinc-500 font-semibold">{pair.moveNumber}.</td>

                        {/* White move */}
                        <td className="py-1.5">
                          {pair.whiteMove ? (
                            <button
                              onClick={() => {
                                setIsPlaying(false);
                                setCurrentMoveIndex(pair.whiteMove!.index);
                              }}
                              className={`px-2 py-1 rounded font-mono font-medium inline-flex items-center gap-1.5 transition-all ${
                                currentMoveIndex === pair.whiteMove.index
                                  ? "bg-[#dfb46c] text-[#0b0b0e] font-bold"
                                  : "text-zinc-200 hover:bg-zinc-800 hover:text-[#dfb46c]"
                              }`}
                            >
                              <span>{pair.whiteMove.san}</span>
                              {getClassificationDot(pair.whiteMove.analysis?.classification)}
                            </button>
                          ) : (
                            <span className="text-zinc-600">-</span>
                          )}
                        </td>

                        {/* Black move */}
                        <td className="py-1.5">
                          {pair.blackMove ? (
                            <button
                              onClick={() => {
                                setIsPlaying(false);
                                setCurrentMoveIndex(pair.blackMove!.index);
                              }}
                              className={`px-2 py-1 rounded font-mono font-medium inline-flex items-center gap-1.5 transition-all ${
                                currentMoveIndex === pair.blackMove.index
                                  ? "bg-[#dfb46c] text-[#0b0b0e] font-bold"
                                  : "text-zinc-200 hover:bg-zinc-800 hover:text-[#dfb46c]"
                              }`}
                            >
                              <span>{pair.blackMove.san}</span>
                              {getClassificationDot(pair.blackMove.analysis?.classification)}
                            </button>
                          ) : (
                            <span className="text-zinc-600">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div ref={movesEndRef} />
            </div>
          </div>

          {/* Game Metadata Card */}
          <div className="glass-card rounded-3xl p-5 border border-[rgba(223,180,108,0.2)] space-y-4">
            <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Calendar className="w-4 h-4 text-[#dfb46c]" /> Game Info
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-semibold">Event</span>
                <p className="font-medium text-white mt-0.5">{game.event || "Casual Game"}</p>
              </div>

              <div>
                <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-semibold">Date</span>
                <p className="font-medium text-white mt-0.5">{formatDate(game.playedAt || game.createdAt)}</p>
              </div>

              <div>
                <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-semibold">White</span>
                <p className="font-medium text-white mt-0.5">{game.white}</p>
              </div>

              <div>
                <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-semibold">Black</span>
                <p className="font-medium text-white mt-0.5">{game.black}</p>
              </div>

              <div>
                <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-semibold">Result</span>
                <p className="font-medium text-[#f4d084] font-bold mt-0.5">{game.result}</p>
              </div>

              <div>
                <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-semibold">Total Moves</span>
                <p className="font-medium text-white mt-0.5">{game.totalMoves}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Safe Delete Modal */}
      <DeleteGameModal
        isOpen={isDeleteOpen}
        gameId={game.id}
        matchTitle={`${game.white} vs ${game.black}`}
        onClose={() => setIsDeleteOpen(false)}
        onSuccess={() => router.push("/games")}
      />
    </div>
  );
}
