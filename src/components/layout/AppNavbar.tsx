"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Sun, Moon, Menu, X, LogOut, User as UserIcon } from "lucide-react";

interface AppNavbarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function AppNavbar({ user }: AppNavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const isDashboardActive = pathname === "/dashboard";
  const isGamesActive = pathname?.startsWith("/games");
  const isProfileActive = pathname === "/profile";
  const isTrainingActive = pathname === "/training";

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#0b0b0e]/90 border-b border-[rgba(223,180,108,0.18)] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f4d084] via-[#dfb46c] to-[#9e7428] p-[1px] shadow-lg shadow-[rgba(223,180,108,0.2)]">
            <div className="w-full h-full bg-[#0b0b0e] rounded-[11px] flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 text-[#dfb46c] group-hover:scale-110 transition-transform duration-300"
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

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <Link
            href="/dashboard"
            className={`transition-colors relative py-1 ${
              isDashboardActive
                ? "text-[#dfb46c] font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Dashboard
            {isDashboardActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#dfb46c] to-transparent" />
            )}
          </Link>
          <Link
            href="/games"
            className={`transition-colors relative py-1 ${
              isGamesActive
                ? "text-[#dfb46c] font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Games
            {isGamesActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#dfb46c] to-transparent" />
            )}
          </Link>
          <Link
            href="/profile"
            className={`transition-colors relative py-1 ${
              isProfileActive
                ? "text-[#dfb46c] font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Profile
            {isProfileActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#dfb46c] to-transparent" />
            )}
          </Link>
          <Link
            href="/training"
            className={`transition-colors relative py-1 ${
              isTrainingActive
                ? "text-[#dfb46c] font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Training
            {isTrainingActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#dfb46c] to-transparent" />
            )}
          </Link>
        </nav>

        {/* Actions & Profile */}
        <div className="hidden md:flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            aria-label="Toggle Theme"
            className="w-9 h-9 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-[#dfb46c] hover:border-[rgba(223,180,108,0.4)] transition-all"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Profile Badge */}
          <div className="flex items-center gap-3 pl-2 border-l border-zinc-800">
            <Link
              href="/profile"
              title="View Profile"
              className="flex items-center gap-2.5 group/user cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#dfb46c]/40 to-[#9e7428]/40 border border-[#dfb46c]/50 flex items-center justify-center text-xs font-bold text-[#f4d084] shadow-sm group-hover/user:border-[#dfb46c] transition-colors">
                {user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  initials || <UserIcon className="w-4 h-4" />
                )}
              </div>
              <span className="text-sm font-medium text-zinc-200 group-hover/user:text-white transition-colors">
                {displayName}
              </span>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Sign out"
              className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile menu button */}
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
        <div className="md:hidden bg-[#13131a] border-b border-[rgba(223,180,108,0.2)] px-6 py-6 space-y-4 animate-in slide-in-from-top-2">
          <Link
            href="/profile"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 pb-4 border-b border-zinc-800 hover:opacity-90"
          >
            <div className="w-10 h-10 rounded-full bg-[#dfb46c]/20 border border-[#dfb46c]/40 flex items-center justify-center font-bold text-[#f4d084]">
              {initials}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{displayName}</p>
              <p className="text-xs text-zinc-400">{user?.email}</p>
            </div>
          </Link>
          <nav className="flex flex-col gap-3 text-base font-medium">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-2 px-3 rounded-lg ${
                isDashboardActive ? "bg-[#dfb46c]/15 text-[#dfb46c]" : "text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/games"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-2 px-3 rounded-lg ${
                isGamesActive ? "bg-[#dfb46c]/15 text-[#dfb46c]" : "text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              Games
            </Link>
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-2 px-3 rounded-lg ${
                isProfileActive ? "bg-[#dfb46c]/15 text-[#dfb46c]" : "text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              Profile
            </Link>
            <Link
              href="/training"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-2 px-3 rounded-lg ${
                isTrainingActive ? "bg-[#dfb46c]/15 text-[#dfb46c]" : "text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              Training
            </Link>
          </nav>
          <div className="pt-4 border-t border-zinc-800">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-900/50 text-red-400 bg-red-950/10 font-medium"
            >
              <LogOut className="w-4 h-4" /> Log out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
