// src/hooks/useHostGameCoordinator.ts
import { useState, useCallback, useEffect, useRef } from "react";
import {
  GameBlock,
  QuizStructureHost,
  LiveGameState,
  PlayerAnswerPayload,
  isContentBlock,
  QuestionHost, // Make sure QuestionHost is imported
} from "@/src/lib/types";
import { MockWebSocketMessage } from "@/src/components/game/DevMockControls";

import {
  formatQuestionForPlayer,
  getCurrentHostQuestion,
} from "@/src/lib/game-utils/question-formatter";
import { useGameStateManagement } from "./game/useGameStateManagement";
import { usePlayerManagement } from "./game/usePlayerManagement";
import { useAnswerProcessing } from "./game/useAnswerProcessing"; // Import the hook
import { useWebSocketMessaging } from "./game/useWebSocketMessaging";

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
    transitionToStatsView, // <-- Use the updated function name
    showPodium,
    endGame,
    resetGameState,
  } = useGameStateManagement(initialQuizData);

  // --- Player Management ---
  const { addOrUpdatePlayer, updatePlayerAvatar } =
    usePlayerManagement(setLiveGameState);

  // --- Answer Processing ---
  const {
    processPlayerAnswer,
    processTimeUpForPlayer,
    calculateAnswerStats, // <-- Import the stats calculation function
  } = useAnswerProcessing(initialQuizData, setLiveGameState);

  // --- Refs for state and callbacks ---
  const liveGameStateRef = useRef<LiveGameState | null>(liveGameState);
  useEffect(() => {
    liveGameStateRef.current = liveGameState;
    // console.log("[Coordinator] LiveGameState updated:", liveGameState?.status, liveGameState?.currentQuestionIndex, liveGameState?.currentQuestionStats);
  }, [liveGameState]);

  const callbacksRef = useRef({
    addOrUpdatePlayer,
    updatePlayerAvatar,
    processPlayerAnswer,
    notifyPlayerJoined: (cid: string) => {
      // console.log(`[Coordinator] Notified that player ${cid} joined.`);
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

  // --- WebSocket Messaging Hook ---
  const {
    prepareQuestionMessage,
    prepareResultMessage,
    handleIncomingMessage,
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

  // --- Coordinated Game Flow Logic ---

  const handleTimeUp = useCallback(() => {
    const currentState = liveGameStateRef.current;
    if (
      !currentState ||
      currentState.status !== "QUESTION_SHOW" ||
      !initialQuizData
    )
      return;

    console.log(
      `[Coordinator] handleTimeUp triggered for index: ${currentState.currentQuestionIndex}`
    );

    // 1. Process timeouts for players who haven't answered
    Object.keys(currentState.players).forEach((cid) => {
      const player = currentState.players[cid];
      // Check if player is connected and hasn't submitted an answer for the current question
      const hasAnswered = player.answers.some(
        (a) => a.questionIndex === currentState.currentQuestionIndex
      );
      if (player.isConnected && !hasAnswered) {
        processTimeUpForPlayer(cid);
      }
    });

    // 2. Calculate Stats using the latest state *after* processing timeouts
    // We need to get the updated state potentially caused by processTimeUpForPlayer calls.
    // Since setLiveGameState is async, we rely on the ref potentially being updated slightly later,
    // OR ideally, `calculateAnswerStats` should be designed to work with the state *before* timeout processing if needed,
    // but it's usually better to calculate stats *after* all answers/timeouts are in.
    // Let's assume the state updates quickly enough for the ref, or adjust if needed.
    // Use a timeout to allow state updates from processTimeUpForPlayer to hopefully settle
    setTimeout(() => {
      const latestState = liveGameStateRef.current;
      if (!latestState) return; // Guard against state becoming null

      const hostQuestion = getCurrentHostQuestion(
        initialQuizData,
        latestState.currentQuestionIndex
      );

      if (!hostQuestion) {
        console.error(
          "[Coordinator] handleTimeUp: Could not get host question for stats calculation."
        );
        // Maybe transition directly to next question or podium if hostQuestion is missing?
        // For now, log error and potentially proceed without stats.
        transitionToStatsView(null); // Transition even if stats calculation fails
        return;
      }
      // Calculate stats based on the potentially updated player answers
      const calculatedStats = calculateAnswerStats(
        latestState.players,
        latestState.currentQuestionIndex,
        hostQuestion
      );

      console.log(
        `[Coordinator] Stats calculated for index ${latestState.currentQuestionIndex}:`,
        calculatedStats
      );

      // 3. Transition to the stats view, passing the calculated stats
      transitionToStatsView(calculatedStats);
    }, 50); // Small delay to allow state updates to process. Adjust if needed.
  }, [
    initialQuizData,
    processTimeUpForPlayer,
    calculateAnswerStats,
    transitionToStatsView,
  ]);

  const handleNext = useCallback(() => {
    console.log("[Coordinator] handleNext called.");
    const currentState = liveGameStateRef.current;
    if (!currentState || !initialQuizData) {
      console.warn(
        "[Coordinator] handleNext called with no current state or quiz data."
      );
      return;
    }

    const currentStatus = currentState.status;
    const currentIndex = currentState.currentQuestionIndex;
    const totalQuestions = initialQuizData.questions.length;
    const nextIndex = currentIndex + 1;

    console.log(
      `[Coordinator] handleNext: Current Status=${currentStatus}, Current Index=${currentIndex}, Next Index=${nextIndex}, Total Questions=${totalQuestions}`
    );

    if (currentStatus === "LOBBY") {
      if (totalQuestions > 0) {
        console.log(
          "[Coordinator] handleNext: LOBBY -> Advancing to question 0"
        );
        advanceToQuestion(0);
      } else {
        console.warn(
          "[Coordinator] handleNext: No questions in quiz, cannot start."
        );
        // Consider setting state to ENDED or showing an error
      }
    } else if (currentStatus === "QUESTION_SHOW") {
      const currentHostQuestion = getCurrentHostQuestion(
        initialQuizData,
        currentIndex
      );
      // If it's a content block, 'Next' moves to the following question/podium
      if (currentHostQuestion && currentHostQuestion.type === "content") {
        if (nextIndex < totalQuestions) {
          console.log(
            `[Coordinator] handleNext: Content Block -> Advancing to question ${nextIndex}`
          );
          advanceToQuestion(nextIndex);
        } else {
          console.log(
            "[Coordinator] handleNext: Content Block -> Showing Podium (End of Quiz)"
          );
          showPodium();
        }
      } else {
        // For interactive questions, 'Next' during QUESTION_SHOW usually means time's up or forced advance
        console.log(
          "[Coordinator] handleNext: Interactive Question Show -> Triggering Time Up logic"
        );
        handleTimeUp();
      }
    } else if (currentStatus === "SHOWING_STATS") {
      // <-- Use new state
      // After showing stats, 'Next' moves to the following question or podium
      if (nextIndex < totalQuestions) {
        console.log(
          `[Coordinator] handleNext: Showing Stats -> Advancing to question ${nextIndex}`
        );
        advanceToQuestion(nextIndex);
      } else {
        console.log(
          "[Coordinator] handleNext: Showing Stats -> Showing Podium (End of Quiz)"
        );
        showPodium();
      }
    } else if (currentStatus === "PODIUM") {
      console.log("[Coordinator] handleNext: Podium -> Ending Game");
      endGame();
    } else {
      console.warn(
        `[Coordinator] handleNext called in unexpected state: ${currentStatus}`
      );
    }
  }, [
    initialQuizData,
    advanceToQuestion,
    handleTimeUp,
    showPodium,
    endGame,
    transitionToStatsView,
  ]); // Add transitionToStatsView

  const handleSkip = useCallback(() => {
    console.log("[Coordinator] handleSkip called.");
    const currentState = liveGameStateRef.current;
    if (!currentState || !initialQuizData) return;

    let nextInteractiveIndex = currentState.currentQuestionIndex + 1;
    // Find the next question that isn't a 'content' block
    while (nextInteractiveIndex < initialQuizData.questions.length) {
      const nextQuestion = getCurrentHostQuestion(
        initialQuizData,
        nextInteractiveIndex
      );
      // Ensure nextQuestion is not null and not a content block
      if (nextQuestion && nextQuestion.type !== "content") {
        break; // Found the next interactive question
      }
      nextInteractiveIndex++;
    }

    if (nextInteractiveIndex < initialQuizData.questions.length) {
      console.log(
        `[Coordinator] handleSkip: Skipping to question ${nextInteractiveIndex}`
      );
      advanceToQuestion(nextInteractiveIndex);
    } else {
      console.log(
        "[Coordinator] handleSkip: No more interactive questions, showing Podium."
      );
      showPodium();
    }
  }, [initialQuizData, advanceToQuestion, showPodium]);

  // Calculate derived values for the UI
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

  return {
    liveGameState, // Includes currentQuestionStats now
    currentBlock,
    timerKey,
    currentQuestionAnswerCount,
    currentTotalPlayers,
    quizData: initialQuizData,
    handleNext,
    handleSkip,
    handleTimeUp,
    handleWebSocketMessage: handleIncomingMessage,
    initializeSession,
    prepareQuestionMessage: () => prepareQuestionMessage(currentBlock),
    prepareResultMessage,
    resetGameState,
  };
}
