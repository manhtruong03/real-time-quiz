// src/hooks/game/coordinator/useDerivedGameData.ts
import { useMemo } from "react";
import { LiveGameState } from "@/src/lib/types";

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
    return Object.keys(liveGameState.players).filter(
      (id) => id !== liveGameState.hostUserId
    ).length;
  }, [liveGameState?.players, liveGameState?.hostUserId]);

  const currentQuestionAnswerCount = useMemo(() => {
    if (!liveGameState || !liveGameState.players) {
      return 0;
    }
    return Object.values(liveGameState.players).filter((p) =>
      p.answers.some(
        (a) => a.questionIndex === liveGameState.currentQuestionIndex
      )
    ).length;
  }, [liveGameState?.players, liveGameState?.currentQuestionIndex]);

  return {
    currentTotalPlayers,
    currentQuestionAnswerCount,
  };
}
