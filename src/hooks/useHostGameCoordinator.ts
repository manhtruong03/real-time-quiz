// src/hooks/useHostGameCoordinator.ts
import { useState, useCallback, useEffect, useRef } from "react";
import {
  GameBlock,
  QuizStructureHost,
  LiveGameState,
  PlayerAnswerPayload,
  isContentBlock,
  QuestionHost,
  QuestionAnswerStats, // <-- Ensure QuestionAnswerStats is imported
  PlayerScoreRankSnapshot, // <-- Ensure PlayerScoreRankSnapshot is imported
  QuestionEventLogEntry,
  PlayerAnswerRecord,
} from "@/src/lib/types";
import { MockWebSocketMessage } from "@/src/components/game/DevMockControls";

import {
  formatQuestionForPlayer,
  getCurrentHostQuestion,
} from "@/src/lib/game-utils/question-formatter";
import {
  useGameStateManagement,
  QuestionEventStatus,
} from "./game/useGameStateManagement";
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
    transitionToShowingScoreboard,
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
  const allAnsweredTriggeredRef = useRef<boolean>(false); // Ref to prevent multiple triggers
  useEffect(() => {
    liveGameStateRef.current = liveGameState;
    // Reset trigger flag when moving to a new question
    if (
      liveGameState?.status === "QUESTION_SHOW" &&
      allAnsweredTriggeredRef.current
    ) {
      const hasAnswerRecordForCurrentIndex = Object.values(
        liveGameState.players
      ).some((p) =>
        p.answers.some(
          (a) => a.questionIndex === liveGameState.currentQuestionIndex
        )
      );
      if (!hasAnswerRecordForCurrentIndex) {
        // Only reset if no answers exist for the *new* index
        allAnsweredTriggeredRef.current = false;
        // console.log("[Coordinator] Reset allAnsweredTriggeredRef for new question:", liveGameState.currentQuestionIndex);
      }
    }
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
    allAnsweredTriggeredRef.current = false;

    // Create a new players object to accumulate changes
    let updatedPlayers = { ...currentState.players };
    let timeoutProcessed = false;

    Object.keys(updatedPlayers).forEach((cid) => {
      const player = updatedPlayers[cid];
      const hasAnswered = player.answers.some(
        (a) => a.questionIndex === currentState.currentQuestionIndex
      );
      if (
        player.isConnected &&
        player.playerStatus !== "KICKED" &&
        !hasAnswered
      ) {
        // Simulate the state update that processTimeUpForPlayer would do
        const hostQuestion = getCurrentHostQuestion(
          initialQuizData,
          currentState.currentQuestionIndex
        );
        if (hostQuestion && hostQuestion.type !== "content") {
          const questionTime = hostQuestion.time ?? 0;
          const timeoutAnswer: PlayerAnswerRecord = {
            questionIndex: currentState.currentQuestionIndex,
            blockType: hostQuestion.type, // Use hostQuestion.type
            choice: null,
            text: null,
            reactionTimeMs: questionTime,
            answerTimestamp: Date.now(),
            isCorrect: false,
            status: "TIMEOUT",
            basePoints: 0,
            finalPointsEarned: 0,
            pointsData: {
              totalPointsWithBonuses: 0,
              questionPoints: 0,
              answerStreakPoints: {
                streakLevel: 0,
                previousStreakLevel: player.currentStreak,
              },
              lastGameBlockIndex: currentState.currentQuestionIndex,
            },
          };
          updatedPlayers[cid] = {
            ...player,
            answers: [...player.answers, timeoutAnswer],
            currentStreak: 0,
            unansweredCount: player.unansweredCount + 1,
            lastActivityAt: Date.now(),
          };
          timeoutProcessed = true;
        }
      }
    });

    // If any timeouts were processed, update the state once.
    if (timeoutProcessed) {
      setLiveGameState((prev) =>
        prev ? { ...prev, players: updatedPlayers } : null
      );
    }

    // Use a timeout to allow the state update to propagate if it happened.
    // The main goal is that calculateAnswerStats gets the most up-to-date player answer list.
    setTimeout(
      () => {
        const latestStateAfterTimeouts = liveGameStateRef.current; // Get the freshest state
        if (!latestStateAfterTimeouts) return;

        const hostQuestion = getCurrentHostQuestion(
          initialQuizData,
          latestStateAfterTimeouts.currentQuestionIndex
        );

        if (!hostQuestion) {
          console.error(
            "[Coordinator] handleTimeUp: Could not get host question for stats calculation."
          );
          transitionToStatsView(null);
          return;
        }
        const calculatedStats = calculateAnswerStats(
          latestStateAfterTimeouts.players, // Use players from the latest state
          latestStateAfterTimeouts.currentQuestionIndex,
          hostQuestion
        );
        transitionToStatsView(calculatedStats);
      },
      timeoutProcessed ? 50 : 0
    ); // Add small delay only if state was updated
  }, [
    initialQuizData,
    transitionToStatsView,
    calculateAnswerStats,
    setLiveGameState,
  ]);

  const handleSkip = useCallback(() => {
    console.log("[Coordinator] handleSkip called.");
    const currentState = liveGameStateRef.current;
    if (!currentState || !initialQuizData) return;

    const currentQuestionIndex = currentState.currentQuestionIndex;
    let nextInteractiveIndex = currentQuestionIndex + 1;

    // --- Logic to update questionEventsLog for skipped questions ---
    // Find all questions between current (exclusive) and nextInteractive (exclusive)
    // and mark them as SKIPPED.
    // This should ideally be part of advanceToQuestion's logic in useGameStateManagement
    // or done explicitly here before calling advanceToQuestion.

    // For simplicity here, let's assume advanceToQuestion in useGameStateManagement
    // could be enhanced to handle skipping logic for questionEventsLog.
    // If not, we'd update setLiveGameState here:
    /*
    setLiveGameState(prev => {
        if (!prev) return null;
        const logUpdates = prev.questionEventsLog.map(entry => {
            if (entry.questionIndex > currentQuestionIndex && entry.questionIndex < nextInteractiveIndex) {
                return { ...entry, status: 'SKIPPED', endedAt: Date.now() };
            }
            return entry;
        });
        // Add new entries for skipped questions not yet in log
        for (let i = currentQuestionIndex + 1; i < nextInteractiveIndex; i++) {
            if (!logUpdates.some(e => e.questionIndex === i)) {
                logUpdates.push({
                    questionIndex: i,
                    startedAt: null, // Or some marker time
                    endedAt: Date.now(),
                    status: 'SKIPPED'
                });
            }
        }
        return { ...prev, questionEventsLog: logUpdates.sort((a,b) => a.questionIndex - b.questionIndex) };
    });
    */
    // --- End Skip Logic Idea ---

    while (nextInteractiveIndex < initialQuizData.questions.length) {
      const nextQuestion = getCurrentHostQuestion(
        initialQuizData,
        nextInteractiveIndex
      );
      if (nextQuestion && nextQuestion.type !== "content") {
        break;
      }
      nextInteractiveIndex++;
    }

    // Update LiveGameState to mark intermediate questions as SKIPPED
    // This update needs to happen before calling advanceToQuestion for the *next* interactive one.
    setLiveGameState((prev) => {
      if (!prev) return prev;
      const updatedEventsLog = [...prev.questionEventsLog];
      const now = Date.now();
      // Mark intermediate questions as SKIPPED
      for (
        let i = prev.currentQuestionIndex + 1;
        i < nextInteractiveIndex;
        i++
      ) {
        const existingEntryIndex = updatedEventsLog.findIndex(
          (e) => e.questionIndex === i
        );
        const skippedEntry: QuestionEventLogEntry = {
          questionIndex: i,
          // startedAt might be null if the "get ready" phase was also skipped
          startedAt:
            updatedEventsLog.find((e) => e.questionIndex === i)?.startedAt ||
            null,
          endedAt: now,
          status: "SKIPPED" as QuestionEventStatus,
        };
        if (existingEntryIndex > -1) {
          updatedEventsLog[existingEntryIndex] = {
            ...updatedEventsLog[existingEntryIndex],
            ...skippedEntry,
          };
        } else {
          // If the question was never even 'ACTIVE' in the log, add a new entry.
          updatedEventsLog.push(skippedEntry);
        }
      }
      // Sort because new entries might be pushed out of order
      updatedEventsLog.sort((a, b) => a.questionIndex - b.questionIndex);
      return { ...prev, questionEventsLog: updatedEventsLog };
    });

    if (nextInteractiveIndex < initialQuizData.questions.length) {
      console.log(
        `[Coordinator] handleSkip: Skipping to question ${nextInteractiveIndex}`
      );
      advanceToQuestion(nextInteractiveIndex); // This will create/update log for the target question
    } else {
      console.log(
        "[Coordinator] handleSkip: No more interactive questions, showing Podium."
      );
      showPodium(); // This will update log for the last question to 'ENDED'
    }
  }, [initialQuizData, advanceToQuestion, showPodium, setLiveGameState]);

  // Effect for "all players answered" (remains the same logic, using handleTimeUp)
  useEffect(() => {
    const currentState = liveGameStateRef.current;
    if (
      !currentState ||
      currentState.status !== "QUESTION_SHOW" ||
      allAnsweredTriggeredRef.current
    ) {
      return;
    }
    const connectedPlayers = Object.values(currentState.players).filter(
      (p) => p.isConnected && p.playerStatus !== "KICKED"
    );
    const connectedPlayerCount = connectedPlayers.length;
    if (connectedPlayerCount === 0) return;
    const answeredCount = connectedPlayers.filter((p) =>
      p.answers.some(
        (a) =>
          a.questionIndex === currentState.currentQuestionIndex &&
          a.status !== "TIMEOUT"
      )
    ).length;
    if (answeredCount >= connectedPlayerCount) {
      console.log(
        `[Coordinator] All ${connectedPlayerCount} players have answered question ${currentState.currentQuestionIndex}. Triggering time up.`
      );
      allAnsweredTriggeredRef.current = true;
      handleTimeUp();
    }
  }, [liveGameState?.players, liveGameState?.status, handleTimeUp]);

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
      const currentHostQuestionForLog = getCurrentHostQuestion(
        initialQuizData,
        currentIndex
      );
      if (
        currentHostQuestionForLog &&
        currentHostQuestionForLog.type === "content"
      ) {
        // Explicitly end the content slide in the log
        setLiveGameState((prev) => {
          if (!prev) return null;
          const updatedEventsLog = prev.questionEventsLog.map((entry) =>
            entry.questionIndex === currentIndex
              ? {
                  ...entry,
                  endedAt: Date.now(),
                  status: "ENDED" as QuestionEventStatus,
                }
              : entry
          );
          // Ensure entry exists if somehow missed by advanceToQuestion (defensive)
          if (
            !updatedEventsLog.some((e) => e.questionIndex === currentIndex) &&
            currentIndex !== -1
          ) {
            updatedEventsLog.push({
              questionIndex: currentIndex,
              startedAt: prev.currentQuestionStartTime, // Or a timestamp when content slide was shown
              endedAt: Date.now(),
              status: "ENDED" as QuestionEventStatus,
            });
            updatedEventsLog.sort((a, b) => a.questionIndex - b.questionIndex);
          }
          return { ...prev, questionEventsLog: updatedEventsLog };
        });

        // Then proceed to advance or show podium
        if (nextIndex < totalQuestions) {
          advanceToQuestion(nextIndex);
        } else {
          showPodium();
        }
      } else {
        // Interactive question
        handleTimeUp();
      }
    } else if (currentStatus === "SHOWING_STATS") {
      // <-- Step 1: Transition FROM Stats TO Scoreboard
      console.log(
        "[Coordinator] handleNext: Showing Stats -> Transitioning to Scoreboard"
      );
      transitionToShowingScoreboard(); // <-- Call the new transition function
    } else if (currentStatus === "SHOWING_SCOREBOARD") {
      // <-- Step 2: Add logic TO transition FROM Scoreboard
      console.log(
        "[Coordinator] handleNext: Showing Scoreboard -> Checking next step"
      );
      if (nextIndex < totalQuestions) {
        console.log(
          `[Coordinator] handleNext: Scoreboard -> Advancing to question ${nextIndex}`
        );
        advanceToQuestion(nextIndex);
      } else {
        console.log(
          "[Coordinator] handleNext: Scoreboard -> Showing Podium (End of Quiz)"
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
    transitionToShowingScoreboard, // <-- Add dependency
  ]);

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
