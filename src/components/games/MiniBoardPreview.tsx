"use client";

import { Chess } from "chess.js";
import dynamic from "next/dynamic";
import { parseAndValidatePgn } from "@/lib/chess/pgn";

const DEFAULT_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const Chessboard = dynamic(
  () => import("react-chessboard").then((m) => m.Chessboard),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#181822] flex items-center justify-center text-[10px] text-zinc-600">
        ...
      </div>
    ),
  }
);

interface MiniBoardPreviewProps {
  pgn: string;
  size?: number;
}

export function MiniBoardPreview({ pgn, size = 112 }: MiniBoardPreviewProps) {
  let fen = DEFAULT_FEN;
  if (pgn && pgn.trim()) {
    try {
      const parsed = parseAndValidatePgn(pgn);
      if (parsed.moves.length > 0) {
        fen = parsed.moves[parsed.moves.length - 1].fen;
      } else {
        fen = parsed.startFen;
      }
    } catch {
      try {
        const chess = new Chess();
        chess.loadPgn(pgn);
        fen = chess.fen();
      } catch {
        fen = DEFAULT_FEN;
      }
    }
  }

  return (
    <div
      className="rounded-lg overflow-hidden border border-[rgba(223,180,108,0.25)] shadow-md shrink-0 pointer-events-none select-none"
      style={{ width: size, height: size }}
    >
      <Chessboard
        options={{
          position: fen,
          boardStyle: { borderRadius: "0px", boxShadow: "none", width: `${size}px`, height: `${size}px` },
          allowDragging: false,
          darkSquareStyle: { backgroundColor: "#769656" },
          lightSquareStyle: { backgroundColor: "#eeedd2" },
        }}
      />
    </div>
  );
}
