"use client";

interface EvaluationBarProps {
  score: number; // White perspective in pawns (+ = White advantage, - = Black advantage)
  mate: number | null; // Mate in N moves (+ = White mates, - = Black mates)
  evalType?: "cp" | "mate";
}

export function EvaluationBar({ score, mate, evalType }: EvaluationBarProps) {
  // Compute White percentage (0 to 100%) using standard logistic evaluation curve
  let whitePercentage = 50;

  if (evalType === "mate" || mate !== null) {
    if (mate !== null) {
      whitePercentage = mate > 0 ? 100 : 0;
    } else {
      whitePercentage = score > 0 ? 100 : 0;
    }
  } else {
    // Standard logistic curve: p = 1 / (1 + 10^(-score / 4))
    const winProbability = 1 / (1 + Math.pow(10, -score / 4));
    whitePercentage = Math.max(5, Math.min(95, winProbability * 100));
  }

  // Format evaluation text
  let label = "0.0";
  if (evalType === "mate" || mate !== null) {
    const m = mate !== null ? mate : (score > 0 ? 1 : -1);
    label = m > 0 ? `+M${m}` : `-M${Math.abs(m)}`;
  } else {
    label = score > 0 ? `+${score.toFixed(1)}` : score < 0 ? score.toFixed(1) : "0.0";
  }

  const isWhiteWinning = (mate !== null ? mate > 0 : score >= 0);

  return (
    <div className="flex flex-col items-center select-none group relative h-full min-h-[220px] sm:min-h-[400px]">
      <div className="w-8 sm:w-9 h-full rounded-xl overflow-hidden bg-[#181822] border border-zinc-800/90 shadow-xl flex flex-col justify-end relative">
        {/* Black side (top portion) */}
        <div className="absolute top-2 left-0 right-0 text-center z-10">
          {!isWhiteWinning && (
            <span className="text-[10px] font-mono font-bold text-zinc-300 bg-zinc-950/80 px-1 py-0.5 rounded shadow">
              {label}
            </span>
          )}
        </div>

        {/* White side bar (fills from bottom up) */}
        <div
          className="w-full bg-gradient-to-t from-[#f4d084] to-[#dfb46c] transition-all duration-300 ease-out flex items-start justify-center pt-2 relative"
          style={{ height: `${whitePercentage}%` }}
        >
          {isWhiteWinning && (
            <span className="text-[10px] font-mono font-bold text-[#0b0b0e] bg-white/70 px-1 py-0.5 rounded shadow">
              {label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
