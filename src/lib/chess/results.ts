/**
 * Pure utility to map standard PGN result strings ("1-0", "0-1", "1/2-1/2")
 * to user-perspective result ("WIN", "LOSS", "DRAW") depending on userColor.
 *
 * WHITE: 1-0 = WIN,  0-1 = LOSS, 1/2-1/2 = DRAW
 * BLACK: 1-0 = LOSS, 0-1 = WIN,  1/2-1/2 = DRAW
 */

export type UserFacingResult = "WIN" | "LOSS" | "DRAW";

export function getUserFacingResult(
  result: string,
  userColor?: string | null
): UserFacingResult {
  const normResult = result.trim();
  if (
    normResult === "1/2-1/2" ||
    normResult === "1/2-1/2" ||
    normResult === "0.5-0.5" ||
    normResult.toUpperCase() === "DRAW"
  ) {
    return "DRAW";
  }

  const isBlack =
    userColor?.toUpperCase() === "BLACK" || userColor?.toLowerCase() === "b";

  if (isBlack) {
    if (normResult === "0-1") return "WIN";
    if (normResult === "1-0") return "LOSS";
  } else {
    if (normResult === "1-0") return "WIN";
    if (normResult === "0-1") return "LOSS";
  }

  return "DRAW";
}
