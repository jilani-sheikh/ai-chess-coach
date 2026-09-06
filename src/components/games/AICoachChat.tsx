"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import {
  Sparkles,
  Send,
  RotateCcw,
  AlertCircle,
  Bot,
  User,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { askCoachAction } from "@/lib/actions/coach";
import { ActiveMoveContext, CoachMessage } from "@/lib/gemini/coach";
import { MoveAnalysisRecord } from "@/components/games/GameDetailsClient";

interface AICoachChatProps {
  gameId: string;
  white: string;
  black: string;
  result: string;
  event?: string | null;
  userColor?: string | null;
  currentMoveIndex: number;
  currentFen: string;
  currentMoveAnalysis: MoveAnalysisRecord | null;
  className?: string;
}

export function AICoachChat({
  gameId,
  white,
  black,
  result,
  userColor,
  currentMoveIndex,
  currentFen,
  currentMoveAnalysis,
  className = "",
}: AICoachChatProps) {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize user side
  const playerSide = userColor === "BLACK" ? "Black" : "White";
  const opponentSide = playerSide === "White" ? "Black" : "White";
  const playerName = playerSide === "White" ? white : black;

  // Derive active move context
  const activeMoveContext: ActiveMoveContext | null =
    currentMoveIndex >= 0 && currentMoveAnalysis
      ? {
          moveIndex: currentMoveAnalysis.moveIndex,
          moveNumber: currentMoveAnalysis.moveNumber,
          color: currentMoveAnalysis.color,
          san: currentMoveAnalysis.san,
          fen: currentFen,
          score: currentMoveAnalysis.score,
          mate: currentMoveAnalysis.mate,
          evalType: currentMoveAnalysis.evalType,
          centipawnLoss: currentMoveAnalysis.centipawnLoss,
          classification: currentMoveAnalysis.classification,
          bestMove: currentMoveAnalysis.bestMove,
          bestMoveSan: currentMoveAnalysis.bestMoveSan,
          playedMove: currentMoveAnalysis.playedMove,
        }
      : currentMoveIndex >= 0
      ? {
          moveIndex: currentMoveIndex,
          fen: currentFen,
        }
      : null;

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPending]);

  // Context label for UI
  const getContextLabel = () => {
    if (currentMoveIndex < 0 || !activeMoveContext) {
      return "Initial Board (Move 0)";
    }
    const num = activeMoveContext.moveNumber
      ? `${activeMoveContext.moveNumber}. `
      : "";
    const san = activeMoveContext.san || "Move";
    const tag = activeMoveContext.classification
      ? ` (${activeMoveContext.classification.toUpperCase()})`
      : "";
    return `${num}${san}${tag}`;
  };

  const getClassificationBadge = () => {
    if (!activeMoveContext?.classification) return null;
    const cls = activeMoveContext.classification.toLowerCase();
    switch (cls) {
      case "blunder":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950/80 text-red-400 border border-red-800/80 uppercase animate-pulse">
            Blunder
          </span>
        );
      case "mistake":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-950/80 text-orange-400 border border-orange-800/80 uppercase">
            Mistake
          </span>
        );
      case "inaccuracy":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800/80 uppercase">
            Inaccuracy
          </span>
        );
      case "best":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 uppercase">
            Best Move
          </span>
        );
      case "good":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-800/80 uppercase">
            Good
          </span>
        );
      default:
        return null;
    }
  };

  // Quick prompt suggestions based on current move quality
  const getQuickQuestions = () => {
    if (currentMoveIndex < 0 || !activeMoveContext) {
      return [
        "Give me a quick overview of this game",
        "Where did things go wrong?",
        "What was the key turning point?",
      ];
    }

    const cls = activeMoveContext.classification?.toLowerCase();
    if (cls === "blunder" || cls === "mistake") {
      return [
        "Why was this move a blunder?",
        "What should I have played?",
        "Why is the engine's move better?",
      ];
    }
    if (cls === "inaccuracy") {
      return [
        "Why is this an inaccuracy?",
        "What should I have played?",
        "What positional idea did I miss?",
      ];
    }
    if (cls === "best" || cls === "good") {
      return [
        "Why is this the best move?",
        "What plan should I follow next?",
        "How does this help my position?",
      ];
    }

    return [
      "What is the evaluation here?",
      "What should I play in this position?",
      "Explain the key ideas in this position.",
    ];
  };

  // Submit prompt to server action
  const handleSend = (textToSend?: string) => {
    const prompt = (textToSend || inputValue).trim();
    if (!prompt || isPending) return;

    setErrorMessage(null);
    const userMsg: CoachMessage = { role: "user", text: prompt };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue("");

    startTransition(async () => {
      const res = await askCoachAction({
        gameId,
        userPrompt: prompt,
        messages: updatedMessages,
        activeMove: activeMoveContext,
      });

      if (res.success && res.reply) {
        setMessages((prev) => [...prev, { role: "model", text: res.reply! }]);
      } else {
        setErrorMessage(res.error || "Unable to reach your AI coach. Please try again.");
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setErrorMessage(null);
  };

  return (
    <div
      className={`glass-card rounded-3xl border border-[rgba(223,180,108,0.25)] flex flex-col shadow-2xl overflow-hidden ${className}`}
      style={{ minHeight: "480px" }}
    >
      {/* Top Header */}
      <div className="px-5 py-4 border-b border-zinc-800/80 bg-zinc-950/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gold-gradient flex items-center justify-center text-[#0b0b0e] shadow-md shadow-[#dfb46c]/10 shrink-0">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-white flex items-center gap-2 leading-none">
              AI Coach
              <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                Gemini
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400 mt-1">
              Playing as <span className="text-[#dfb46c] font-semibold">{playerSide}</span> ({playerName})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleResetChat}
              title="Reset Conversation"
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-[#dfb46c] hover:border-[#dfb46c]/40 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Active Move Context Strip */}
      <div className="px-5 py-2.5 bg-zinc-900/50 border-b border-zinc-800/60 flex items-center justify-between text-xs gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-zinc-300">
          <span className="text-[11px] text-zinc-500 font-medium">Position Context:</span>
          <span className="font-mono font-bold text-[#dfb46c] bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800">
            {getContextLabel()}
          </span>
          {getClassificationBadge()}
        </div>

        {activeMoveContext?.bestMoveSan && (
          <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
            <span className="text-zinc-500">Engine:</span>
            <span className="text-emerald-400 font-semibold">{activeMoveContext.bestMoveSan}</span>
          </div>
        )}
      </div>

      {/* Conversation Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 max-h-[380px] scrollbar-thin scrollbar-thumb-zinc-800"
      >
        {/* Default Welcome Message */}
        {messages.length === 0 && (
          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/70 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <Bot className="w-4 h-4 text-[#dfb46c]" />
              <span>Grandmaster Coach Ready</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Welcome, <span className="text-[#dfb46c] font-semibold">{playerName}</span>! I&apos;m here to review your match as{" "}
              <span className="font-semibold text-white">{playerSide}</span> against{" "}
              <span className="font-semibold text-white">{opponentSide}</span> ({result}).
            </p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Step through the board or click any move on the evaluation graph. Ask me why a move was played, how to avoid blunders, or what the engine recommended!
            </p>
          </div>
        )}

        {/* Message Stream */}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "model" && (
              <div className="w-6 h-6 rounded-lg bg-gold-gradient flex items-center justify-center text-[#0b0b0e] shrink-0 mt-0.5 shadow-sm">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-zinc-900 text-zinc-100 border border-[#dfb46c]/30 shadow-md"
                  : "bg-zinc-900/70 text-zinc-200 border border-zinc-800/90 shadow-sm whitespace-pre-wrap"
              }`}
            >
              {msg.text}
            </div>

            {msg.role === "user" && (
              <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {/* Typing / Pending Indicator */}
        {isPending && (
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-gold-gradient flex items-center justify-center text-[#0b0b0e] shrink-0 shadow-sm animate-pulse">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-zinc-400 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#dfb46c] animate-bounce" />
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-[#dfb46c] animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-[#dfb46c] animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
              <span className="ml-1.5 text-[11px] text-zinc-400">Coach is analyzing position...</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => handleSend()}
              className="text-[11px] font-bold text-red-400 hover:text-red-300 underline shrink-0"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Suggested Question Chips */}
      <div className="px-4 py-2.5 bg-zinc-950/40 border-t border-zinc-800/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
          <HelpCircle className="w-3 h-3 text-[#dfb46c]" /> Ask:
        </span>
        {getQuickQuestions().map((q, i) => (
          <button
            key={i}
            disabled={isPending}
            onClick={() => handleSend(q)}
            className="text-[11px] text-zinc-300 bg-zinc-900/90 hover:bg-zinc-800 hover:text-white border border-zinc-800 hover:border-[#dfb46c]/40 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <span>{q}</span>
            <ChevronRight className="w-2.5 h-2.5 text-zinc-500" />
          </button>
        ))}
      </div>

      {/* Input Form Bar */}
      <div className="p-3 sm:p-4 bg-zinc-950/60 border-t border-zinc-800/80 flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          placeholder={
            activeMoveContext?.san
              ? `Ask coach about ${activeMoveContext.san}...`
              : "Ask your coach about this move..."
          }
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#dfb46c] transition-colors disabled:opacity-50"
        />

        <button
          onClick={() => handleSend()}
          disabled={!inputValue.trim() || isPending}
          title="Send to Coach"
          className="px-3.5 py-2 rounded-xl bg-gold-gradient hover:opacity-90 disabled:opacity-40 text-[#0b0b0e] font-bold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
        >
          <Send className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Ask</span>
        </button>
      </div>
    </div>
  );
}
