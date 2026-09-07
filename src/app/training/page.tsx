import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { FooterBar } from "@/components/layout/FooterBar";
import { getTrainingDashboardDataAction } from "@/lib/actions/training";
import { TrainingClient } from "@/components/training/TrainingClient";

export const metadata = {
  title: "Personalized Training | AIChess Coach",
  description: "Targeted chess training drills derived from your analyzed game blunders and mistakes.",
};

export default async function TrainingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  const initialData = await getTrainingDashboardDataAction();

  return (
    <div className="min-h-screen bg-[#0b0b0e] text-zinc-100 flex flex-col font-sans selection:bg-[#dfb46c] selection:text-[#0b0b0e]">
      <AppNavbar user={session.user} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <TrainingClient initialData={initialData} />
      </main>

      <FooterBar />
    </div>
  );
}
