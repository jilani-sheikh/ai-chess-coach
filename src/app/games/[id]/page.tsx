import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { getGameDetailsAction } from "@/lib/actions/games";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { FooterBar } from "@/components/layout/FooterBar";
import { GameDetailsClient } from "@/components/games/GameDetailsClient";

export const metadata = {
  title: "Game Replay | AIChess Coach",
  description: "Replay move history and inspect game metadata.",
};

interface GameDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function GameDetailsPage({ params }: GameDetailsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  const { id } = await params;

  let gameData;
  try {
    gameData = await getGameDetailsAction(id);
  } catch {
    redirect("/games");
  }

  if (!gameData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0b0b0e] text-zinc-100 flex flex-col font-sans selection:bg-[#dfb46c] selection:text-[#0b0b0e]">
      <AppNavbar user={session.user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <GameDetailsClient
          game={gameData.game}
          parsed={gameData.parsed}
        />
      </main>

      <FooterBar />
    </div>
  );
}
