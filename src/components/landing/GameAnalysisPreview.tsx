"use client";

import { useState } from "react";
import { AlertTriangle, Sparkles, TrendingUp, CheckCircle } from "lucide-react";

export function GameAnalysisPreview() {
  const [selectedMove, setSelectedMove] = useState<number>(19);

  const moveLog = [
    { num: "17.", white: "Bf4", black: "Nc6", type: "good" },
    { num: "18.", white: "Re1", black: "Rfe8", type: "good" },
    { num: "19.", white: "d5?", black: "exd5", type: "blunder", note: "Blunder (-2.4)" },
    { num: "20.", white: "Nxd5", black: "Qd8", type: "inaccuracy" },
    { num: "24.", white: "Nxf7+!!", black: "Kxf7", type: "brilliant", note: "Brilliant (+4.3)" },
  ];

  return (
    <section id="features" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-[#dfb46c]">
            GAME ANALYSIS PREVIEW
          </h2>
          <p className="text-3xl sm:text-4xl font-serif font-bold text-white">
            Deep Engine Analysis Meets AI Explanations
          </p>
          <p className="text-zinc-400 text-base">
            Don&apos;t just see computer evaluation numbers — understand the strategic story behind every turn.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 lg:p-8 border border-[rgba(223,180,108,0.25)] shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Interactive Move List & Stockfish Evaluation Graph */}
            <div className="lg:col-span-5 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#dfb46c]" />
                  <span className="font-semibold text-white">Game #1,042 vs GrandmasterAI</span>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-medium px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30">
                  Stockfish 16
                </span>
              </div>

              {/* Simulated Evaluation Graph Curve */}
              <div className="bg-[#0b0b0e] p-4 rounded-xl border border-zinc-800/80">
                <div className="flex justify-between text-xs text-zinc-400 mb-2 font-mono">
                  <span>Eval History</span>
                  <span className="text-[#dfb46c]">+4.35 (White Winning)</span>
                </div>
                <div className="h-20 w-full relative flex items-end">
                  <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="evalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#dfb46c" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#dfb46c" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 40 Q 50 35, 100 45 T 150 70 T 200 50 T 250 15 T 300 10 L 300 80 L 0 80 Z"
                      fill="url(#evalGradient)"
                    />
                    <path
                      d="M 0 40 Q 50 35, 100 45 T 150 70 T 200 50 T 250 15 T 300 10"
                      fill="none"
                      stroke="#dfb46c"
                      strokeWidth="2.5"
                    />
                    {/* Blunder point highlight */}
                    <circle cx="150" cy="70" r="5" fill="#ef4444" className="animate-pulse" />
                    {/* Brilliant point highlight */}
                    <circle cx="250" cy="15" r="5" fill="#10b981" />
                  </svg>
                </div>
              </div>

              {/* Move Notation List */}
              <div className="bg-[#0b0b0e] rounded-xl border border-zinc-800/80 p-3 space-y-1.5 font-mono text-sm max-h-[220px] overflow-y-auto">
                {moveLog.map((m) => (
                  <div
                    key={m.num}
                    onClick={() => setSelectedMove(parseInt(m.num))}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                      parseInt(m.num) === selectedMove
                        ? "bg-[#1f1f2e] border border-[rgba(223,180,108,0.3)] text-white"
                        : "hover:bg-zinc-900/60 text-zinc-400"
                    }`}
                  >
                    <span className="w-12 text-zinc-500 font-bold">{m.num}</span>
                    <span className="flex-1 font-semibold">{m.white}</span>
                    <span className="flex-1 text-zinc-400">{m.black}</span>
                    {m.type === "blunder" && (
                      <span className="text-[11px] font-sans px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-semibold">
                        {m.note}
                      </span>
                    )}
                    {m.type === "brilliant" && (
                      <span className="text-[11px] font-sans px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                        {m.note}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: AI Coach Explanation Card */}
            <div className="lg:col-span-7 bg-[#0d0d12] rounded-xl p-6 border border-zinc-800 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gold-gradient p-[1px]">
                    <div className="w-full h-full bg-[#0b0b0e] rounded-[7px] flex items-center justify-center text-[#dfb46c]">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      AI Coach Explanation
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Analyzing Move 19. d5? (Blunder)
                    </p>
                  </div>
                </div>

                <span className="text-xs px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Blunder Detected
                </span>
              </div>

              {/* Coaching explanation text */}
              <div className="space-y-4 text-sm leading-relaxed text-zinc-300">
                <p>
                  <strong className="text-white">Why 19. d5? was a mistake:</strong>{" "}
                  This pawn push opened the central d-file prematurely before your king was fully safeguarded. It allowed Black to execute{" "}
                  <code className="text-[#dfb46c] font-mono bg-zinc-900 px-1.5 py-0.5 rounded">19...exd5</code>, pinning your knight on e4 and forcing a knight exchange that lost key control of the center.
                </p>

                <div className="bg-[#14141d] p-4 rounded-lg border border-[rgba(223,180,108,0.2)] space-y-2">
                  <div className="text-xs font-semibold text-[#dfb46c] flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Recommended Alternative: 19. h3!
                  </div>
                  <p className="text-xs text-zinc-400">
                    Playing 19. h3 preserves king air and denies Black&apos;s knight the g4 square, keeping a solid +0.8 strategic advantage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
