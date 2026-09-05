import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = {
  title: "Authentication — AIChess Coach",
  description: "Sign in or create your account to access personalized AI chess coaching.",
};

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-[#0b0b0e] text-zinc-100 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden selection:bg-[#dfb46c] selection:text-[#0b0b0e]">
      {/* Background ambient lighting glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-r from-[#dfb46c]/10 via-[#c39644]/15 to-transparent blur-[120px] pointer-events-none rounded-full" />

      {/* Header logo */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between py-2 relative z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f4d084] via-[#dfb46c] to-[#9e7428] p-[1px] shadow-lg shadow-[rgba(223,180,108,0.2)]">
            <div className="w-full h-full bg-[#0b0b0e] rounded-[11px] flex items-center justify-center">
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
          </div>
        </Link>

        <Link
          href="/"
          className="text-xs font-medium text-zinc-400 hover:text-[#dfb46c] transition-colors"
        >
          ← Back to Home
        </Link>
      </header>

      {/* Main form container */}
      <main className="my-auto py-8 relative z-10 flex items-center justify-center">
        <AuthForm />
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-zinc-600 py-4 relative z-10">
        <p>© {new Date().getFullYear()} AIChess Coach. Protected by Auth.js &amp; PostgreSQL security.</p>
      </footer>
    </div>
  );
}
