"use client";

import { useState } from "react";
import { Cpu, RefreshCw, AlertCircle, CheckCircle, Zap } from "lucide-react";
import { analyzeGameAction } from "@/lib/actions/analysis";

interface GameAnalysisData {
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
}

interface AnalysisOverviewCardProps {
  gameId: string;
  whitePlayer: string;
  blackPlayer: string;
  userColor?: string | null;
  analysis: GameAnalysisData | null;
  onAnalysisUpdated: () => void;
}

export function AnalysisOverviewCard({
  gameId,
  whitePlayer,
  blackPlayer,
  userColor = "WHITE",
  analysis,
  onAnalysisUpdated,
}: AnalysisOverviewCardProps) {
  const [selectedSide, setSelectedSide] = useState<"WHITE" | "BLACK">(
    userColor === "BLACK" ? "BLACK" : "WHITE"
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    try {
      const res = await analyzeGameAction(gameId, 10, selectedSide);
      if (!res.success) {
        setErrorMessage(res.error || "Failed to analyze game.");
      } else {
        onAnalysisUpdated();
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error analyzing game.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const status = analysis?.status || "UNANALYZED";

  // Unanalyzed or Failed or Analyzing state
  if (status !== "COMPLETED" || !analysis) {
    return (
      <div className="glass-card rounded-3xl p-6 border border-[rgba(223,180,108,0.22)] space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#dfb46c]" /> Stockfish 18 Analysis
          </h3>
          <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
            {isAnalyzing || status === "ANALYZING" ? "Processing" : "Depth 10"}
          </span>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {status === "FAILED" && !errorMessage && analysis?.errorMessage && (
          <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{analysis.errorMessage}</span>
          </div>
        )}

        {isAnalyzing || status === "ANALYZING" ? (
          <div className="py-6 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#dfb46c] animate-spin" />
            <p className="text-xs text-zinc-300 font-medium">
              Evaluating all positions with Stockfish 18...
            </p>
            <p className="text-[11px] text-zinc-500">
              Calculating move quality, centipawn losses, and blunder classifications.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-zinc-400">
              Run local Stockfish 18 engine analysis to discover inaccuracies, mistakes, blunders, and evaluate move accuracy.
            </p>

            {/* Side Choice Selection */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider block">
                Which side did you play?
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSide("WHITE")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    selectedSide === "WHITE"
                      ? "bg-[#dfb46c]/20 border-[#dfb46c] text-[#f4d084]"
                      : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-white border border-zinc-400 inline-block" />
                  White ({whitePlayer.slice(0, 14)})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSide("BLACK")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    selectedSide === "BLACK"
                      ? "bg-[#dfb46c]/20 border-[#dfb46c] text-[#f4d084]"
                      : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-950 border border-zinc-600 inline-block" />
                  Black ({blackPlayer.slice(0, 14)})
                </button>
              </div>
            </div>

            <button
              onClick={handleStartAnalysis}
              disabled={isAnalyzing}
              className="w-full py-3 rounded-xl bg-gold-gradient text-[#0b0b0e] font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[rgba(223,180,108,0.2)] hover:opacity-95 transition-all"
            >
              <Zap className="w-4 h-4 fill-current" />
              {status === "FAILED" ? "Retry Game Analysis" : "Analyze Game with Stockfish"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Completed Analysis View
  return (
    <div className="glass-card rounded-3xl p-6 border border-[rgba(223,180,108,0.22)] space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" /> Analysis Overview
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
            {analysis.engine} • Depth {analysis.depth}
          </p>
        </div>

        <button
          onClick={handleStartAnalysis}
          disabled={isAnalyzing}
          title="Re-run Analysis"
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-[#dfb46c] hover:border-[#dfb46c]/40 text-xs flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin text-[#dfb46c]" : ""}`} />
          <span className="text-[11px]">Re-analyze</span>
        </button>
      </div>

      {/* Accuracy & ACPL Summary Grid */}
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-3">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold block">
            Overall Accuracy
          </span>
          <span className="font-serif text-2xl font-bold text-[#f4d084] mt-0.5 block">
            {analysis.accuracy !== null ? `${analysis.accuracy.toFixed(1)}%` : "—"}
          </span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-3">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold block">
            Average CPL
          </span>
          <span className="font-serif text-2xl font-bold text-white mt-0.5 block">
            {analysis.acpl !== null ? `${analysis.acpl.toFixed(0)}` : "—"}{" "}
            <span className="text-xs font-mono font-normal text-zinc-500">cp</span>
          </span>
        </div>
      </div>

      {/* Player Breakdown Comparison */}
      <div className="space-y-3 pt-2">
        <span className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider block">
          Player Breakdown
        </span>

        {/* White Player Row */}
        <div
          className={`rounded-xl p-3 border space-y-2 transition-all ${
            selectedSide === "WHITE"
              ? "bg-[#dfb46c]/10 border-[#dfb46c]/40"
              : "bg-zinc-900/40 border-zinc-800/40"
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white inline-block border border-zinc-400" />
              {whitePlayer}
              {selectedSide === "WHITE" && (
                <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-[#dfb46c] text-[#0b0b0e] rounded">
                  YOU
                </span>
              )}
            </span>
            <span className="font-mono font-bold text-[#dfb46c]">
              {analysis.whiteAccuracy !== null ? `${analysis.whiteAccuracy.toFixed(1)}%` : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
              {analysis.whiteInaccuracies} Inaccuracies
            </span>
            <span className="text-orange-400 bg-orange-950/40 px-2 py-0.5 rounded border border-orange-800/40">
              {analysis.whiteMistakes} Mistakes
            </span>
            <span className="text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-800/40">
              {analysis.whiteBlunders} Blunders
            </span>
          </div>
        </div>

        {/* Black Player Row */}
        <div
          className={`rounded-xl p-3 border space-y-2 transition-all ${
            selectedSide === "BLACK"
              ? "bg-[#dfb46c]/10 border-[#dfb46c]/40"
              : "bg-zinc-900/40 border-zinc-800/40"
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-800 inline-block border border-zinc-600" />
              {blackPlayer}
              {selectedSide === "BLACK" && (
                <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-[#dfb46c] text-[#0b0b0e] rounded">
                  YOU
                </span>
              )}
            </span>
            <span className="font-mono font-bold text-[#dfb46c]">
              {analysis.blackAccuracy !== null ? `${analysis.blackAccuracy.toFixed(1)}%` : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
              {analysis.blackInaccuracies} Inaccuracies
            </span>
            <span className="text-orange-400 bg-orange-950/40 px-2 py-0.5 rounded border border-orange-800/40">
              {analysis.blackMistakes} Mistakes
            </span>
            <span className="text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-800/40">
              {analysis.blackBlunders} Blunders
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
