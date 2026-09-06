import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { getProfileDataAction } from "@/lib/actions/profile";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { FooterBar } from "@/components/layout/FooterBar";
import { ProfileClient } from "@/components/profile/ProfileClient";

export const metadata = {
  title: "Performance Profile | AIChess Coach",
  description: "View your personalized chess performance metrics, phase accuracy, and AI coaching insights.",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  let profileData;
  try {
    profileData = await getProfileDataAction();
  } catch {
    redirect("/auth");
  }

  return (
    <div className="min-h-screen bg-[#0b0b0e] text-zinc-100 flex flex-col font-sans selection:bg-[#dfb46c] selection:text-[#0b0b0e]">
      <AppNavbar user={session.user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <ProfileClient initialData={profileData} />
      </main>

      <FooterBar />
    </div>
  );
}
