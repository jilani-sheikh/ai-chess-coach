import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { FooterBar } from "@/components/layout/FooterBar";
import Link from "next/link";
import {
  Sparkles,
  Swords,
  Target,
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

export const metadata = {
  title: "AI Training & Drills | AIChess Coach",
  description: "Personalized tactical drills and blunder refutation training derived from your games.",
};

export default async function TrainingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  return (
    <div className="min-h-screen bg-[#0b0b0e] text-zinc-100 flex flex-col font-sans selection:bg-[#dfb46c] selection:text-[#0b0b0e]">
      <AppNavbar user={session.user} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        {/* Header Hero */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dfb46c]/10 border border-[#dfb46c]/30 text-xs font-semibold text-[#dfb46c]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phase 6 • Coming Soon</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white">
            AI Personalized <span className="text-gold-gradient">Training</span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Turn your match weaknesses into unstoppable tactical instincts. Our upcoming drill engine will automatically generate custom puzzles directly from your real Stockfish-analyzed blunders.
          </p>
        </div>

        {/* Feature Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-3xl p-6 border border-zinc-800/80 hover:border-[#dfb46c]/40 transition-all space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-red-950/40 border border-red-900/50 flex items-center justify-center text-red-400 shadow-md">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-white">
              Blunder Refutation Drills
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Replay the critical turning points from your games. The engine forces you to discover the grandmaster move you missed in actual competition.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 border border-zinc-800/80 hover:border-[#dfb46c]/40 transition-all space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-[#dfb46c]/10 border border-[#dfb46c]/30 flex items-center justify-center text-[#dfb46c] shadow-md">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-white">
              Opening Repertoire Patching
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Pinpoint the exact move numbers where your accuracy drops in your favored openings, and drill optimal master responses.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 border border-zinc-800/80 hover:border-[#dfb46c]/40 transition-all space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-blue-950/40 border border-blue-900/50 flex items-center justify-center text-blue-400 shadow-md">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-white">
              Endgame Conversion Mastery
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Practice converting winning material balances against Stockfish with instant AI feedback on technique efficiency and centipawn loss.
            </p>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="glass-card rounded-3xl p-8 border border-[rgba(223,180,108,0.25)] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left bg-gradient-to-r from-zinc-950/80 via-zinc-900/60 to-zinc-950/80">
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-[#dfb46c]">
              <ShieldCheck className="w-4 h-4" />
              <span>Grounded in Your Personal Game Data</span>
            </div>
            <h4 className="font-serif text-xl font-bold text-white">
              Ready to discover your areas to improve today?
            </h4>
            <p className="text-xs text-zinc-400">
              View your personalized strengths and weaknesses based on your completed Stockfish analyses.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
            <Link
              href="/profile"
              className="px-5 py-2.5 rounded-xl bg-gold-gradient text-[#0b0b0e] font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#dfb46c]/10 hover:opacity-90 transition-all"
            >
              <span>View Performance Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/games"
              className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#dfb46c]/40 text-zinc-300 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              <Swords className="w-3.5 h-3.5 text-[#dfb46c]" />
              <span>Analyze More Games</span>
            </Link>
          </div>
        </div>
      </main>

      <FooterBar />
    </div>
  );
}
