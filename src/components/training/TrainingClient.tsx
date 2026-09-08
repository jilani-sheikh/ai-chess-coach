"use client";

import { useState, useTransition, useCallback, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Swords,
  Target,
  Flame,
  Trophy,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Loader2,
  BarChart3,
  Shield,
  Zap,
  Clock,
  Bot,
  Eye,
} from "lucide-react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import {
  TrainingDashboardData,
  SessionStartResult,
  PuzzleStepEvalResult,
  CompletePuzzleAttemptResult,
  SessionCompleteResult,
  startTrainingSessionAction,
  submitPuzzleStepAction,
  completePuzzleAttemptAction,
  completeTrainingSessionAction,
  explainAttemptAction,
} from "@/lib/actions/training";
import {
  TrainingPuzzle,
  TrainingCategory,
  AttemptResult,
  PuzzleContinuationStep,
  aggregateStepResults,
} from "@/lib/chess/training-types";

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: TrainingCategory[] = [
  "Mixed",
  "Tactical Awareness",
  "Blunder Prevention",
  "Endgame Decisions",
  "Opening Decisions",
];

const CATEGORY_ICONS: Record<string, string> = {
  "Mixed": "♟",
  "Tactical Awareness": "⚡",
  "Blunder Prevention": "🛡",
  "Endgame Decisions": "♚",
  "Opening Decisions": "🏁",
};

const RESULT_BORDER: Record<AttemptResult, string> = {
  CORRECT: "border-emerald-900/60",
  ACCEPTABLE: "border-cyan-900/60",
  INCORRECT: "border-red-900/60",
};
const RESULT_BG: Record<AttemptResult, string> = {
  CORRECT: "bg-emerald-950/40",
  ACCEPTABLE: "bg-cyan-950/40",
  INCORRECT: "bg-red-950/40",
};
const RESULT_TEXT: Record<AttemptResult, string> = {
  CORRECT: "text-emerald-400",
  ACCEPTABLE: "text-cyan-400",
  INCORRECT: "text-red-400",
};
const RESULT_FULL_LABEL: Record<AttemptResult, string> = {
  CORRECT: "Best Move Found!",
  ACCEPTABLE: "Acceptable Alternative",
  INCORRECT: "Not the Best Decision",
};

// ── Local types ───────────────────────────────────────────────────────────────

type Phase =
  | "DASHBOARD"
  | "STARTING"
  | "PLAYING"
  | "STEP_RESULT"
  | "PUZZLE_DONE"
  | "COMPLETE";

interface LocalStepResult {
  stepIndex: number;
  result: AttemptResult;
  cplAfter: number;
  userMoveSan: string;
  bestMoveSan: string;
  opponentResponseSan: string | null;
}

interface SessionResults {
  score: number;
  total: number;
  accuracy: number;
  categoriesPracticed: string[];
}

// ── Main component ────────────────────────────────────────────────────────────

interface TrainingClientProps {
  initialData: TrainingDashboardData;
}

export function TrainingClient({ initialData }: TrainingClientProps) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("DASHBOARD");
  const [selectedCategory, setSelectedCategory] = useState<TrainingCategory>(
    initialData.recommendedCategory
  );
  const [isPending, startTransition] = useTransition();

  // Session
  const [sessionId, setSessionId] = useState("");
  const [puzzles, setPuzzles] = useState<TrainingPuzzle[]>([]);
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Multi-step puzzle state
  const [puzzleStep, setPuzzleStep] = useState(0);
  const [stepResults, setStepResults] = useState<LocalStepResult[]>([]);
  const [lastStepResult, setLastStepResult] = useState<LocalStepResult | null>(null);
  const [puzzleFinalResult, setPuzzleFinalResult] = useState<AttemptResult | null>(null);

  // Board display
  const [currentFen, setCurrentFen] = useState("");
  const [isOpponentPlaying, setIsOpponentPlaying] = useState(false);
  const [puzzleError, setPuzzleError] = useState<string | null>(null);

  // AI explanation
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  // Session results
  const [sessionResults, setSessionResults] = useState<SessionResults | null>(null);

  // Opponent response timer ref (cleanup on unmount)
  const opponentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (opponentTimerRef.current) clearTimeout(opponentTimerRef.current); }, []);

  // ── Derived ────────────────────────────────────────────────────────────────

  const currentPuzzle = puzzles[puzzleIndex] ?? null;
  const continuationSteps: PuzzleContinuationStep[] = useMemo(
    () => currentPuzzle?.continuationSteps ?? [],
    [currentPuzzle]
  );
  const currentStep: PuzzleContinuationStep | null = continuationSteps[puzzleStep] ?? null;
  const totalSteps = continuationSteps.length;
  const boardOrientation: "white" | "black" =
    currentPuzzle?.userSideColor === "b" ? "black" : "white";

  // ── Reset helpers ──────────────────────────────────────────────────────────

  function resetPuzzleState(puzzle: TrainingPuzzle) {
    const firstStep = puzzle.continuationSteps[0];
    setPuzzleStep(0);
    setStepResults([]);
    setLastStepResult(null);
    setPuzzleFinalResult(null);
    setAiExplanation(null);
    setExplainError(null);
    setPuzzleError(null);
    setIsOpponentPlaying(false);
    if (opponentTimerRef.current) clearTimeout(opponentTimerRef.current);
    setCurrentFen(firstStep?.fenBefore ?? puzzle.setupFen);
  }

  // ── Session start ──────────────────────────────────────────────────────────

  const handleStartSession = () => {
    setSessionError(null);
    setPhase("STARTING");
    startTransition(async () => {
      const res: SessionStartResult = await startTrainingSessionAction(selectedCategory, 5);
      if (!res.success || !res.sessionId || !res.puzzles?.length) {
        setSessionError(res.error || "Failed to start session.");
        setPhase("DASHBOARD");
        return;
      }
      setSessionId(res.sessionId);
      setPuzzles(res.puzzles);
      setPuzzleIndex(0);
      resetPuzzleState(res.puzzles[0]);
      setPhase("PLAYING");
    });
  };

  // ── Move handler (multi-step) ──────────────────────────────────────────────

  const handleDrop = useCallback(
    ({
      sourceSquare,
      targetSquare,
    }: {
      sourceSquare: string;
      targetSquare: string | null;
      piece: unknown;
    }): boolean => {
      if (
        phase !== "PLAYING" ||
        isPending ||
        isOpponentPlaying ||
        !currentStep ||
        !currentPuzzle ||
        !targetSquare
      )
        return false;

      // Validate move locally
      const chess = new Chess(currentStep.fenBefore);
      let moveSan: string;
      try {
        const mv = chess.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
        if (!mv) return false;
        moveSan = mv.san;
      } catch {
        return false;
      }

      // Show the attempted position visually
      setCurrentFen(chess.fen());
      setPuzzleError(null);

      startTransition(async () => {
        // ── Step 1: Evaluate the move via Stockfish ──
        const stepRes: PuzzleStepEvalResult = await submitPuzzleStepAction({
          sessionId,
          stepFen: currentStep.fenBefore,
          userMoveSan: moveSan,
          bestMoveUci: currentStep.bestMoveUci,
          bestMoveSan: currentStep.bestMoveSan,
        });

        if (!stepRes.success) {
          setPuzzleError(stepRes.error || "Failed to evaluate move. Try again.");
          setCurrentFen(currentStep.fenBefore);
          return;
        }

        const localStepResult: LocalStepResult = {
          stepIndex: puzzleStep,
          result: stepRes.result!,
          cplAfter: stepRes.cplAfter!,
          userMoveSan: stepRes.userMoveSan!,
          bestMoveSan: currentStep.bestMoveSan,
          opponentResponseSan: currentStep.opponentResponseSan,
        };

        // ── INCORRECT: show step feedback, offer retry ──
        if (stepRes.result === "INCORRECT") {
          setLastStepResult(localStepResult);
          setCurrentFen(currentStep.fenBefore); // Reset board
          setPhase("STEP_RESULT");
          return;
        }

        // ── CORRECT / ACCEPTABLE ──
        const newStepResults = [...stepResults, localStepResult];
        setStepResults(newStepResults);

        const isLastStep = puzzleStep >= continuationSteps.length - 1;
        const hasOppResponse =
          !!currentStep.opponentResponseSan && !!currentStep.fenAfterOpponent;

        if (!isLastStep && hasOppResponse) {
          // Animate opponent's response, then advance to next user step
          setCurrentFen(currentStep.fenAfterOpponent!);
          setIsOpponentPlaying(true);

          opponentTimerRef.current = setTimeout(() => {
            const nextIdx = puzzleStep + 1;
            setPuzzleStep(nextIdx);
            setCurrentFen(continuationSteps[nextIdx].fenBefore);
            setIsOpponentPlaying(false);
          }, 1500);
        } else {
          // ── Last step or no further continuation: complete puzzle ──
          const res: CompletePuzzleAttemptResult = await completePuzzleAttemptAction({
            sessionId,
            puzzle: currentPuzzle,
            stepResults: newStepResults,
          });

          const aggResult = aggregateStepResults(newStepResults.map((s) => s.result));
          setPuzzleFinalResult(res.aggregateResult ?? aggResult);
          setPhase("PUZZLE_DONE");
        }
      });

      return true;
    },
    [
      phase,
      isPending,
      isOpponentPlaying,
      currentStep,
      currentPuzzle,
      sessionId,
      puzzleStep,
      stepResults,
      continuationSteps,
    ]
  );

  // ── Retry a step ───────────────────────────────────────────────────────────

  const handleRetry = () => {
    if (!currentStep) return;
    setCurrentFen(currentStep.fenBefore);
    setLastStepResult(null);
    setPuzzleError(null);
    setPhase("PLAYING");
  };

  // ── Skip entire puzzle (accept this step as INCORRECT, finalize) ───────────

  const handleSkipPuzzle = () => {
    if (!currentPuzzle || !lastStepResult) return;
    const finalResults = [...stepResults, lastStepResult];

    startTransition(async () => {
      await completePuzzleAttemptAction({
        sessionId,
        puzzle: currentPuzzle,
        stepResults: finalResults,
      });
      const aggResult = aggregateStepResults(finalResults.map((s) => s.result));
      setPuzzleFinalResult(aggResult);
      setStepResults(finalResults);
      setPhase("PUZZLE_DONE");
    });
  };

  // ── Advance to next puzzle ─────────────────────────────────────────────────

  const handleNextPuzzle = () => {
    const nextIndex = puzzleIndex + 1;
    if (nextIndex >= puzzles.length) {
      startTransition(async () => {
        const res: SessionCompleteResult = await completeTrainingSessionAction(sessionId);
        if (res.success) {
          setSessionResults({
            score: res.score!,
            total: res.total!,
            accuracy: res.accuracy!,
            categoriesPracticed: res.categoriesPracticed!,
          });
          setPhase("COMPLETE");
        }
      });
    } else {
      const nextPuzzle = puzzles[nextIndex];
      setPuzzleIndex(nextIndex);
      resetPuzzleState(nextPuzzle);
      setPhase("PLAYING");
    }
  };

  // ── AI Explanation (on-demand) ─────────────────────────────────────────────

  const handleExplain = () => {
    if (!currentPuzzle || isExplaining) return;
    setIsExplaining(true);
    setExplainError(null);

    // Build a human-readable step summary for Gemini context
    const stepSummary = stepResults
      .map((sr) => {
        const oppPart = sr.opponentResponseSan
          ? `, Stockfish responded with ${sr.opponentResponseSan}`
          : "";
        return `Step ${sr.stepIndex + 1}: You played ${sr.userMoveSan} | Engine best: ${sr.bestMoveSan} | ${RESULT_FULL_LABEL[sr.result]} (${sr.cplAfter} CPL)${oppPart}`;
      })
      .join("\n");

    const avgCpl =
      stepResults.length > 0
        ? Math.round(stepResults.reduce((s, r) => s + r.cplAfter, 0) / stepResults.length)
        : 0;

    startTransition(async () => {
      const res = await explainAttemptAction({
        sessionId,
        puzzle: currentPuzzle,
        userMoveSan: stepResults[0]?.userMoveSan ?? "unknown",
        result: puzzleFinalResult ?? "INCORRECT",
        cplAfter: avgCpl,
        stepSummary,
      });
      setIsExplaining(false);
      if (res.success && res.explanation) {
        setAiExplanation(res.explanation);
      } else {
        setExplainError(res.error || "Failed to generate explanation.");
      }
    });
  };

  // ── New session ────────────────────────────────────────────────────────────

  const handleNewSession = () => {
    setSessionResults(null);
    setPhase("DASHBOARD");
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (phase === "DASHBOARD") {
    return (
      <DashboardView
        data={initialData}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onStart={handleStartSession}
        isStarting={isPending}
        sessionError={sessionError}
      />
    );
  }

  if (phase === "STARTING") {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-5">
        <Loader2 className="w-10 h-10 text-[#dfb46c] animate-spin" />
        <div className="text-center space-y-1">
          <p className="text-zinc-200 font-semibold text-sm">Building your training puzzles…</p>
          <p className="text-zinc-500 text-xs">Running Stockfish on your game blunders to create multi-step continuations.</p>
        </div>
      </div>
    );
  }

  if (phase === "COMPLETE" && sessionResults) {
    return <ResultsView results={sessionResults} onNewSession={handleNewSession} />;
  }

  if (!currentPuzzle || !currentStep) {
    return (
      <div className="text-center py-16 text-zinc-400 text-sm">
        No puzzle loaded.{" "}
        <button onClick={handleNewSession} className="text-[#dfb46c] underline cursor-pointer">
          Return to Dashboard
        </button>
      </div>
    );
  }

  // ── Active puzzle view ────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Session progress header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-400">
            Puzzle <span className="text-white font-bold">{puzzleIndex + 1}</span>{" "}
            / {puzzles.length}
          </span>
          <div className="flex gap-1">
            {puzzles.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < puzzleIndex
                    ? "bg-emerald-500"
                    : i === puzzleIndex
                    ? "bg-[#dfb46c]"
                    : "bg-zinc-700"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold border border-zinc-700 bg-zinc-900 text-zinc-200">
            {CATEGORY_ICONS[currentPuzzle.category]} {currentPuzzle.category}
          </span>
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              currentPuzzle.difficulty === "Fundamental"
                ? "bg-red-950/60 text-red-400 border-red-900/60"
                : currentPuzzle.difficulty === "Intermediate"
                ? "bg-amber-950/60 text-amber-400 border-amber-900/60"
                : "bg-cyan-950/60 text-cyan-400 border-cyan-900/60"
            }`}
          >
            {currentPuzzle.difficulty}
          </span>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Board */}
        <div className="order-1 lg:col-span-7">
          <div className="glass-card rounded-3xl p-4 sm:p-5 border border-[rgba(223,180,108,0.22)] shadow-2xl space-y-4">
            <div className="max-w-[460px] mx-auto aspect-square rounded-2xl overflow-hidden border border-[rgba(223,180,108,0.3)] shadow-xl">
              <Chessboard
                options={{
                  position: currentFen,
                  boardOrientation,
                  allowDragging: phase === "PLAYING" && !isPending && !isOpponentPlaying,
                  onPieceDrop: handleDrop,
                  darkSquareStyle: { backgroundColor: "#769656" },
                  lightSquareStyle: { backgroundColor: "#eeedd2" },
                }}
              />
            </div>

            {/* Board status line */}
            <div className="text-[11px] text-zinc-500 text-center font-mono space-y-1">
              <p>
                {currentPuzzle.userSideColor === "w" ? "Playing as White" : "Playing as Black"}
                {" · "}Move {currentPuzzle.moveNumber} from game vs.{" "}
                {currentPuzzle.opponentName}
              </p>

              {isOpponentPlaying && (
                <div className="flex items-center justify-center gap-1.5 text-amber-400 font-semibold animate-pulse">
                  <Bot className="w-3.5 h-3.5" />
                  <span>
                    Stockfish plays:{" "}
                    <span className="font-mono text-white">
                      {continuationSteps[puzzleStep - 1]?.opponentResponseSan ??
                        currentStep.opponentResponseSan ??
                        "…"}
                    </span>
                  </span>
                </div>
              )}

              {isPending && !isOpponentPlaying && (
                <div className="flex items-center justify-center gap-1.5 text-[#dfb46c]">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Stockfish evaluating…</span>
                </div>
              )}

              {puzzleError && (
                <p className="text-red-400">{puzzleError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="order-2 lg:col-span-5 space-y-4">
          {phase === "PLAYING" && (
            <PlayingPanel
              puzzleStep={puzzleStep}
              totalSteps={totalSteps}
              stepResults={stepResults}
              currentPuzzle={currentPuzzle}
              isOpponentPlaying={isOpponentPlaying}
            />
          )}

          {phase === "STEP_RESULT" && lastStepResult && (
            <StepResultPanel
              stepResult={lastStepResult}
              puzzleStep={puzzleStep}
              totalSteps={totalSteps}
              onRetry={handleRetry}
              onSkip={handleSkipPuzzle}
              isSkipping={isPending}
            />
          )}

          {phase === "PUZZLE_DONE" && puzzleFinalResult && (
            <PuzzleDonePanel
              finalResult={puzzleFinalResult}
              stepResults={stepResults}
              continuationSteps={continuationSteps}
              aiExplanation={aiExplanation}
              isExplaining={isExplaining}
              explainError={explainError}
              onExplain={handleExplain}
              onNext={handleNextPuzzle}
              isLast={puzzleIndex >= puzzles.length - 1}
              isPending={isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Playing Panel ─────────────────────────────────────────────────────────────

function PlayingPanel({
  puzzleStep,
  totalSteps,
  stepResults,
  currentPuzzle,
  isOpponentPlaying,
}: {
  puzzleStep: number;
  totalSteps: number;
  stepResults: LocalStepResult[];
  currentPuzzle: TrainingPuzzle;
  isOpponentPlaying: boolean;
}) {
  return (
    <div className="glass-card rounded-3xl p-6 border border-[rgba(223,180,108,0.25)] shadow-xl space-y-5">
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-[#dfb46c]/10 border border-[#dfb46c]/30 flex items-center justify-center text-[#dfb46c]">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-serif text-base font-bold text-white">
            {isOpponentPlaying ? "Stockfish Responds" : `Your Move — Step ${puzzleStep + 1} of ${totalSteps}`}
          </h3>
          <p className="text-xs text-zinc-400">
            {isOpponentPlaying
              ? "Watch the opponent's response, then find the next improvement."
              : "Find the best continuation. Drag a piece to play."}
          </p>
        </div>
      </div>

      {/* Step progress dots */}
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const sr = stepResults.find((r) => r.stepIndex === i);
          return (
            <div key={i} className="flex items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                  sr
                    ? sr.result === "CORRECT"
                      ? "bg-emerald-900/60 border-emerald-600/60 text-emerald-300"
                      : sr.result === "ACCEPTABLE"
                      ? "bg-cyan-900/60 border-cyan-600/60 text-cyan-300"
                      : "bg-red-900/60 border-red-600/60 text-red-300"
                    : i === puzzleStep
                    ? "bg-[#dfb46c]/20 border-[#dfb46c]/60 text-[#dfb46c]"
                    : "bg-zinc-800 border-zinc-700 text-zinc-500"
                }`}
              >
                {sr ? (sr.result === "CORRECT" ? "✓" : sr.result === "ACCEPTABLE" ? "≈" : "✗") : i + 1}
              </div>
              {i < totalSteps - 1 && (
                <div className={`w-6 h-0.5 rounded ${i < puzzleStep ? "bg-zinc-600" : "bg-zinc-800"}`} />
              )}
            </div>
          );
        })}
        <span className="ml-2 text-xs text-zinc-500">
          {stepResults.length}/{totalSteps} completed
        </span>
      </div>

      {/* Context info */}
      <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
          Puzzle Context
        </p>
        <div className="space-y-1.5 text-xs text-zinc-300">
          <div className="flex justify-between">
            <span className="text-zinc-500">Move number</span>
            <span className="font-mono font-bold text-white">{currentPuzzle.moveNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Original mistake</span>
            <span className="font-mono text-red-400">Hidden until done</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Steps in this puzzle</span>
            <span className="font-mono font-bold text-[#dfb46c]">{totalSteps}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-500 leading-relaxed">
        This is a <span className="text-white font-semibold">{totalSteps}-move continuation</span> derived from your game.
        Find the best move at each step. Stockfish plays opponent responses automatically.
      </p>
    </div>
  );
}

// ── Step Result Panel ─────────────────────────────────────────────────────────

function StepResultPanel({
  stepResult,
  puzzleStep,
  totalSteps,
  onRetry,
  onSkip,
  isSkipping,
}: {
  stepResult: LocalStepResult;
  puzzleStep: number;
  totalSteps: number;
  onRetry: () => void;
  onSkip: () => void;
  isSkipping: boolean;
}) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="space-y-4">
      <div
        className={`glass-card rounded-3xl p-6 border shadow-xl space-y-5 ${RESULT_BORDER[stepResult.result]} ${RESULT_BG[stepResult.result]}`}
      >
        <div className={`flex items-center gap-3 border-b border-white/10 pb-3 ${RESULT_TEXT[stepResult.result]}`}>
          <XCircle className="w-6 h-6 shrink-0" />
          <div>
            <h3 className="font-serif text-base font-bold text-white">
              Step {puzzleStep + 1} of {totalSteps} — Not the Best Move
            </h3>
            <p className="text-[11px] text-zinc-400">Think carefully and try another move.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-black/20 border border-white/10 space-y-1 text-center">
            <p className="text-[10px] uppercase tracking-wider text-zinc-400">You played</p>
            <p className="font-mono font-bold text-white text-base">{stepResult.userMoveSan}</p>
          </div>
          <div className="p-3 rounded-xl bg-black/20 border border-white/10 space-y-1 text-center flex flex-col items-center justify-center">
            <p className="text-[10px] uppercase tracking-wider text-zinc-400">Engine best</p>
            {showAnswer ? (
              <p className="font-mono font-bold text-emerald-400 text-base">{stepResult.bestMoveSan}</p>
            ) : (
              <button
                onClick={() => setShowAnswer(true)}
                className="text-[11px] font-bold text-[#dfb46c] hover:underline cursor-pointer flex items-center gap-1 mt-0.5"
              >
                <Eye className="w-3.5 h-3.5" /> Show Answer
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-zinc-400">
          Your move cost <span className="text-white font-bold">{stepResult.cplAfter} centipawns</span> vs the engine best.
          {stepResult.cplAfter <= 40
            ? " That's close — try another move to find the strongest line."
            : " Look for a move that seizes the initiative or creates a concrete threat."}
        </p>
      </div>

      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
        <button
          onClick={onRetry}
          className="flex-1 min-w-[120px] px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#dfb46c]/40 text-zinc-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Retry Step</span>
        </button>
        {!showAnswer && (
          <button
            onClick={() => setShowAnswer(true)}
            className="flex-1 min-w-[120px] px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#dfb46c]/40 text-[#dfb46c] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Show Answer</span>
          </button>
        )}
        <button
          onClick={onSkip}
          disabled={isSkipping}
          className="flex-1 min-w-[120px] px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-900/40 text-zinc-400 hover:text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSkipping ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
          <span>Skip Puzzle</span>
        </button>
      </div>
    </div>
  );
}

// ── Puzzle Done Panel ─────────────────────────────────────────────────────────

function PuzzleDonePanel({
  finalResult,
  stepResults,
  continuationSteps,
  aiExplanation,
  isExplaining,
  explainError,
  onExplain,
  onNext,
  isLast,
  isPending,
}: {
  finalResult: AttemptResult;
  stepResults: LocalStepResult[];
  continuationSteps: PuzzleContinuationStep[];
  aiExplanation: string | null;
  isExplaining: boolean;
  explainError: string | null;
  onExplain: () => void;
  onNext: () => void;
  isLast: boolean;
  isPending: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Final result banner */}
      <div
        className={`glass-card rounded-3xl p-5 border shadow-xl space-y-4 ${RESULT_BORDER[finalResult]} ${RESULT_BG[finalResult]}`}
      >
        <div className={`flex items-center gap-3 border-b border-white/10 pb-3 ${RESULT_TEXT[finalResult]}`}>
          {finalResult === "CORRECT" ? (
            <CheckCircle2 className="w-6 h-6 shrink-0" />
          ) : finalResult === "ACCEPTABLE" ? (
            <AlertCircle className="w-6 h-6 shrink-0" />
          ) : (
            <XCircle className="w-6 h-6 shrink-0" />
          )}
          <div>
            <h3 className="font-serif text-base font-bold text-white">
              Puzzle Complete — {RESULT_FULL_LABEL[finalResult]}
            </h3>
            <p className="text-[11px] text-zinc-400">
              {stepResults.length} of {continuationSteps.length} steps completed
            </p>
          </div>
        </div>

        {/* Per-step breakdown */}
        <div className="space-y-2">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
            Step Breakdown
          </p>
          {stepResults.map((sr) => {
            const step = continuationSteps[sr.stepIndex];
            return (
              <div key={sr.stepIndex} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${RESULT_BG[sr.result]} border ${RESULT_BORDER[sr.result]} ${RESULT_TEXT[sr.result]}`}
                    >
                      {sr.result === "CORRECT" ? "✓" : sr.result === "ACCEPTABLE" ? "≈" : "✗"}
                    </span>
                    <span className="text-zinc-300">Step {sr.stepIndex + 1}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className={RESULT_TEXT[sr.result]}>{sr.userMoveSan}</span>
                    {sr.result !== "CORRECT" && (
                      <span className="text-zinc-500">
                        best: <span className="text-emerald-400">{sr.bestMoveSan}</span>
                      </span>
                    )}
                    <span className="text-zinc-600">{sr.cplAfter} CPL</span>
                  </div>
                </div>
                {step?.opponentResponseSan && (
                  <div className="ml-7 flex items-center gap-1.5 text-[10px] text-zinc-500">
                    <Bot className="w-3 h-3 text-zinc-600" />
                    <span>Stockfish: <span className="font-mono text-zinc-400">{step.opponentResponseSan}</span></span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Explanation (on-demand) */}
      <div className="glass-card rounded-3xl p-5 border border-[rgba(223,180,108,0.25)] shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#dfb46c]" />
            <span className="font-serif text-sm font-bold text-white">Grandmaster Coaching</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              Gemini
            </span>
          </div>
          {!aiExplanation && (
            <button
              onClick={onExplain}
              disabled={isExplaining}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-zinc-900 border border-zinc-700 hover:border-[#dfb46c]/50 text-zinc-200 hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isExplaining ? (
                <Loader2 className="w-3 h-3 animate-spin text-[#dfb46c]" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              <span>{isExplaining ? "Analyzing…" : "Explain with AI"}</span>
            </button>
          )}
        </div>

        {aiExplanation ? (
          <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {aiExplanation}
          </p>
        ) : explainError ? (
          <div className="flex items-center justify-between gap-2 text-xs text-red-400">
            <span>{explainError}</span>
            <button onClick={onExplain} className="font-bold underline shrink-0 cursor-pointer">
              Retry
            </button>
          </div>
        ) : (
          <p className="text-xs text-zinc-500 italic">
            Click &quot;Explain with AI&quot; for a Grandmaster coaching breakdown of this full continuation.
          </p>
        )}
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        disabled={isPending}
        className="w-full px-4 py-3 rounded-xl bg-gold-gradient text-[#0b0b0e] font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
      >
        <span>{isLast ? "Finish Session" : "Next Puzzle"}</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Dashboard View ────────────────────────────────────────────────────────────

function DashboardView({
  data,
  selectedCategory,
  setSelectedCategory,
  onStart,
  isStarting,
  sessionError,
}: {
  data: TrainingDashboardData;
  selectedCategory: TrainingCategory;
  setSelectedCategory: (c: TrainingCategory) => void;
  onStart: () => void;
  isStarting: boolean;
  sessionError: string | null;
}) {
  const { stats } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[rgba(223,180,108,0.25)] shadow-2xl bg-gradient-to-r from-zinc-950 via-[#13131c] to-zinc-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#dfb46c]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#dfb46c]">
              <Flame className="w-4 h-4" />
              <span>Personalized Mistake-Based Training — Multi-Step Continuations</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Train Your Weak Spots
            </h2>
            <p className="text-xs text-zinc-400 max-w-md">
              Up to 3 user decisions per puzzle, derived from your real blunders. Stockfish provides opponent responses from its principal variation — no artificial puzzles.
            </p>
          </div>

          <div className="shrink-0">
            {data.hasEnoughGames ? (
              <button
                onClick={onStart}
                disabled={isStarting}
                className="px-6 py-3 rounded-xl bg-gold-gradient text-[#0b0b0e] font-bold text-sm flex items-center gap-2 shadow-lg hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isStarting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Swords className="w-4 h-4" />
                )}
                <span>Start Training Session</span>
              </button>
            ) : (
              <Link
                href="/games"
                className="px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#dfb46c]/40 text-zinc-300 hover:text-white font-semibold text-sm flex items-center gap-2 transition-colors"
              >
                <Swords className="w-4 h-4 text-[#dfb46c]" />
                <span>Analyze Games First</span>
              </Link>
            )}
          </div>
        </div>

        {sessionError && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 text-xs">
            {sessionError}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Clock className="w-4 h-4 text-[#dfb46c]" />} label="Sessions" value={stats.sessionsCompleted} />
        <StatCard icon={<Target className="w-4 h-4 text-cyan-400" />} label="Puzzles Attempted" value={stats.puzzlesAttempted} />
        <StatCard icon={<Trophy className="w-4 h-4 text-emerald-400" />} label="Solved" value={stats.puzzlesSolved} />
        <StatCard
          icon={<BarChart3 className="w-4 h-4 text-amber-400" />}
          label="Training Accuracy"
          value={stats.puzzlesAttempted > 0 ? `${stats.trainingAccuracy}%` : "—"}
        />
      </div>

      {/* Category selector */}
      <div className="glass-card rounded-3xl p-6 border border-zinc-800/80 shadow-xl space-y-5">
        <div>
          <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#dfb46c]" /> Training Focus
          </h3>
          <p className="text-xs text-zinc-400">
            Select a category or use the recommended focus based on your weakness analysis.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#dfb46c]/15 border-[#dfb46c]/60 text-[#dfb46c]"
                  : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white"
              }`}
            >
              {CATEGORY_ICONS[cat]} {cat}
              {cat === data.recommendedCategory && cat !== "Mixed" && (
                <span className="ml-1.5 text-[9px] font-bold text-[#dfb46c] uppercase tracking-wider">
                  Recommended
                </span>
              )}
            </button>
          ))}
        </div>

        {data.availablePuzzleCount > 0 && (
          <p className="text-[11px] text-zinc-500">
            <span className="text-white font-bold">{data.availablePuzzleCount}</span> puzzle candidates from your analyzed games.
          </p>
        )}

        {!data.hasEnoughGames && (
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-900/40 text-xs text-amber-300 space-y-1.5">
            <p className="font-semibold">Not enough analyzed mistakes yet.</p>
            <p>Analyze at least one game with blunders or mistakes to unlock personalized training.</p>
            <Link
              href="/games"
              className="inline-flex items-center gap-1 font-bold text-[#dfb46c] hover:underline mt-0.5"
            >
              Go to Games <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>

      {/* Category breakdown */}
      {Object.keys(stats.categoryBreakdown).length > 0 && (
        <div className="glass-card rounded-3xl p-6 border border-zinc-800/80 shadow-xl space-y-4">
          <h3 className="font-serif text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Shield className="w-4 h-4 text-[#dfb46c]" /> Category Progress
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.categoryBreakdown).map(([cat, breakdown]) => {
              const pct =
                breakdown.attempted > 0
                  ? Math.round((breakdown.solved / breakdown.attempted) * 100)
                  : 0;
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-semibold">
                      {CATEGORY_ICONS[cat] ?? "♟"} {cat}
                    </span>
                    <span className="text-zinc-400 font-mono">
                      {breakdown.solved}/{breakdown.attempted} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5">
                    <div
                      className="bg-[#dfb46c] h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Session Results View ──────────────────────────────────────────────────────

function ResultsView({
  results,
  onNewSession,
}: {
  results: SessionResults;
  onNewSession: () => void;
}) {
  const isPerfect = results.score === results.total;
  return (
    <div className="max-w-lg mx-auto py-8 space-y-6 text-center">
      <div className="glass-card rounded-3xl p-8 border border-[rgba(223,180,108,0.3)] shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-gold-gradient flex items-center justify-center text-[#0b0b0e] shadow-xl mx-auto">
          {isPerfect ? <Trophy className="w-8 h-8" /> : <Target className="w-8 h-8" />}
        </div>
        <div className="space-y-1">
          <h2 className="font-serif text-2xl font-bold text-white">Session Complete!</h2>
          <p className="text-xs text-zinc-400">
            {isPerfect
              ? "Flawless! Every puzzle handled with excellence."
              : `You solved ${results.score} of ${results.total} puzzles.`}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Score</p>
            <p className="font-serif text-2xl font-bold text-white">
              {results.score}/{results.total}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Accuracy</p>
            <p
              className={`font-serif text-2xl font-bold ${
                results.accuracy >= 80
                  ? "text-emerald-400"
                  : results.accuracy >= 50
                  ? "text-amber-400"
                  : "text-red-400"
              }`}
            >
              {results.accuracy}%
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Categories</p>
            <p className="font-serif text-2xl font-bold text-white">
              {results.categoriesPracticed.length}
            </p>
          </div>
        </div>

        {results.categoriesPracticed.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {results.categoriesPracticed.map((c) => (
              <span
                key={c}
                className="px-2.5 py-1 rounded-full text-[11px] border border-zinc-700 bg-zinc-900 text-zinc-300"
              >
                {CATEGORY_ICONS[c] ?? "♟"} {c}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onNewSession}
            className="flex-1 px-5 py-3 rounded-xl bg-gold-gradient text-[#0b0b0e] font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start Another Session</span>
          </button>
          <Link
            href="/profile"
            className="flex-1 px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#dfb46c]/40 text-zinc-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowRight className="w-4 h-4 text-[#dfb46c]" />
            <span>Return to Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="glass-card rounded-2xl p-5 border border-zinc-800/80 shadow-xl space-y-2 hover:border-[#dfb46c]/30 transition-colors">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>{label}</span>
        {icon}
      </div>
      <p className="font-serif text-2xl sm:text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
