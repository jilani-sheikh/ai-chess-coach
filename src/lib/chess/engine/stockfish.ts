import { spawn, ChildProcess } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { Chess } from "chess.js";
import { EngineEvaluationResult, EngineOptions } from "./types";

function getEnginePath(): string {
  const candidates = [
    path.join(process.cwd(), "node_modules", "stockfish", "bin", "stockfish-18-asm.js"),
    path.join(process.cwd(), "node_modules", "stockfish", "src", "stockfish-18-asm.js"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(/*turbopackIgnore: true*/ candidate)) return candidate;
  }
  throw new Error("Stockfish 18 executable not found in node_modules/stockfish/bin");
}

export function uciToSan(fen: string, uciMove: string): string | null {
  if (!uciMove || uciMove === "(none)") return null;
  try {
    const chess = new Chess(fen);
    const from = uciMove.slice(0, 2);
    const to = uciMove.slice(2, 4);
    const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
    const move = chess.move({ from, to, promotion });
    return move ? move.san : null;
  } catch {
    return null;
  }
}

/**
 * Parses UCI info string for score cp or score mate
 */
export function parseEvalLine(
  evalLine: string | null,
  fen: string
): { evalType: "cp" | "mate"; score: number; mate: number | null; rawCp: number } {
  const sideToMove = fen.split(" ")[1] || "w";
  const isWhite = sideToMove === "w";

  if (!evalLine) {
    return { evalType: "cp", score: 0, mate: null, rawCp: 0 };
  }

  // Check for mate
  const mateMatch = evalLine.match(/score mate (-?\d+)/);
  if (mateMatch) {
    const mateDistance = parseInt(mateMatch[1], 10);
    // In UCI: mate > 0 means side-to-move mates in N; mate < 0 means side-to-move is mated in N; mate = 0 means side-to-move is checkmated
    let whiteMate: number;
    let isWhiteWinning: boolean;
    if (mateDistance === 0) {
      isWhiteWinning = !isWhite;
      whiteMate = isWhiteWinning ? 1 : -1;
    } else {
      isWhiteWinning = isWhite ? mateDistance > 0 : mateDistance < 0;
      whiteMate = isWhite ? mateDistance : -mateDistance;
    }

    // Score in pawns representation for graphing / clamping (finite, no Infinity/NaN)
    const scoreInPawns = isWhiteWinning
      ? Math.max(10, 100 - Math.abs(whiteMate))
      : Math.min(-10, -100 + Math.abs(whiteMate));
    const rawCp = isWhiteWinning ? 10000 : -10000;
    return {
      evalType: "mate",
      score: Number(scoreInPawns.toFixed(2)),
      mate: whiteMate,
      rawCp,
    };
  }

  // Check for cp
  const cpMatch = evalLine.match(/score cp (-?\d+)/);
  if (cpMatch) {
    const rawCp = parseInt(cpMatch[1], 10);
    // In UCI: positive score is good for side to move. Normalize to White perspective:
    const whiteCp = isWhite ? rawCp : -rawCp;
    const scoreInPawns = whiteCp / 100;
    return {
      evalType: "cp",
      score: Number(scoreInPawns.toFixed(2)),
      mate: null,
      rawCp,
    };
  }

  return { evalType: "cp", score: 0, mate: null, rawCp: 0 };
}

export class StockfishSession {
  private process: ChildProcess | null = null;
  private isReady = false;

  async init(): Promise<void> {
    if (this.process && this.isReady) return;

    const enginePath = getEnginePath();
    this.process = spawn(process.execPath, [enginePath]);

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.destroy();
        reject(new Error("Stockfish initialization timed out."));
      }, 10000);

      const onData = (data: Buffer) => {
        const text = data.toString();
        if (text.includes("readyok")) {
          clearTimeout(timeout);
          this.process?.stdout?.off("data", onData);
          this.isReady = true;
          resolve();
        }
      };

      this.process!.stdout!.on("data", onData);
      this.process!.stdin!.write("uci\nisready\n");
    });
  }

  async evaluatePosition(fen: string, options?: EngineOptions): Promise<EngineEvaluationResult> {
    await this.init();

    const depth = options?.depth || 10;
    const timeoutMs = options?.timeoutMs || 8000;

    return new Promise<EngineEvaluationResult>((resolve, reject) => {
      let evalLine: string | null = null;
      let bestMove = "(none)";
      let pv: string | undefined;

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Stockfish evaluation timed out on FEN: ${fen}`));
      }, timeoutMs);

      const onData = (data: Buffer) => {
        const lines = data.toString().split("\n");
        for (const raw of lines) {
          const line = raw.trim();
          if (!line) continue;

          if (line.startsWith("info") && line.includes("score")) {
            evalLine = line;
            const pvMatch = line.match(/\s+pv\s+(.+)$/);
            if (pvMatch) {
              pv = pvMatch[1];
            }
          }

          if (line.startsWith("bestmove")) {
            const parts = line.split(" ");
            bestMove = parts[1] || "(none)";
            cleanup();

            const parsed = parseEvalLine(evalLine, fen);
            const bestMoveSan = uciToSan(fen, bestMove);

            resolve({
              fen,
              depth,
              bestMove,
              bestMoveSan,
              evalType: parsed.evalType,
              score: parsed.score,
              mate: parsed.mate,
              pv,
            });
            return;
          }
        }
      };

      const cleanup = () => {
        clearTimeout(timer);
        this.process?.stdout?.off("data", onData);
      };

      this.process!.stdout!.on("data", onData);
      this.process!.stdin!.write(`position fen ${fen}\ngo depth ${depth}\n`);
    });
  }

  destroy(): void {
    if (this.process) {
      try {
        this.process.stdin?.write("quit\n");
      } catch {
        // Ignore write errors if process already exited
      }
      try {
        this.process.kill();
      } catch {
        // Ignore kill errors
      }
      this.process = null;
      this.isReady = false;
    }
  }
}
