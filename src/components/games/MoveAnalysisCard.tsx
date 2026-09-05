"use client";

interface MoveAnalysisCardProps {
  move: {
    moveNumber: number;
    color: string;
    san: string;
    score: number;
    mate: number | null;
    evalType: string;
    bestMove: string;
    bestMoveSan: string | null;
    playedMove: string;
    centipawnLoss: number;
    classification: string;
    accuracy: number;
  } | null;
}

export function MoveAnalysisCard({ move }: MoveAnalysisCardProps) {
  if (!move) {
    return (
      <div className="glass-card rounded-2xl p-4 border border-zinc-800/80 text-xs text-zinc-500 text-center">
        Select a move to inspect engine analysis and best alternatives.
      </div>
    );
  }

  const getBadgeStyle = (classification: string) => {
    switch (classification) {
      case "best":
        return "bg-emerald-950/80 text-emerald-400 border-emerald-800/70";
      case "good":
        return "bg-cyan-950/80 text-cyan-400 border-cyan-800/70";
      case "inaccuracy":
        return "bg-amber-950/80 text-amber-400 border-amber-800/70";
      case "mistake":
        return "bg-orange-950/80 text-orange-400 border-orange-800/70";
      case "blunder":
        return "bg-red-950/80 text-red-400 border-red-800/70";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  const evalLabel =
    move.mate !== null
      ? `${move.mate > 0 ? "+M" : "-M"}${Math.abs(move.mate)}`
      : `${move.score > 0 ? "+" : ""}${move.score.toFixed(2)}`;

  return (
    <div className="glass-card rounded-2xl p-4 border border-[rgba(223,180,108,0.22)] space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-white">
            {move.moveNumber}
            {move.color === "w" ? "." : "..."} {move.san}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-sm ${getBadgeStyle(
              move.classification
            )}`}
          >
            {move.classification}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Eval</span>
          <span className="text-xs font-mono font-bold text-white">{evalLabel}</span>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-800/60 text-xs">
        <div className="bg-zinc-900/60 rounded-xl p-2.5 border border-zinc-800/40">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Best Move</span>
          <span className="font-mono font-bold text-[#dfb46c] mt-0.5 block truncate">
            {move.bestMoveSan || move.bestMove || "—"}
          </span>
        </div>

        <div className="bg-zinc-900/60 rounded-xl p-2.5 border border-zinc-800/40">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">CPL Loss</span>
          <span className="font-mono font-bold text-zinc-200 mt-0.5 block">
            {move.centipawnLoss} cp
          </span>
        </div>

        <div className="bg-zinc-900/60 rounded-xl p-2.5 border border-zinc-800/40">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Accuracy</span>
          <span className="font-mono font-bold text-[#f4d084] mt-0.5 block">
            {move.accuracy.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
