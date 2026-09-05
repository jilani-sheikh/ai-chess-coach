"use client";

import Link from "next/link";
import { useState } from "react";
import { Sun, Moon, Menu, X } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#0b0b0e]/80 border-b border-[rgba(223,180,108,0.15)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f4d084] via-[#dfb46c] to-[#9e7428] p-[1px] shadow-lg shadow-[rgba(223,180,108,0.2)]">
            <div className="w-full h-full bg-[#0b0b0e] rounded-[11px] flex items-center justify-center">
              {/* Chess Knight SVG */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 text-[#dfb46c] group-hover:scale-110 transition-transform"
              >
                <path d="M19 22H5" />
                <path d="M7 22V11l4-5 1.5 2 2.5-3.5L18 7v4l-3 3v8" />
                <circle cx="10" cy="9" r="1" fill="currentColor" />
              </svg>
            </div>
          </div>
          <div>
            <span className="font-serif text-xl font-bold tracking-tight text-white block">
              AIChess Coach
            </span>
            <span className="text-[9px] uppercase tracking-[0.25em] text-[#dfb46c] font-medium block">
              Your Game. Elevated.
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
          <a href="#features" className="hover:text-[#dfb46c] transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-[#dfb46c] transition-colors">
            How It Works
          </a>
          <a href="#training" className="hover:text-[#dfb46c] transition-colors">
            Training
          </a>
          <a href="#pricing" className="hover:text-[#dfb46c] transition-colors">
            Pricing
          </a>
          <a href="#about" className="hover:text-[#dfb46c] transition-colors">
            About
          </a>
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            aria-label="Toggle Theme"
            className="w-9 h-9 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-[#dfb46c] hover:border-[rgba(223,180,108,0.4)] transition-all"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <Link
            href="/auth"
            className="px-5 py-2 rounded-lg text-sm font-medium text-zinc-200 hover:text-white bg-zinc-900/90 border border-zinc-800 hover:border-[#dfb46c]/40 transition-all"
          >
            Log in
          </Link>

          <Link
            href="/auth"
            className="px-5 py-2 rounded-lg text-sm font-semibold text-[#0b0b0e] bg-gold-gradient hover:opacity-90 shadow-md shadow-[rgba(223,180,108,0.25)] transition-all"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-zinc-300 hover:text-[#dfb46c] p-2"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#13131a] border-b border-[rgba(223,180,108,0.2)] px-6 py-6 space-y-4">
          <nav className="flex flex-col gap-4 text-base font-medium text-zinc-300">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#dfb46c]"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#dfb46c]"
            >
              How It Works
            </a>
            <a
              href="#training"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#dfb46c]"
            >
              Training
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#dfb46c]"
            >
              Pricing
            </a>
          </nav>
          <div className="pt-4 border-t border-zinc-800 flex flex-col gap-3">
            <Link
              href="/auth"
              className="w-full text-center py-2.5 rounded-lg border border-zinc-700 text-zinc-200 font-medium"
            >
              Log in
            </Link>
            <Link
              href="/auth"
              className="w-full text-center py-2.5 rounded-lg bg-gold-gradient text-[#0b0b0e] font-semibold"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
