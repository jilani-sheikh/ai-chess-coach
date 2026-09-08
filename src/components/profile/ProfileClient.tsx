"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Trophy,
  Target,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Swords,
  RotateCcw,
  User,
  Calendar,
  Mail,
  Zap,
  CheckCircle2,
  Lock,
} from "lucide-react";
import {
  ProfileData,
  generateProfileInsightsAction,
} from "@/lib/actions/profile";

interface ProfileClientProps {
  initialData: ProfileData;
}

export function ProfileClient({ initialData }: ProfileClientProps) {
  const [data] = useState<ProfileData>(initialData);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFetchInsights = () => {
    setAiError(null);
    startTransition(async () => {
      const res = await generateProfileInsightsAction();
      if (res.success && res.insights) {
        setAiInsights(res.insights);
      } else {
        setAiError(res.error || "Failed to generate coaching insights.");
      }
    });
  };

  const getAcplTier = (acpl: number) => {
    if (acpl === 0) return { label: "Unrated", color: "text-zinc-400" };
    if (acpl <= 25) return { label: "Master Class", color: "text-emerald-400" };
    if (acpl <= 40) return { label: "Expert Control", color: "text-cyan-400" };
    if (acpl <= 60) return { label: "Solid Tactical", color: "text-[#dfb46c]" };
    return { label: "Developing Instincts", color: "text-amber-400" };
  };

  const acplTier = getAcplTier(data.overallAcpl);

  return (
    <div className="space-y-10">
      {/* Profile Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[rgba(223,180,108,0.25)] shadow-2xl relative overflow-hidden bg-gradient-to-r from-zinc-950 via-[#13131c] to-zinc-950">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#dfb46c]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Player Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#f4d084] via-[#dfb46c] to-[#9e7428] p-[2px] shadow-xl shadow-[#dfb46c]/15 shrink-0">
              <div className="w-full h-full bg-[#0b0b0e] rounded-[14px] flex items-center justify-center text-xl sm:text-2xl font-serif font-bold text-[#dfb46c]">
                {data.user.name.substring(0, 2).toUpperCase()}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {data.user.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#dfb46c]/10 text-[#dfb46c] border border-[#dfb46c]/30">
                  Player Performance
                </span>
              </div>
              <p className="text-xs text-zinc-400 flex items-center gap-2 flex-wrap">
                <span>{data.user.email}</span>
                <span className="text-zinc-600">•</span>
                <span>Member since {data.user.createdAt}</span>
              </p>
            </div>
          </div>

          {/* Header Action CTA */}
          <div className="flex items-center gap-3 w-full md:w-auto shrink-0 flex-wrap">
            <Link
              href="/training"
              className="flex-1 md:flex-initial px-5 py-3 rounded-xl bg-gold-gradient text-[#0b0b0e] font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#dfb46c]/15 hover:opacity-95 transition-all group"
            >
              <span>Train These Weaknesses</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/games"
              className="px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#dfb46c]/40 text-zinc-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Swords className="w-3.5 h-3.5 text-[#dfb46c]" />
              <span>Analyze Games</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Core Performance Metrics (4-Card Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Average Accuracy */}
        <div className="glass-card rounded-2xl p-5 border border-zinc-800/80 shadow-xl space-y-2 relative overflow-hidden group hover:border-[#dfb46c]/40 transition-colors">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Average Accuracy</span>
            <Trophy className="w-4 h-4 text-[#dfb46c]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-white">
              {data.overallAccuracy > 0 ? `${data.overallAccuracy}%` : "—"}
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">user moves</span>
          </div>
          <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gold-gradient h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, data.overallAccuracy)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Average ACPL */}
        <div className="glass-card rounded-2xl p-5 border border-zinc-800/80 shadow-xl space-y-2 relative overflow-hidden group hover:border-[#dfb46c]/40 transition-colors">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Average CPL</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-white">
              {data.overallAcpl > 0 ? data.overallAcpl : "—"}
            </span>
            <span className={`text-[11px] font-semibold ${acplTier.color}`}>
              {acplTier.label}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500">Centipawn loss per move</p>
        </div>

        {/* Metric 3: Error Breakdown */}
        <div className="glass-card rounded-2xl p-5 border border-zinc-800/80 shadow-xl space-y-2.5 relative overflow-hidden group hover:border-[#dfb46c]/40 transition-colors">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Mistakes & Blunders</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-2 py-1 rounded-lg bg-red-950/60 border border-red-900/60 flex items-center gap-1.5 text-xs font-bold text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span>{data.totalBlunders} Blunders</span>
            </div>
            <div className="px-2 py-1 rounded-lg bg-orange-950/60 border border-orange-900/60 flex items-center gap-1.5 text-xs font-bold text-orange-400">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              <span>{data.totalMistakes} Mistakes</span>
            </div>
          </div>
          <p className="text-[11px] text-zinc-500">
            {data.totalInaccuracies} Inaccuracies logged
          </p>
        </div>

        {/* Metric 4: Games Analyzed */}
        <div className="glass-card rounded-2xl p-5 border border-zinc-800/80 shadow-xl space-y-2 relative overflow-hidden group hover:border-[#dfb46c]/40 transition-colors">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Games Analyzed</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-white">
              {data.totalAnalyzedGames}
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">
              / {data.totalGames} uploaded
            </span>
          </div>
          <p className="text-[11px] text-zinc-500">
            Stockfish 18 deep evaluations
          </p>
        </div>
      </div>

      {/* AI Grandmaster Executive Insights Panel */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[rgba(223,180,108,0.3)] shadow-2xl space-y-5 bg-gradient-to-b from-[#14141d] to-[#0c0c10]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center text-[#0b0b0e] shadow-md shadow-[#dfb46c]/15 shrink-0">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                Grandmaster Executive Insights
                <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Gemini AI
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Personalized performance synthesis strictly grounded in your Stockfish match evaluations.
              </p>
            </div>
          </div>

          {data.hasEnoughGamesForInsights && (
            <button
              onClick={handleFetchInsights}
              disabled={isPending}
              className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#dfb46c]/50 text-zinc-200 hover:text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isPending ? "animate-spin text-[#dfb46c]" : ""}`} />
              <span>{aiInsights ? "Refresh Insights" : "Generate Coaching Insights"}</span>
            </button>
          )}
        </div>

        {/* State 1: Too Few Analyzed Games (< 3) */}
        {!data.hasEnoughGamesForInsights ? (
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 text-center space-y-3 max-w-lg mx-auto">
            <div className="w-10 h-10 rounded-full bg-amber-950/40 border border-amber-900/60 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-base font-bold text-white">
              Analyze more games to unlock personalized insights
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We require at least <span className="text-[#dfb46c] font-semibold">3 analyzed games</span> ({data.totalAnalyzedGames}/3 analyzed so far) to calculate reliable strengths, weaknesses, and Grandmaster advice without premature assumptions.
            </p>
            <Link
              href="/games"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold-gradient text-[#0b0b0e] font-bold text-xs shadow-md hover:opacity-90 transition-opacity"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Go to Games to Analyze</span>
            </Link>
          </div>
        ) : isPending ? (
          /* State 2: Loading State */
          <div className="py-10 text-center space-y-3">
            <div className="inline-block w-8 h-8 rounded-full border-2 border-[#dfb46c] border-t-transparent animate-spin" />
            <p className="text-xs text-zinc-300 font-medium">
              Grandmaster Coach is synthesizing your match patterns...
            </p>
            <p className="text-[11px] text-zinc-500">
              Evaluating White vs Black tendencies, tactical error phases, and conversion efficiency.
            </p>
          </div>
        ) : aiInsights ? (
          /* State 3: Generated Insights */
          <div className="p-6 rounded-2xl bg-zinc-950/60 border border-zinc-800/90 text-zinc-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans space-y-4">
            {aiInsights}
          </div>
        ) : (
          /* State 4: Initial Prompt to Generate */
          <div className="p-6 rounded-2xl bg-zinc-900/30 border border-dashed border-zinc-800 text-center space-y-3">
            <p className="text-xs text-zinc-300 max-w-md mx-auto">
              You have {data.totalAnalyzedGames} completed match evaluations ready. Click below to generate your personalized Grandmaster performance review.
            </p>
            <button
              onClick={handleFetchInsights}
              className="px-5 py-2.5 rounded-xl bg-gold-gradient text-[#0b0b0e] font-bold text-xs inline-flex items-center gap-2 shadow-md hover:opacity-90 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Generate Personalized Insights</span>
            </button>
          </div>
        )}

        {aiError && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 text-xs flex items-center justify-between">
            <span>{aiError}</span>
            <button
              onClick={handleFetchInsights}
              className="text-[11px] font-bold text-red-400 underline ml-2"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* White vs Black Performance (Side-by-Side) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
              White vs. Black Performance
            </h3>
            <p className="text-xs text-zinc-400">
              Evaluating your tactical execution and win rates by side.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* White Performance Card */}
          <div className="glass-card rounded-3xl p-6 border border-zinc-800/80 shadow-xl space-y-5 relative overflow-hidden bg-gradient-to-br from-zinc-900/50 to-zinc-950/80">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-900 font-bold flex items-center justify-center shadow">
                  ♔
                </div>
                <div>
                  <h4 className="font-serif text-base font-bold text-white">
                    Playing as White
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    {data.whiteStats.games} analyzed matches
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-serif text-xl font-bold text-[#dfb46c]">
                  {data.whiteStats.winRate}%
                </span>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  Win Rate
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
              <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <p className="text-[10px] text-zinc-500 uppercase font-mono">Accuracy</p>
                <p className="font-serif text-base sm:text-lg font-bold text-white mt-0.5">
                  {data.whiteStats.accuracy > 0 ? `${data.whiteStats.accuracy}%` : "—"}
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <p className="text-[10px] text-zinc-500 uppercase font-mono">ACPL</p>
                <p className="font-serif text-base sm:text-lg font-bold text-white mt-0.5">
                  {data.whiteStats.acpl > 0 ? data.whiteStats.acpl : "—"}
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <p className="text-[10px] text-zinc-500 uppercase font-mono">Record</p>
                <p className="font-mono text-xs sm:text-sm font-bold text-white mt-1">
                  {data.whiteStats.wins}-{data.whiteStats.losses}-{data.whiteStats.draws}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
              <span>Error tally:</span>
              <div className="flex items-center gap-2">
                <span className="text-red-400 font-bold">{data.whiteStats.blunders} blunders</span>
                <span>•</span>
                <span className="text-orange-400 font-bold">{data.whiteStats.mistakes} mistakes</span>
              </div>
            </div>
          </div>

          {/* Black Performance Card */}
          <div className="glass-card rounded-3xl p-6 border border-zinc-800/80 shadow-xl space-y-5 relative overflow-hidden bg-gradient-to-br from-zinc-900/50 to-zinc-950/80">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 text-[#dfb46c] font-bold flex items-center justify-center shadow">
                  ♚
                </div>
                <div>
                  <h4 className="font-serif text-base font-bold text-white">
                    Playing as Black
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    {data.blackStats.games} analyzed matches
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-serif text-xl font-bold text-[#dfb46c]">
                  {data.blackStats.winRate}%
                </span>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  Win Rate
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
              <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <p className="text-[10px] text-zinc-500 uppercase font-mono">Accuracy</p>
                <p className="font-serif text-base sm:text-lg font-bold text-white mt-0.5">
                  {data.blackStats.accuracy > 0 ? `${data.blackStats.accuracy}%` : "—"}
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <p className="text-[10px] text-zinc-500 uppercase font-mono">ACPL</p>
                <p className="font-serif text-base sm:text-lg font-bold text-white mt-0.5">
                  {data.blackStats.acpl > 0 ? data.blackStats.acpl : "—"}
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <p className="text-[10px] text-zinc-500 uppercase font-mono">Record</p>
                <p className="font-mono text-xs sm:text-sm font-bold text-white mt-1">
                  {data.blackStats.wins}-{data.blackStats.losses}-{data.blackStats.draws}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
              <span>Error tally:</span>
              <div className="flex items-center gap-2">
                <span className="text-red-400 font-bold">{data.blackStats.blunders} blunders</span>
                <span>•</span>
                <span className="text-orange-400 font-bold">{data.blackStats.mistakes} mistakes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Phase Breakdown & Recent Accuracy Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left (7 cols): Recent Accuracy Trend */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-6 border border-zinc-800/80 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#dfb46c]" /> Recent Accuracy Trend
              </h3>
              <p className="text-xs text-zinc-400">
                Tracking your match-by-match precision trajectory.
              </p>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">
              Last {data.recentTrend.length} matches
            </span>
          </div>

          {data.recentTrend.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">
              No analyzed games with assigned player color found yet.
            </p>
          ) : (
            <div className="space-y-3">
              {data.recentTrend.map((match) => (
                <Link
                  key={match.id}
                  href={`/games/${match.id}`}
                  className="p-3.5 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800 hover:border-[#dfb46c]/40 flex items-center justify-between gap-3 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        match.result === "WIN"
                          ? "bg-emerald-950/80 text-emerald-400 border border-emerald-900"
                          : match.result === "LOSS"
                          ? "bg-red-950/80 text-red-400 border border-red-900"
                          : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                      }`}
                    >
                      {match.result}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-white group-hover:text-[#dfb46c] transition-colors truncate">
                        vs. {match.opponent}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        Played as {match.userColor} • {match.date}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-serif text-sm font-bold text-white">
                      {match.accuracy}%
                    </span>
                    <p className="text-[10px] text-zinc-500 font-mono">{match.acpl} ACPL</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right (5 cols): Game Phase Breakdown */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-6 border border-zinc-800/80 shadow-xl space-y-6">
          <div className="border-b border-zinc-800 pb-3">
            <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#dfb46c]" /> Phase Breakdown
            </h3>
            <p className="text-xs text-zinc-400">
              Accuracy and blunder density across game stages.
            </p>
          </div>

          <div className="space-y-4">
            {/* Opening Stage */}
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Opening (Moves 1–10)</span>
                <span className="font-mono font-bold text-[#dfb46c]">
                  {data.phaseStats.openingAccuracy > 0
                    ? `${data.phaseStats.openingAccuracy}%`
                    : "—"}
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#dfb46c] h-full rounded-full"
                  style={{ width: `${Math.min(100, data.phaseStats.openingAccuracy)}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500">
                {data.phaseStats.openingBlunders} blunders during opening development
              </p>
            </div>

            {/* Middlegame Stage */}
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Middlegame (Moves 11–30)</span>
                <span className="font-mono font-bold text-cyan-400">
                  {data.phaseStats.middlegameAccuracy > 0
                    ? `${data.phaseStats.middlegameAccuracy}%`
                    : "—"}
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-cyan-400 h-full rounded-full"
                  style={{ width: `${Math.min(100, data.phaseStats.middlegameAccuracy)}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500">
                {data.phaseStats.middlegameBlunders} blunders in complex tactical middlegames
              </p>
            </div>

            {/* Endgame Stage */}
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Endgame (Moves 31+)</span>
                <span className="font-mono font-bold text-emerald-400">
                  {data.phaseStats.endgameAccuracy > 0
                    ? `${data.phaseStats.endgameAccuracy}%`
                    : "—"}
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full"
                  style={{ width: `${Math.min(100, data.phaseStats.endgameAccuracy)}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500">
                {data.phaseStats.endgameBlunders} blunders in technical endgame conversions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Strengths & Areas to Improve (Deterministic Evaluation) */}
      <div className="space-y-4">
        <div>
          <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
            Diagnostic Strengths & Areas to Improve
          </h3>
          <p className="text-xs text-zinc-400">
            Automated system findings calculated deterministically from your match database.
          </p>
        </div>

        {!data.hasEnoughGamesForInsights ? (
          <div className="p-6 rounded-3xl glass-card border border-zinc-800 text-center space-y-3">
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Strengths and areas to improve require at least <span className="text-[#dfb46c] font-semibold">3 analyzed games</span> ({data.totalAnalyzedGames}/3 analyzed) to ensure conclusions reflect sustained patterns rather than isolated games.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths Card */}
            <div className="glass-card rounded-3xl p-6 border border-emerald-900/40 shadow-xl space-y-4 bg-gradient-to-br from-emerald-950/10 to-zinc-950">
              <div className="flex items-center gap-2.5 text-emerald-400 font-serif font-bold text-base border-b border-zinc-800 pb-3">
                <ShieldCheck className="w-5 h-5" />
                <span>Identified Strengths</span>
              </div>
              <ul className="space-y-3">
                {data.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas to Improve Card */}
            <div className="glass-card rounded-3xl p-6 border border-red-900/40 shadow-xl space-y-4 bg-gradient-to-br from-red-950/10 to-zinc-950">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5 text-red-400 font-serif font-bold text-base">
                  <Target className="w-5 h-5" />
                  <span>Areas to Improve</span>
                </div>
                <Link
                  href="/training"
                  className="text-[11px] font-bold text-[#dfb46c] hover:underline flex items-center gap-1"
                >
                  <span>Train Now</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <ul className="space-y-3">
                {data.areasToImprove.map((w, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Account Details Section (Simple & Separate) */}
      <div className="glass-card rounded-3xl p-6 border border-zinc-800/80 shadow-xl space-y-4">
        <h4 className="font-serif text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
          <User className="w-4 h-4 text-[#dfb46c]" /> Account & Security
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-zinc-400">
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <User className="w-3 h-3 text-[#dfb46c]" /> Display Name
            </span>
            <p className="text-white font-semibold">{data.user.name}</p>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Mail className="w-3 h-3 text-[#dfb46c]" /> Account Email
            </span>
            <p className="text-white font-semibold truncate">{data.user.email}</p>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#dfb46c]" /> Member Since
            </span>
            <p className="text-white font-semibold">{data.user.createdAt}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
