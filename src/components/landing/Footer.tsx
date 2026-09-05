"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#08080b] border-t border-[rgba(223,180,108,0.15)] text-zinc-400 text-sm py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-zinc-800/80">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f4d084] via-[#dfb46c] to-[#9e7428] p-[1px]">
                <div className="w-full h-full bg-[#0b0b0e] rounded-[7px] flex items-center justify-center text-[#dfb46c]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-4 h-4"
                  >
                    <path d="M19 22H5" />
                    <path d="M7 22V11l4-5 1.5 2 2.5-3.5L18 7v4l-3 3v8" />
                  </svg>
                </div>
              </div>
              <span className="font-serif text-lg font-bold text-white tracking-tight">
                AIChess Coach
              </span>
            </Link>
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              Combining Stockfish grandmaster evaluation engine algorithms with intuitive LLM explanations to turn recurring weaknesses into long-term winning moves.
            </p>
          </div>

          {/* Links 1 */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#dfb46c]">
              Product
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Engine Analysis
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  AI Coach Conversation
                </a>
              </li>
              <li>
                <a href="#training" className="hover:text-white transition-colors">
                  Adaptive Puzzles
                </a>
              </li>
              <li>
                <Link href="/auth" className="hover:text-white transition-colors">
                  Sign In / Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Links 2 */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#dfb46c]">
              Technology &amp; Security
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Powered by Stockfish 16, Auth.js JWT sessions, and PostgreSQL with pgvector security. Built for production reliability.
            </p>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>© {new Date().getFullYear()} AIChess Coach. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-zinc-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-zinc-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-zinc-300 cursor-pointer">Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
