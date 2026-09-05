"use client";

import { Zap, ArrowRight, ShieldAlert } from "lucide-react";
import Link from "next/link";

export function TrainingPreviewSection() {
  const samplePuzzles = [
    {
      title: "Tactical Pin Defense",
      theme: "Pinned Pieces",
      difficulty: "Intermediate",
      rating: "1450",
      description: "Exploit Black's uncoordinated rooks on the d-file after the pawn trade.",
    },
    {
      title: "Endgame Rook Activity",
      theme: "7th Rank Control",
      difficulty: "Advanced",
      rating: "1800",
      description: "Convert a 3v3 pawn endgame by activating your king before opponent's rook cuts off access.",
    },
    {
      title: "King Air & Back Rank",
      theme: "Back-Rank Mate",
      difficulty: "Essential",
      rating: "1200",
      description: "Prevent sudden back-rank weaknesses by creating pawn luft at the right turn.",
    },
  ];

  return (
    <section id="training" className="py-20 relative bg-[#0e0e13]/60 border-t border-[rgba(223,180,108,0.1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-[#dfb46c]">
            TRAINING SYSTEM PREVIEW
          </h2>
          <p className="text-3xl sm:text-4xl font-serif font-bold text-white">
            Custom Puzzles Generated From Your Mistakes
          </p>
          <p className="text-zinc-400 text-base">
            No more solving random tactics. Practice positions directly derived from your recent analyzed games.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {samplePuzzles.map((p) => (
            <div
              key={p.title}
              className="glass-card glass-card-hover rounded-2xl p-6 relative border border-[rgba(223,180,108,0.2)] flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-[#dfb46c] px-2.5 py-1 rounded bg-[#dfb46c]/10 border border-[#dfb46c]/20">
                    {p.theme}
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-400">
                    {p.rating} Rating
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white font-serif">
                  {p.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-medium flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#dfb46c]" />
                  {p.difficulty}
                </span>
                <span className="text-[#dfb46c] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Preview Puzzle <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-16 text-center">
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-[#0b0b0e] bg-gold-gradient hover:opacity-90 shadow-xl shadow-[rgba(223,180,108,0.25)] transition-all"
          >
            <Zap className="w-5 h-5 fill-[#0b0b0e]" />
            <span>Start Training Your Weaknesses</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
