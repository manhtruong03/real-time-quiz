// src/hooks/useHostGameCoordinator.ts
import { useEffect, useRef, useCallback } from "react";
import {
  QuizStructureHost,
  LiveGameState,
  ParticipantLeftPayload,
} from "@/src/lib/types";
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
  const {
    addOrUpdatePlayer,
    updatePlayerAvatar,
    markPlayerAsLeft,
    kickPlayer,
  } = usePlayerManagement(setLiveGameState);

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

  const handleParticipantLeftEvent = useCallback(
    (payload: ParticipantLeftPayload) => {
      console.log(
        `[HostCoordinator] Received PARTICIPANT_LEFT: Player ${payload.affectedId} left. Server reports new count: ${payload.playerCount}. Host ID: ${payload.hostId}`
      );
      // Call the function from usePlayerManagement to update the player's state
      markPlayerAsLeft(payload.affectedId, Date.now());
    },
    [markPlayerAsLeft]
  );

  const callbacksRef = useRef({
    addOrUpdatePlayer,
    updatePlayerAvatar,
    processPlayerAnswer,
    notifyPlayerJoined: (cid: string) => {
      if (onPlayerJoined) onPlayerJoined(cid);
    },
    handleParticipantLeft: handleParticipantLeftEvent,
  });

  useEffect(() => {
    callbacksRef.current = {
      addOrUpdatePlayer,
      updatePlayerAvatar,
      processPlayerAnswer,
      notifyPlayerJoined: (cid: string) => {
        if (onPlayerJoined) onPlayerJoined(cid);
      },
      handleParticipantLeft: handleParticipantLeftEvent,
    };
  }, [
    addOrUpdatePlayer,
    updatePlayerAvatar,
    processPlayerAnswer,
    onPlayerJoined,
    handleParticipantLeftEvent,
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

  const executeKickPlayer = useCallback(
    (playerId: string) => {
      console.log(`[HostCoordinator] Attempting to kick player: ${playerId}`);
      kickPlayer(playerId, Date.now());
    },
    [kickPlayer]
  );

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
    executeKickPlayer,
  };
}
