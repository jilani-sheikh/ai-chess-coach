"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import {
  CoachMessage,
  ActiveMoveContext,
  requestGeminiCoachResponse,
  MinimalGameContext,
} from "@/lib/gemini/coach";

export interface AskCoachActionResult {
  success: boolean;
  reply?: string;
  error?: string;
}

export interface AskCoachActionInput {
  gameId: string;
  userPrompt: string;
  messages: CoachMessage[];
  activeMove: ActiveMoveContext | null;
}

export async function askCoachAction({
  gameId,
  userPrompt,
  messages,
  activeMove,
}: AskCoachActionInput): Promise<AskCoachActionResult> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return { success: false, error: "Unauthorized. Please log in to consult your coach." };
  }

  if (!userPrompt || !userPrompt.trim()) {
    return { success: false, error: "Prompt cannot be empty." };
  }

  // Verify game ownership and fetch minimal game context
  const game = await db.game.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      userId: true,
      white: true,
      black: true,
      result: true,
      event: true,
      userColor: true,
    },
  });

  if (!game || game.userId !== userId) {
    return { success: false, error: "Game not found or access denied." };
  }

  const minimalContext: MinimalGameContext = {
    white: game.white,
    black: game.black,
    result: game.result,
    event: game.event,
    userColor: (game.userColor as "WHITE" | "BLACK") || null,
    activeMove: activeMove || null,
  };

  try {
    const reply = await requestGeminiCoachResponse({
      game: minimalContext,
      messages: Array.isArray(messages) ? messages : [],
      userPrompt: userPrompt.trim(),
    });

    return { success: true, reply };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate coaching response.";
    return { success: false, error: message };
  }
}
