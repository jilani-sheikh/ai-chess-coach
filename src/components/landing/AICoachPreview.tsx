"use client";

import { Bot, User, Send, Sparkles } from "lucide-react";

export function AICoachPreview() {
  return (
    <section className="py-20 relative bg-[#0e0e13]/60 border-t border-[rgba(223,180,108,0.1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-[#dfb46c]">
            AI COACH INTERFACE PREVIEW
          </h2>
          <p className="text-3xl sm:text-4xl font-serif font-bold text-white">
            Ask Questions. Get Grandmaster Clarity.
          </p>
          <p className="text-zinc-400 text-base">
            Have a continuous, natural dialogue with your personal AI coach about any position, move, or strategy.
          </p>
        </div>

        <div className="max-w-4xl mx-auto glass-card rounded-2xl border border-[rgba(223,180,108,0.25)] shadow-2xl overflow-hidden">
          {/* Chat Header */}
          <div className="bg-[#14141d] px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gold-gradient p-[1px]">
                <div className="w-full h-full bg-[#0b0b0e] rounded-full flex items-center justify-center text-[#dfb46c]">
                  <Bot className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  AI Chess Coach
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Always online • Connected to your game history
                </p>
              </div>
            </div>
            <div className="text-xs font-medium text-[#dfb46c] flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dfb46c]/10 border border-[#dfb46c]/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Session</span>
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="p-6 space-y-6 bg-[#0b0b0e]/90 min-h-[300px]">
            {/* User Message */}
            <div className="flex gap-4 items-start max-w-2xl ml-auto flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="bg-[#1f1f2e] text-white p-4 rounded-2xl rounded-tr-none border border-zinc-800 text-sm leading-relaxed shadow-md">
                Why was my move 19. d5 a mistake in my game earlier today?
              </div>
            </div>

            {/* Coach Message */}
            <div className="flex gap-4 items-start max-w-2xl">
              <div className="w-8 h-8 rounded-full bg-gold-gradient p-[1px] shrink-0">
                <div className="w-full h-full bg-[#0b0b0e] rounded-full flex items-center justify-center text-[#dfb46c]">
                  <Bot className="w-4 h-4" />
                </div>
              </div>
              <div className="glass-card text-zinc-200 p-4 rounded-2xl rounded-tl-none border border-[rgba(223,180,108,0.2)] text-sm leading-relaxed space-y-3 shadow-md">
                <p>
                  The problem wasn&apos;t the move itself, but that it allowed your opponent to control the open central file before your king reached safety.
                </p>
                <p>
                  When you played <code className="text-[#dfb46c] font-mono bg-zinc-900 px-1 py-0.5 rounded">19. d5?</code>, it opened lines toward your king while leaving your rook uncoordinated. A better master-level principle here is to solidify your king position with <code className="text-[#dfb46c] font-mono bg-zinc-900 px-1 py-0.5 rounded">19. h3!</code> first.
                </p>
              </div>
            </div>
          </div>

          {/* Chat Input Bar Mockup */}
          <div className="p-4 bg-[#13131a] border-t border-zinc-800 flex items-center gap-3">
            <input
              type="text"
              readOnly
              value="How can I avoid making similar central pawn blunders in the future?"
              className="flex-1 bg-[#0b0b0e] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-300 focus:outline-none"
            />
            <button
              type="button"
              className="w-11 h-11 rounded-xl bg-gold-gradient text-[#0b0b0e] flex items-center justify-center font-bold hover:opacity-90 shadow-md transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
