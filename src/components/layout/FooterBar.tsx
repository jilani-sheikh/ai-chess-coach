"use client";

import { Shield, Lock, Database } from "lucide-react";

export function FooterBar() {
  return (
    <footer className="mt-auto py-8 border-t border-[rgba(223,180,108,0.12)] bg-[#08080a]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-6 flex-wrap justify-center">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <Database className="w-3.5 h-3.5 text-[#dfb46c]" />
            Secure PGN Storage
          </span>
          <span className="flex items-center gap-1.5 text-zinc-400">
            <Shield className="w-3.5 h-3.5 text-[#dfb46c]" />
            Trusted by 10,000+ players
          </span>
          <span className="flex items-center gap-1.5 text-zinc-400">
            <Lock className="w-3.5 h-3.5 text-[#dfb46c]" />
            Private & Secure
          </span>
        </div>
        <p className="text-zinc-600">
          © {new Date().getFullYear()} AIChess Coach. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
