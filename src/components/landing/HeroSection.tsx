"use client";

import Link from "next/link";
import { ArrowRight, Play, Zap, ShieldCheck, Lock, Star } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-28">
      {/* Background ambient lighting glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-r from-[#dfb46c]/10 via-[#c39644]/15 to-transparent blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copy & CTAs */}
          <div className="lg:col-span-7 space-y-8">
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[rgba(223,180,108,0.12)] to-[rgba(223,180,108,0.04)] border border-[rgba(223,180,108,0.3)] shadow-sm">
              <Star className="w-3.5 h-3.5 text-[#dfb46c] fill-[#dfb46c]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[#dfb46c]">
                YOUR PERSONAL AI CHESS COACH
              </span>
              <Star className="w-3.5 h-3.5 text-[#dfb46c] fill-[#dfb46c]" />
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl xl:text-7xl font-serif font-bold tracking-tight text-white leading-[1.1]">
              Think Deeper. <br />
              <span className="text-gold-gradient">Play Stronger.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl leading-relaxed">
              AIChess Coach analyzes your games, uncovers hidden insights, and
              builds personalized training to turn weaknesses into winning
              advantages.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link
                href="/auth"
                className="px-8 py-4 rounded-xl text-base font-semibold text-[#0b0b0e] bg-gold-gradient hover:opacity-90 shadow-xl shadow-[rgba(223,180,108,0.25)] flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
              >
                <span>Analyze My Games</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <a
                href="#how-it-works"
                className="px-7 py-4 rounded-xl text-base font-medium text-zinc-200 bg-zinc-900/80 border border-zinc-800 hover:border-[#dfb46c]/40 hover:text-white flex items-center justify-center gap-2 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Play className="w-3 h-3 text-[#dfb46c] fill-[#dfb46c] translate-x-0.5" />
                </div>
                <span>See How It Works</span>
              </a>
            </div>

            {/* Trust Badges */}
            <div className="pt-6 border-t border-zinc-800/80 flex flex-wrap items-center gap-6 text-xs font-medium text-zinc-400">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#dfb46c]" />
                <span>Powered by Stockfish Engine</span>
              </div>
              <span className="text-zinc-700 hidden sm:inline">•</span>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#dfb46c]" />
                <span>Trusted by 10,000+ players</span>
              </div>
              <span className="text-zinc-700 hidden sm:inline">•</span>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#dfb46c]" />
                <span>Private &amp; Secure</span>
              </div>
            </div>
          </div>

          {/* Right Column: Floating 3D Chess & Brilliant Move Cards */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Chessboard Card Base */}
              <div className="glass-card rounded-2xl p-4 shadow-2xl relative z-10 border border-[rgba(223,180,108,0.25)]">
                {/* Board header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-zinc-300">
                      Live Engine Analysis
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#dfb46c]">
                    Depth 24 • Stockfish 16
                  </span>
                </div>

                {/* Simulated Chess Grid with Golden Piece */}
                <div className="aspect-square w-full bg-[#0e0e14] rounded-xl relative overflow-hidden border border-zinc-800/90 flex items-center justify-center">
                  {/* 8x8 Chess Grid pattern */}
                  <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-25">
                    {Array.from({ length: 64 }).map((_, i) => {
                      const row = Math.floor(i / 8);
                      const col = i % 8;
                      const isDark = (row + col) % 2 === 1;
                      return (
                        <div
                          key={i}
                          className={isDark ? "bg-[#1f1f2e]" : "bg-transparent"}
                        />
                      );
                    })}
                  </div>

                  {/* Tactical Vector Line Overlay */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    viewBox="0 0 100 100"
                  >
                    <defs>
                      <linearGradient id="goldVector" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#dfb46c" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 37.5 62.5 L 62.5 37.5"
                      stroke="url(#goldVector)"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                      className="animate-pulse"
                    />
                    <circle cx="62.5" cy="37.5" r="3" fill="#10b981" />
                  </svg>

                  {/* Golden King / Knight Center Graphic */}
                  <div className="relative z-20 flex flex-col items-center justify-center group">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#dfb46c]/30 via-amber-500/20 to-transparent flex items-center justify-center p-1 border border-[#dfb46c]/40 shadow-2xl animate-float">
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-16 h-16 text-[#dfb46c] drop-shadow-[0_10px_20px_rgba(223,180,108,0.5)]"
                      >
                        <path d="M12 2a1 1 0 0 1 1 1v1h1a1 1 0 1 1 0 2h-1v1.171c2.148.44 3.75 2.308 3.75 4.579 0 .823-.223 1.625-.63 2.338l.643 1.286A1 1 0 0 1 15.86 17H8.14a1 1 0 0 1-.895-1.447l.643-1.286A4.974 4.974 0 0 1 7.25 11.9c0-2.27 1.602-4.138 3.75-4.579V6H10a1 1 0 1 1 0-2h1V3a1 1 0 0 1 1-1zM5 19h14a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating "★ BRILLIANT MOVE" Card */}
              <div className="absolute -top-6 -right-4 sm:-right-8 z-30 max-w-[220px] glass-card rounded-xl p-4 shadow-2xl border border-emerald-500/40 bg-[#13131c]/95 animate-float">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
                  <Star className="w-3.5 h-3.5 fill-emerald-400" />
                  <span>BRILLIANT MOVE</span>
                </div>
                <div className="text-base font-bold text-white font-mono">
                  24. Nxf7+!!
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                  This move sacrifices material but forces winning king structure.
                </p>
                <div className="mt-2 text-xs font-bold text-emerald-400">
                  +4.35 eval
                </div>
              </div>

              {/* Floating "+ ACCURACY" Radial Gauge Card */}
              <div className="absolute -bottom-6 -left-4 sm:-left-8 z-30 glass-card rounded-xl p-4 shadow-2xl border border-[rgba(223,180,108,0.4)] bg-[#13131c]/95 animate-float-reverse flex items-center gap-4">
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-zinc-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#dfb46c]"
                      strokeDasharray="94, 100"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-xs font-bold text-white">
                    94%
                  </span>
                </div>
                <div>
                  <div className="text-[10px] font-semibold tracking-wider text-[#dfb46c] uppercase">
                    Accuracy
                  </div>
                  <div className="text-xs font-bold text-white">Great Job!</div>
                  <div className="text-[10px] text-zinc-400">Keep it up.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
