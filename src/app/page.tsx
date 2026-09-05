import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { GameAnalysisPreview } from "@/components/landing/GameAnalysisPreview";
import { AICoachPreview } from "@/components/landing/AICoachPreview";
import { PersonalImprovementSection } from "@/components/landing/PersonalImprovementSection";
import { TrainingPreviewSection } from "@/components/landing/TrainingPreviewSection";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0b0b0e] text-zinc-100 flex flex-col font-sans selection:bg-[#dfb46c] selection:text-[#0b0b0e]">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <HowItWorksSection />
        <GameAnalysisPreview />
        <AICoachPreview />
        <PersonalImprovementSection />
        <TrainingPreviewSection />
      </main>
      <Footer />
    </div>
  );
}
