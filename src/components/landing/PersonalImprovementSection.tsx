"use client";

import { Target, GraduationCap, Castle, LineChart, Users, Award, TrendingUp } from "lucide-react";

export function PersonalImprovementSection() {
  const valueCards = [
    {
      icon: Target,
      title: "Deep Game Analysis",
      description: "Advanced engine analysis with human-like explanations.",
    },
    {
      icon: GraduationCap,
      title: "Personalized Training",
      description: "Custom lessons and drills tailored to your weaknesses.",
    },
    {
      icon: Castle,
      title: "Tactical Puzzles",
      description: "Sharpen your tactics with hand-picked puzzles.",
    },
    {
      icon: LineChart,
      title: "Track Progress",
      description: "Monitor your rating, accuracy, and improvement over time.",
    },
  ];

  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-[#dfb46c]">
            YOUR ELEVATED CHESS JOURNEY
          </h2>
          <p className="text-3xl sm:text-4xl font-serif font-bold text-white">
            Built for Serious Improvement
          </p>
          <p className="text-zinc-400 text-base">
            Every feature is engineered to turn your specific weak spots into solid winning patterns.
          </p>
        </div>

        {/* 4 Value Proposition Cards in Dark Glass Container (Matches Reference Image) */}
        <div className="glass-card rounded-2xl p-6 lg:p-8 border border-[rgba(223,180,108,0.25)] shadow-2xl space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {valueCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="space-y-3 group">
                  <div className="w-12 h-12 rounded-xl bg-[#14141e] border border-[rgba(223,180,108,0.25)] flex items-center justify-center text-[#dfb46c] group-hover:border-[#dfb46c] group-hover:scale-105 transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-serif">
                    {card.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Social Proof & Metrics Divider Row (Matches Reference Image Bottom Row) */}
          <div className="pt-8 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Stat 1 */}
            <div className="md:col-span-3 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white font-mono">
                  10,000+
                </div>
                <div className="text-xs text-zinc-400">Players worldwide</div>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="md:col-span-3 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#dfb46c] shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white font-mono">
                  100K+
                </div>
                <div className="text-xs text-zinc-400">Games Analyzed</div>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="md:col-span-3 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white font-mono">
                  94%
                </div>
                <div className="text-xs text-zinc-400">Average Accuracy Increase</div>
              </div>
            </div>

            {/* Testimonial Snippet */}
            <div className="md:col-span-3 bg-[#0d0d12] p-3 rounded-xl border border-zinc-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gold-gradient p-[1px] shrink-0">
                <div className="w-full h-full bg-zinc-900 rounded-full flex items-center justify-center font-bold text-xs text-[#dfb46c]">
                  RS
                </div>
              </div>
              <div>
                <p className="text-[11px] text-zinc-300 italic leading-tight">
                  &ldquo;AIChess Coach helped me understand positions in a way no coach ever could.&rdquo;
                </p>
                <p className="text-[10px] text-[#dfb46c] font-semibold mt-0.5">
                  — IM Rohit Sharma
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
