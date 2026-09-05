"use client";

import { useMemo, useState, useRef } from "react";

interface MoveData {
  moveIndex: number;
  moveNumber: number;
  color: string;
  san: string;
  score: number; // White perspective
  mate: number | null;
  evalType: string;
  classification: string;
}

interface EvaluationGraphProps {
  moves: MoveData[];
  currentMoveIndex: number;
  onSelectMove: (index: number) => void;
}

export function EvaluationGraph({
  moves,
  currentMoveIndex,
  onSelectMove,
}: EvaluationGraphProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Graph dimensions
  const height = 120;
  const paddingY = 16;
  const usableHeight = height - paddingY * 2;
  const zeroY = height / 2;

  // Clamp scores to [-8, +8] for visualization scale
  const clampScore = (score: number, mate: number | null): number => {
    if (mate !== null) {
      return mate > 0 ? 8 : -8;
    }
    return Math.max(-8, Math.min(8, score));
  };

  const points = useMemo(() => {
    if (!moves || moves.length === 0) return [];
    const total = moves.length;
    const width = 100; // in percentage

    return moves.map((m, i) => {
      const clamped = clampScore(m.score, m.mate);
      // y: -8 => zeroY + usableHeight/2 (bottom); +8 => zeroY - usableHeight/2 (top)
      const y = zeroY - (clamped / 8) * (usableHeight / 2);
      const x = total > 1 ? (i / (total - 1)) * width : 50;
      return { x, y, move: m, index: i };
    });
  }, [moves, usableHeight, zeroY]);

  // Build SVG path
  const pathD = useMemo(() => {
    if (points.length === 0) return "";
    return points.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
    }, "");
  }, [points]);

  // Area paths for White (+, top) and Black (-, bottom) fills
  const areaD = useMemo(() => {
    if (points.length === 0) return "";
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    return `${pathD} L ${lastX},${zeroY} L ${firstX},${zeroY} Z`;
  }, [pathD, points, zeroY]);

  if (!moves || moves.length === 0) {
    return null;
  }

  const activePoint = points.find((p) => p.index === currentMoveIndex) || null;
  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="glass-card rounded-2xl p-4 border border-[rgba(223,180,108,0.2)] space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-serif font-bold text-white tracking-wide">Evaluation Graph</span>
          <span className="text-[10px] text-zinc-500 font-mono">(White perspective)</span>
        </div>
        {hoveredPoint ? (
          <div className="text-[11px] font-mono text-zinc-300">
            <span className="text-[#dfb46c] font-bold">
              {hoveredPoint.move.moveNumber}
              {hoveredPoint.move.color === "w" ? "." : "..."} {hoveredPoint.move.san}
            </span>{" "}
            | Eval:{" "}
            <span className="text-white font-bold">
              {hoveredPoint.move.mate !== null
                ? `${hoveredPoint.move.mate > 0 ? "+M" : "-M"}${Math.abs(hoveredPoint.move.mate)}`
                : `${hoveredPoint.move.score > 0 ? "+" : ""}${hoveredPoint.move.score.toFixed(1)}`}
            </span>
          </div>
        ) : activePoint ? (
          <div className="text-[11px] font-mono text-zinc-400">
            Move {activePoint.move.moveNumber}
            {activePoint.move.color === "w" ? "." : "..."} {activePoint.move.san} (
            {activePoint.move.score > 0 ? `+${activePoint.move.score.toFixed(1)}` : activePoint.move.score.toFixed(1)})
          </div>
        ) : null}
      </div>

      <div
        ref={containerRef}
        className="relative w-full h-[120px] bg-zinc-950/70 rounded-xl overflow-hidden border border-zinc-800/80 cursor-pointer select-none"
        onClick={(e) => {
          if (!containerRef.current || points.length === 0) return;
          const rect = containerRef.current.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = Math.max(0, Math.min(1, clickX / rect.width));
          const targetIndex = Math.round(ratio * (moves.length - 1));
          onSelectMove(targetIndex);
        }}
      >
        <svg
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="evalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#dfb46c" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#dfb46c" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* Zero baseline (0.0) */}
          <line
            x1="0"
            y1={zeroY}
            x2="100"
            y2={zeroY}
            stroke="#3f3f46"
            strokeWidth="0.75"
            strokeDasharray="2,2"
          />

          {/* Fill Area */}
          <path d={areaD} fill="url(#evalGrad)" />

          {/* Trend Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#f4d084"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current Move Vertical Line & Dot */}
          {activePoint && (
            <>
              <line
                x1={activePoint.x}
                y1={0}
                x2={activePoint.x}
                y2={height}
                stroke="#dfb46c"
                strokeWidth="1"
                opacity="0.8"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="3"
                fill="#dfb46c"
                stroke="#0b0b0e"
                strokeWidth="1"
              />
            </>
          )}

          {/* Hovered Dot */}
          {hoveredPoint && hoveredPoint.index !== currentMoveIndex && (
            <circle
              cx={hoveredPoint.x}
              cy={hoveredPoint.y}
              r="2.5"
              fill="#ffffff"
              opacity="0.9"
            />
          )}
        </svg>

        {/* Hover detection overlay slices */}
        <div
          className="absolute inset-0 flex"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {points.map((p) => (
            <div
              key={p.index}
              className="flex-1 h-full"
              onMouseEnter={() => setHoveredIndex(p.index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
