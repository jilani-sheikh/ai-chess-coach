import { parseAndValidatePgn } from "../pgn";
import { StockfishSession } from "./stockfish";
import {
  calculateCentipawnLoss,
  classifyMove,
  calculateMoveAccuracy,
  calculateAverageAccuracy,
  calculateAcpl,
} from "./classifier";
import {
  AnalyzedMove,
  EngineEvaluationResult,
  EngineOptions,
  GameAnalysisSummary,
} from "./types";

export async function analyzeGamePgn(
  pgn: string,
  options?: EngineOptions,
  onProgress?: (current: number, total: number) => void
): Promise<GameAnalysisSummary> {
  const parsed = parseAndValidatePgn(pgn);
  const { moves, startFen } = parsed;

  const depth = options?.depth || 10;
  const session = new StockfishSession();

  try {
    await session.init();

    // Reconstruct list of all positions to evaluate:
    // Index 0: startFen
    // Index i + 1: moves[i].fen
    const positionsToEval = [startFen, ...moves.map((m) => m.fen)];
    const evaluations: EngineEvaluationResult[] = [];

    const total = positionsToEval.length;
    for (let i = 0; i < total; i++) {
      const fen = positionsToEval[i];
      const evalResult = await session.evaluatePosition(fen, { depth, timeoutMs: options?.timeoutMs });
      evaluations.push(evalResult);
      if (onProgress) {
        onProgress(i + 1, total);
      }
    }

    // Now compute move-by-move quality
    const analyzedMoves: AnalyzedMove[] = [];
    const whiteCpls: number[] = [];
    const blackCpls: number[] = [];
    const whiteAccs: number[] = [];
    const blackAccs: number[] = [];

    let whiteInaccuracies = 0;
    let whiteMistakes = 0;
    let whiteBlunders = 0;
    let blackInaccuracies = 0;
    let blackMistakes = 0;
    let blackBlunders = 0;

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      const evalBefore = evaluations[i];
      const evalAfter = evaluations[i + 1];

      // Check if played move matches best move
      const playedUci = `${move.from}${move.to}`;
      const isBestMove =
        (evalBefore.bestMove && evalBefore.bestMove.startsWith(playedUci)) ||
        (evalBefore.bestMoveSan && evalBefore.bestMoveSan === move.san);

      const cpl = calculateCentipawnLoss(
        evalBefore.score,
        evalBefore.mate,
        evalAfter.score,
        evalAfter.mate,
        move.color,
        !!isBestMove
      );

      const classification = classifyMove(cpl, !!isBestMove);
      const accuracy = calculateMoveAccuracy(cpl);

      if (move.color === "w") {
        whiteCpls.push(cpl);
        whiteAccs.push(accuracy);
        if (classification === "inaccuracy") whiteInaccuracies++;
        else if (classification === "mistake") whiteMistakes++;
        else if (classification === "blunder") whiteBlunders++;
      } else {
        blackCpls.push(cpl);
        blackAccs.push(accuracy);
        if (classification === "inaccuracy") blackInaccuracies++;
        else if (classification === "mistake") blackMistakes++;
        else if (classification === "blunder") blackBlunders++;
      }

      analyzedMoves.push({
        moveIndex: i,
        moveNumber: move.moveNumber,
        color: move.color,
        san: move.san,
        fen: move.fen,
        score: evalAfter.score,
        mate: evalAfter.mate,
        evalType: evalAfter.evalType,
        bestMove: evalBefore.bestMove,
        bestMoveSan: evalBefore.bestMoveSan || null,
        playedMove: move.san,
        centipawnLoss: cpl,
        classification,
        accuracy,
      });
    }

    const whiteAccuracy = calculateAverageAccuracy(whiteAccs);
    const blackAccuracy = calculateAverageAccuracy(blackAccs);
    const allAccs = [...whiteAccs, ...blackAccs];
    const overallAccuracy = calculateAverageAccuracy(allAccs);

    const whiteAcpl = calculateAcpl(whiteCpls);
    const blackAcpl = calculateAcpl(blackCpls);
    const allCpls = [...whiteCpls, ...blackCpls];
    const overallAcpl = calculateAcpl(allCpls);

    return {
      engine: "Stockfish 18",
      depth,
      accuracy: overallAccuracy,
      whiteAccuracy,
      blackAccuracy,
      acpl: overallAcpl,
      whiteAcpl,
      blackAcpl,
      inaccuracies: whiteInaccuracies + blackInaccuracies,
      mistakes: whiteMistakes + blackMistakes,
      blunders: whiteBlunders + blackBlunders,
      whiteInaccuracies,
      whiteMistakes,
      whiteBlunders,
      blackInaccuracies,
      blackMistakes,
      blackBlunders,
      moves: analyzedMoves,
    };
  } finally {
    session.destroy();
  }
}
