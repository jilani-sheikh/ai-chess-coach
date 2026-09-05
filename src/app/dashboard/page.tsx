import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { getDashboardDataAction } from "@/lib/actions/games";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { FooterBar } from "@/components/layout/FooterBar";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const metadata = {
  title: "Dashboard | AIChess Coach",
  description: "View your chess performance statistics, recent games, and upload new PGN files.",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  let data;
  try {
    data = await getDashboardDataAction();
  } catch {
    redirect("/auth");
  }

  return (
    <div className="min-h-screen bg-[#0b0b0e] text-zinc-100 flex flex-col font-sans selection:bg-[#dfb46c] selection:text-[#0b0b0e]">
      <AppNavbar user={session.user} />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
        <DashboardClient
          user={session.user}
          stats={data.stats}
          recentGames={data.recentGames}
        />
      </main>

      <FooterBar />
    </div>
  );
}
