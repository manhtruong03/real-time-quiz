// src/hooks/useHostGameCoordinator.ts
import { useEffect, useRef } from "react";
import { QuizStructureHost, LiveGameState } from "@/src/lib/types";
import { useGameStateManagement } from "./game/useGameStateManagement";
import { usePlayerManagement } from "./game/usePlayerManagement";
import { useAnswerProcessing } from "./game/useAnswerProcessing"; // Import the hook
import { useWebSocketMessaging } from "./game/useWebSocketMessaging";
import { useCurrentBlockManager } from "./game/coordinator/useCurrentBlockManager";
import { useDerivedGameData } from "./game/coordinator/useDerivedGameData";
import { useHostPlayerActions } from "./game/coordinator/useHostPlayerActions";
import { useAllPlayersAnsweredEffect } from "./game/coordinator/useAllPlayersAnsweredEffect";
import { useGameFlowController } from "./game/coordinator/useGameFlowController";

interface HostGameCoordinatorProps {
  initialQuizData: QuizStructureHost | null;
  onPlayerJoined?: (cid: string) => void;
}

export function useHostGameCoordinator({
  initialQuizData,
  onPlayerJoined,
}: HostGameCoordinatorProps) {
  // --- Base State Management ---
  const {
    liveGameState,
    setLiveGameState,
    timerKey,
    initializeSession,
    advanceToQuestion,
    transitionToStatsView,
    transitionToShowingScoreboard,
    showPodium,
    endGame,
    resetGameState,
  } = useGameStateManagement(initialQuizData);

  // --- Player Management ---
  const { addOrUpdatePlayer, updatePlayerAvatar } =
    usePlayerManagement(setLiveGameState);

  // --- Answer Processing ---
  const { processPlayerAnswer, calculateAnswerStats } = useAnswerProcessing(
    initialQuizData,
    setLiveGameState
  );

  // --- Refs for state and callbacks ---
  const liveGameStateRef = useRef<LiveGameState | null>(liveGameState);
  useEffect(() => {
    liveGameStateRef.current = liveGameState;
  }, [liveGameState]);

  const callbacksRef = useRef({
    addOrUpdatePlayer,
    updatePlayerAvatar,
    processPlayerAnswer,
    notifyPlayerJoined: (cid: string) => {
      if (onPlayerJoined) onPlayerJoined(cid);
    },
  });
  useEffect(() => {
    callbacksRef.current = {
      addOrUpdatePlayer,
      updatePlayerAvatar,
      processPlayerAnswer,
      notifyPlayerJoined: (cid: string) => {
        if (onPlayerJoined) onPlayerJoined(cid);
      },
    };
  }, [
    addOrUpdatePlayer,
    updatePlayerAvatar,
    processPlayerAnswer,
    onPlayerJoined,
  ]);

  const currentBlock = useCurrentBlockManager({
    liveGameState,
    initialQuizData,
  });
  const { currentTotalPlayers, currentQuestionAnswerCount } =
    useDerivedGameData({ liveGameState });
  const { kickPlayerCid } = useHostPlayerActions({ setLiveGameState });

  const {
    prepareQuestionMessage,
    prepareResultMessage,
    handleIncomingMessage,
  } = useWebSocketMessaging(
    liveGameStateRef,
    initialQuizData,
    callbacksRef.current
  );

  // --- Use the new Game Flow Controller ---
  const { handleNext, handleSkip, handleTimeUp } = useGameFlowController({
    //
    initialQuizData,
    liveGameStateRef,
    setLiveGameState,
    advanceToQuestion,
    transitionToStatsView,
    transitionToShowingScoreboard,
    showPodium,
    endGame,
    calculateAnswerStats,
  });

  // --- "All Players Answered" Effect ---
  // This now receives handleTimeUp from useGameFlowController
  useAllPlayersAnsweredEffect({ liveGameState, handleTimeUp });

  return {
    liveGameState,
    currentBlock,
    timerKey,
    currentQuestionAnswerCount,
    currentTotalPlayers,
    quizData: initialQuizData,
    handleNext, // from useGameFlowController
    handleSkip, // from useGameFlowController
    handleTimeUp, // from useGameFlowController
    handleWebSocketMessage: handleIncomingMessage,
    initializeSession,
    prepareQuestionMessage: () => prepareQuestionMessage(currentBlock),
    prepareResultMessage,
    resetGameState,
    kickPlayerCid,
  };
}
