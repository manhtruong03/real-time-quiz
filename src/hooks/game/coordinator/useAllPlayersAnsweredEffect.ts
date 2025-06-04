// src/hooks/game/coordinator/useAllPlayersAnsweredEffect.ts
import { useEffect } from "react";
import { LiveGameState, LivePlayerState } from "@/src/lib/types"; // Added LivePlayerState for typing

interface UseAllPlayersAnsweredEffectProps {
  liveGameState: LiveGameState | null;
  handleTimeUp?: () => void;
}

export function useAllPlayersAnsweredEffect({
  liveGameState,
  handleTimeUp,
}: UseAllPlayersAnsweredEffectProps) {
  useEffect(() => {
    if (!liveGameState || !liveGameState.players || !handleTimeUp) return;

    const { status, players, currentQuestionIndex } = liveGameState;

    if (status !== "QUESTION_SHOW") {
      return;
    }

    // Count how many players are considered active and participating
    const participatingPlayerCount = Object.values(players).filter(
      (
        p: LivePlayerState // Explicitly type player for clarity
      ) =>
        p.isConnected &&
        p.playerStatus !== "KICKED" &&
        p.playerStatus !== "LEFT" // <<< MODIFIED: Exclude "LEFT" players
    ).length;

    // Count how many of those participating players have answered the current question
    const answeredCount = Object.values(players).filter(
      (
        p: LivePlayerState // Explicitly type player for clarity
      ) =>
        p.isConnected &&
        p.playerStatus !== "KICKED" &&
        p.playerStatus !== "LEFT" && // <<< MODIFIED: Exclude "LEFT" players here too for consistency
        p.answers.some((ans) => ans.questionIndex === currentQuestionIndex)
    ).length;

    if (
      participatingPlayerCount > 0 &&
      answeredCount >= participatingPlayerCount
    ) {
      console.log(
        `[AllPlayersAnsweredEffect] All ${answeredCount}/${participatingPlayerCount} participating players have answered. Triggering time up.`
      );
      handleTimeUp();
    }
  }, [liveGameState, handleTimeUp]);
}
