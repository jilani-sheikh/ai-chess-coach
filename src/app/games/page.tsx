import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { getUserGamesAction } from "@/lib/actions/games";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { FooterBar } from "@/components/layout/FooterBar";
import { GamesClient } from "@/components/games/GamesClient";

export const metadata = {
  title: "My Games | AIChess Coach",
  description: "Browse and search your library of uploaded chess games.",
};

interface SearchParams {
  search?: string;
  result?: string;
  sort?: string;
  page?: string;
}

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  const sParams = await searchParams;
  const search = sParams.search || "";
  const resultFilter = sParams.result || "all";
  const sortBy = sParams.sort || "recent";
  const page = parseInt(sParams.page || "1", 10);

  let initialData;
  try {
    initialData = await getUserGamesAction({
      search,
      resultFilter,
      sortBy,
      page,
      limit: 10,
    });
  } catch {
    redirect("/auth");
  }

  return (
    <div className="min-h-screen bg-[#0b0b0e] text-zinc-100 flex flex-col font-sans selection:bg-[#dfb46c] selection:text-[#0b0b0e]">
      <AppNavbar user={session.user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        <GamesClient
          initialGames={initialData.games}
          totalCount={initialData.totalCount}
          totalPages={initialData.totalPages}
          currentPage={initialData.currentPage}
          currentSearch={search}
          currentResultFilter={resultFilter}
          currentSortBy={sortBy}
        />
      </main>

      <FooterBar />
    </div>
  );
}
