// src/hooks/useHostGameCoordinator.ts (Stage 3 - Pass quizData to Answer hook)
import { useState, useCallback, useEffect, useRef } from "react";
import {
  GameBlock,
  QuizStructureHost,
  LiveGameState,
  PlayerAnswerPayload, // Keep for types used in callbacks
  isContentBlock,
} from "@/src/lib/types";
import { MockWebSocketMessage } from "@/src/components/game/DevMockControls";

// Import Stage 1 Utilities
import {
  formatQuestionForPlayer,
  getCurrentHostQuestion,
} from "@/src/lib/game-utils/question-formatter";

// Import Stage 2 Hooks
import { useGameStateManagement } from "./game/useGameStateManagement";
import { usePlayerManagement } from "./game/usePlayerManagement";

// Import Stage 3 Hooks
import { useAnswerProcessing } from "./game/useAnswerProcessing";
import { useWebSocketMessaging } from "./game/useWebSocketMessaging";

export function useHostGameCoordinator(
  initialQuizData: QuizStructureHost | null
) {
  // --- Base State Management ---
  const {
    liveGameState,
    setLiveGameState,
    timerKey,
    initializeSession,
    advanceToQuestion,
    showResults: transitionToShowResults,
    showPodium,
    endGame,
    resetGameState,
  } = useGameStateManagement(initialQuizData);

  // --- Player Management ---
  const {
    addOrUpdatePlayer,
    updatePlayerAvatar,
    updatePlayerConnectionStatus,
  } = usePlayerManagement(setLiveGameState);

  // --- Answer Processing ---
  // No longer need getCurrentHostQuestionFn callback definition here
  const {
    processPlayerAnswer,
    processTimeUpForPlayer,
    // Pass initialQuizData directly to the hook
  } = useAnswerProcessing(initialQuizData, setLiveGameState);

  // --- Refs for state and callbacks ---
  const liveGameStateRef = useRef<LiveGameState | null>(liveGameState);
  useEffect(() => {
    liveGameStateRef.current = liveGameState; /* console.log(...) */
  }, [liveGameState]);

  // Store callbacks in refs
  const callbacksRef = useRef({
    addOrUpdatePlayer,
    updatePlayerAvatar,
    processPlayerAnswer,
  });
  useEffect(() => {
    callbacksRef.current = {
      addOrUpdatePlayer,
      updatePlayerAvatar,
      processPlayerAnswer,
    };
  }, [addOrUpdatePlayer, updatePlayerAvatar, processPlayerAnswer]);

  // --- WebSocket Messaging ---
  const {
    prepareQuestionMessage,
    prepareResultMessage,
    handleIncomingMessage,
    // Pass initialQuizData here as well, as prepareResultMessage needs it
  } = useWebSocketMessaging(
    liveGameStateRef,
    initialQuizData,
    callbacksRef.current
  );

  // --- Local State for Coordinator ---
  const [currentBlock, setCurrentBlock] = useState<GameBlock | null>(null);

  // Effect to update currentBlock based on gameState index change
  useEffect(() => {
    if (!liveGameState || !initialQuizData) {
      setCurrentBlock(null);
      return;
    }
    const hostQuestion = getCurrentHostQuestion(
      initialQuizData,
      liveGameState.currentQuestionIndex
    );
    const formattedBlock = formatQuestionForPlayer(
      hostQuestion,
      liveGameState.currentQuestionIndex,
      initialQuizData.questions.length
    );
    setCurrentBlock(formattedBlock);
  }, [liveGameState?.currentQuestionIndex, initialQuizData]);

  // --- Coordinated Game Flow Logic (handleNext, handleSkip, handleTimeUp - unchanged) ---
  const handleTimeUp = useCallback(() => {
    const currentState = liveGameStateRef.current;
    if (!currentState || currentState.status !== "QUESTION_SHOW") return;
    // console.log("(Coordinator) handleTimeUp triggered for index:", currentState.currentQuestionIndex);
    Object.keys(currentState.players).forEach((cid) => {
      const player = currentState.players[cid];
      const hasAnswered = player.answers.some(
        (a) => a.questionIndex === currentState.currentQuestionIndex
      );
      if (player.isConnected && !hasAnswered) {
        processTimeUpForPlayer(cid);
      }
    });
    setTimeout(() => {
      // console.log("(Coordinator) Transitioning to results after processing timeouts");
      transitionToShowResults();
    }, 0);
  }, [processTimeUpForPlayer, transitionToShowResults]);

  const handleNext = useCallback(() => {
    // console.log("[Coordinator] handleNext called.");
    const currentState = liveGameStateRef.current;
    if (!currentState || !initialQuizData) return;
    const currentStatus = currentState.status;
    const currentIndex = currentState.currentQuestionIndex;
    const currentHostQuestion = getCurrentHostQuestion(
      initialQuizData,
      currentIndex
    );

    if (currentStatus === "LOBBY") advanceToQuestion(0);
    else if (currentStatus === "QUESTION_SHOW") {
      if (currentHostQuestion && currentHostQuestion.type === "content") {
        const nextIndex = currentIndex + 1;
        if (nextIndex < initialQuizData.questions.length)
          advanceToQuestion(nextIndex);
        else showPodium();
      } else handleTimeUp();
    } else if (currentStatus === "QUESTION_RESULT") {
      const nextIndex = currentIndex + 1;
      if (nextIndex < initialQuizData.questions.length)
        advanceToQuestion(nextIndex);
      else showPodium();
    } else if (currentStatus === "PODIUM") endGame();
  }, [initialQuizData, advanceToQuestion, handleTimeUp, showPodium, endGame]);

  const handleSkip = useCallback(() => {
    // console.log("[Coordinator] handleSkip called.");
    const currentState = liveGameStateRef.current;
    if (!currentState || !initialQuizData) return;
    let nextInteractiveIndex = currentState.currentQuestionIndex + 1;
    while (nextInteractiveIndex < initialQuizData.questions.length) {
      const nextQuestion = getCurrentHostQuestion(
        initialQuizData,
        nextInteractiveIndex
      );
      if (nextQuestion && nextQuestion.type !== "content") break;
      nextInteractiveIndex++;
    }
    if (nextInteractiveIndex < initialQuizData.questions.length)
      advanceToQuestion(nextInteractiveIndex);
    else showPodium();
  }, [initialQuizData, advanceToQuestion, showPodium]);

  // --- Calculate derived values for the UI ---
  const currentTotalPlayers = liveGameState
    ? Object.keys(liveGameState.players).filter(
        (id) => id !== liveGameState.hostUserId
      ).length
    : 0;
  const currentQuestionAnswerCount = liveGameState
    ? Object.values(liveGameState.players).filter((p) =>
        p.answers.some(
          (a) => a.questionIndex === liveGameState.currentQuestionIndex
        )
      ).length
    : 0;

  // console.log("[Coordinator] Rendering. Current Index:", liveGameState?.currentQuestionIndex);
  // console.log("[Coordinator] Calculation Result - Answer Count:", currentQuestionAnswerCount);
  // console.log("[Coordinator] Calculation Result - Total Players:", currentTotalPlayers);

  // --- Return statement ---
  return {
    liveGameState,
    currentBlock,
    timerKey,
    currentQuestionAnswerCount,
    currentTotalPlayers,
    quizData: initialQuizData, // Keep passing if needed by HostPage
    handleNext,
    handleSkip,
    handleTimeUp,
    handleWebSocketMessage: handleIncomingMessage, // From messaging hook
    initializeSession, // From state hook
    prepareQuestionMessage: () => prepareQuestionMessage(currentBlock), // From messaging hook
    prepareResultMessage, // From messaging hook
    resetGameState,
  };
}
