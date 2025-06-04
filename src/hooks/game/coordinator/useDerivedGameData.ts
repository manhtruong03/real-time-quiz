// src/hooks/game/coordinator/useDerivedGameData.ts
import { useMemo } from "react";
import { LiveGameState, LivePlayerState } from "@/src/lib/types"; // Added LivePlayerState for typing player object

interface UseDerivedGameDataProps {
  liveGameState: LiveGameState | null;
}

interface DerivedGameData {
  currentTotalPlayers: number;
  currentQuestionAnswerCount: number;
}

export function useDerivedGameData({
  liveGameState,
}: UseDerivedGameDataProps): DerivedGameData {
  const currentTotalPlayers = useMemo(() => {
    if (!liveGameState || !liveGameState.players) {
      return 0;
    }
    // MODIFIED LOGIC:
    // Filter player objects instead of just keys to access playerStatus and isConnected.
    // Also, ensure the host is still excluded.
    return Object.values(liveGameState.players).filter(
      (player: LivePlayerState) => {
        // Explicitly type player for clarity
        // Exclude the host if hostUserId is present in liveGameState and matches player's cid
        if (
          liveGameState.hostUserId &&
          player.cid === liveGameState.hostUserId
        ) {
          return false;
        }
        // Include only players who are connected and whose status is not KICKED or LEFT
        return (
          player.isConnected &&
          player.playerStatus !== "KICKED" &&
          player.playerStatus !== "LEFT"
        );
      }
    ).length;
  }, [liveGameState?.players, liveGameState?.hostUserId]); // Dependencies remain appropriate

  const currentQuestionAnswerCount = useMemo(() => {
    if (!liveGameState || !liveGameState.players) {
      return 0;
    }
    // This logic counts players who have an answer for the current question.
    // It implicitly handles disconnected/kicked/left players correctly if their answers are not present
    // or if they are filtered out before this count (which they are by currentTotalPlayers logic).
    // However, to be robust, this count should also ideally only consider active players.
    // Let's refine this to also filter by active status, similar to currentTotalPlayers.
    return Object.values(liveGameState.players).filter(
      (player: LivePlayerState) => {
        // Exclude the host
        if (
          liveGameState.hostUserId &&
          player.cid === liveGameState.hostUserId
        ) {
          return false;
        }
        // Consider only active players
        if (
          !player.isConnected ||
          player.playerStatus === "KICKED" ||
          player.playerStatus === "LEFT"
        ) {
          return false;
        }
        // Check if they have an answer for the current question
        return player.answers.some(
          (a) => a.questionIndex === liveGameState.currentQuestionIndex
        );
      }
    ).length;
  }, [
    liveGameState?.players,
    liveGameState?.currentQuestionIndex,
    liveGameState?.hostUserId, // Added hostUserId as it's used in the filter
  ]);

  return {
    currentTotalPlayers,
    currentQuestionAnswerCount,
  };
}
