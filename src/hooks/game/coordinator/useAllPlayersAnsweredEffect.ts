// src/hooks/game/coordinator/useAllPlayersAnsweredEffect.ts
import { useEffect, useRef } from "react";
import { LiveGameState } from "@/src/lib/types";

interface UseAllPlayersAnsweredEffectProps {
  liveGameState: LiveGameState | null;
  handleTimeUp: () => void; // The function to call when all players have answered
}

export function useAllPlayersAnsweredEffect({
  liveGameState,
  handleTimeUp,
}: UseAllPlayersAnsweredEffectProps): void {
  const allAnsweredTriggeredRef = useRef<boolean>(false);

  // Effect to reset the trigger flag when moving to a new question
  useEffect(() => {
    if (
      liveGameState?.status === "QUESTION_SHOW" &&
      allAnsweredTriggeredRef.current
    ) {
      // Check if there are any answer records for the *current* question index.
      // If not, it means we've advanced to a new question where no one has answered yet.
      const hasAnswerRecordForCurrentQuestion = Object.values(
        liveGameState.players
      ).some((p) =>
        p.answers.some(
          (a) => a.questionIndex === liveGameState.currentQuestionIndex
        )
      );

      if (!hasAnswerRecordForCurrentQuestion) {
        // console.log(
        //   `[AllPlayersAnsweredEffect] Resetting allAnsweredTriggeredRef for new question: ${liveGameState.currentQuestionIndex}`
        // );
        allAnsweredTriggeredRef.current = false;
      }
    }
    // This effect should run whenever the question changes or state potentially resets.
  }, [
    liveGameState?.status,
    liveGameState?.currentQuestionIndex,
    liveGameState?.players,
  ]);

  // Main effect to check if all players have answered
  useEffect(() => {
    if (
      !liveGameState ||
      liveGameState.status !== "QUESTION_SHOW" ||
      allAnsweredTriggeredRef.current // Already triggered for this question
    ) {
      return;
    }

    const connectedPlayers = Object.values(liveGameState.players).filter(
      (p) => p.isConnected && p.playerStatus !== "KICKED"
    );
    const connectedPlayerCount = connectedPlayers.length;

    // If there are no connected (and not kicked) players, don't proceed.
    if (connectedPlayerCount === 0) {
      return;
    }

    const answeredCount = connectedPlayers.filter((p) =>
      p.answers.some(
        (a) =>
          a.questionIndex === liveGameState.currentQuestionIndex &&
          a.status !== "TIMEOUT" // Only count actual answers, not timeouts
      )
    ).length;

    if (answeredCount >= connectedPlayerCount) {
      // console.log(
      //   `[AllPlayersAnsweredEffect] All ${connectedPlayerCount} players answered question ${liveGameState.currentQuestionIndex}. Triggering time up.`
      // );
      allAnsweredTriggeredRef.current = true;
      handleTimeUp();
    }
  }, [liveGameState, handleTimeUp]); // liveGameState contains players, status, and currentQuestionIndex
}
