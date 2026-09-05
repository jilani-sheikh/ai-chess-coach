"use client";

import { Upload, Cpu, BrainCircuit, Target, ArrowRight } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      icon: Upload,
      title: "Play & Upload",
      description:
        "Import your games seamlessly via PGN paste, upload, or direct platform syncing from Lichess or Chess.com.",
    },
    {
      num: "02",
      icon: Cpu,
      title: "Stockfish Analysis",
      description:
        "Deep positional evaluation runs across every move to pinpoint blunders, inaccuracies, tactical swings, and brilliant moves.",
    },
    {
      num: "03",
      icon: BrainCircuit,
      title: "AI Coaching Breakdown",
      description:
        "Our LLM coach converts raw engine numbers into plain human explanations, clarifying why moves work and why mistakes happened.",
    },
    {
      num: "04",
      icon: Target,
      title: "Targeted Practice",
      description:
        "Practice custom puzzles generated specifically from your recurring positional and tactical weaknesses to level up faster.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 relative bg-[#0e0e13]/60 border-t border-[rgba(223,180,108,0.1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-[#dfb46c]">
            HOW IT WORKS
          </h2>
          <p className="text-3xl sm:text-4xl font-serif font-bold text-white">
            The Continuous Improvement Loop
          </p>
          <p className="text-zinc-400 text-base">
            From raw engine data to master-level understanding in 4 simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="glass-card glass-card-hover rounded-2xl p-6 relative group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#dfb46c]/20 to-amber-950/40 border border-[#dfb46c]/30 flex items-center justify-center text-[#dfb46c] group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-2xl font-bold text-zinc-700 group-hover:text-[#dfb46c]/60 transition-colors">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 font-serif">
                  {step.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {step.description}
                </p>

                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 z-20 text-zinc-700">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
