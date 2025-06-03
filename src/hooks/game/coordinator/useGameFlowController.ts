// src/hooks/game/coordinator/useGameFlowController.ts
import { useCallback, RefObject } from "react";
import {
  LiveGameState,
  QuizStructureHost,
  QuestionHost,
  PlayerAnswerRecord,
  QuestionEventLogEntry,
  QuestionAnswerStats,
} from "@/src/lib/types";
import { getCurrentHostQuestion } from "@/src/lib/game-utils/question-formatter";
import { QuestionEventStatus } from "../useGameStateManagement"; // Assuming this type is exported

type SetLiveGameState = React.Dispatch<
  React.SetStateAction<LiveGameState | null>
>;

interface UseGameFlowControllerProps {
  initialQuizData: QuizStructureHost | null;
  liveGameStateRef: RefObject<LiveGameState | null>; // Using RefObject for direct access to current state in callbacks
  setLiveGameState: SetLiveGameState;
  advanceToQuestion: (questionIndex: number) => void;
  transitionToStatsView: (stats: QuestionAnswerStats | null) => void;
  transitionToShowingScoreboard: () => void;
  showPodium: () => void;
  endGame: () => void;
  calculateAnswerStats: (
    players: LiveGameState["players"],
    questionIndex: number,
    hostQuestion: QuestionHost
  ) => QuestionAnswerStats | null;
}

interface GameFlowControllerActions {
  handleTimeUp: () => void;
  handleSkip: () => void;
  handleNext: () => void;
}

export function useGameFlowController({
  initialQuizData,
  liveGameStateRef,
  setLiveGameState,
  advanceToQuestion,
  transitionToStatsView,
  transitionToShowingScoreboard,
  showPodium,
  endGame,
  calculateAnswerStats,
}: UseGameFlowControllerProps): GameFlowControllerActions {
  const handleTimeUp = useCallback(() => {
    const currentState = liveGameStateRef.current;
    if (
      !currentState ||
      currentState.status !== "QUESTION_SHOW" ||
      !initialQuizData
    ) {
      return;
    }

    console.log(
      `[GameFlowController] handleTimeUp triggered for index: ${currentState.currentQuestionIndex}`
    );

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
        const hostQuestion = getCurrentHostQuestion(
          initialQuizData,
          currentState.currentQuestionIndex
        );
        if (hostQuestion && hostQuestion.type !== "content") {
          const questionTime = hostQuestion.time ?? 0;
          const timeoutAnswer: PlayerAnswerRecord = {
            questionIndex: currentState.currentQuestionIndex,
            blockType: hostQuestion.type,
            choice: null,
            text: null,
            reactionTimeMs: questionTime * 1000, // Assuming questionTime is in seconds
            answerTimestamp: Date.now(),
            isCorrect: false,
            status: "TIMEOUT",
            basePoints: 0,
            finalPointsEarned: 0,
            pointsData: {
              // Ensure this structure matches PlayerAnswerRecord
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

    if (timeoutProcessed) {
      setLiveGameState((prev) =>
        prev ? { ...prev, players: updatedPlayers } : null
      );
    }

    setTimeout(
      () => {
        const latestStateAfterTimeouts = liveGameStateRef.current;
        if (!latestStateAfterTimeouts || !initialQuizData) return;

        const hostQuestion = getCurrentHostQuestion(
          initialQuizData,
          latestStateAfterTimeouts.currentQuestionIndex
        );

        if (!hostQuestion) {
          console.error(
            "[GameFlowController] handleTimeUp: Could not get host question for stats."
          );
          transitionToStatsView(null);
          return;
        }
        const calculatedStats = calculateAnswerStats(
          latestStateAfterTimeouts.players,
          latestStateAfterTimeouts.currentQuestionIndex,
          hostQuestion
        );
        transitionToStatsView(calculatedStats);
      },
      timeoutProcessed ? 50 : 0
    );
  }, [
    initialQuizData,
    liveGameStateRef,
    setLiveGameState,
    calculateAnswerStats,
    transitionToStatsView,
  ]);

  const handleSkip = useCallback(() => {
    console.log("[GameFlowController] handleSkip called.");
    const currentState = liveGameStateRef.current;
    if (!currentState || !initialQuizData) return;

    const currentQuestionIndex = currentState.currentQuestionIndex;
    let nextInteractiveIndex = currentQuestionIndex + 1;

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

    setLiveGameState((prev) => {
      if (!prev) return prev;
      const updatedEventsLog = [...prev.questionEventsLog];
      const now = Date.now();
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
          updatedEventsLog.push(skippedEntry);
        }
      }
      updatedEventsLog.sort((a, b) => a.questionIndex - b.questionIndex);
      return { ...prev, questionEventsLog: updatedEventsLog };
    });

    if (nextInteractiveIndex < initialQuizData.questions.length) {
      console.log(
        `[GameFlowController] handleSkip: Skipping to question ${nextInteractiveIndex}`
      );
      advanceToQuestion(nextInteractiveIndex);
    } else {
      console.log(
        "[GameFlowController] handleSkip: No more interactive questions, showing Podium."
      );
      showPodium();
    }
  }, [
    initialQuizData,
    liveGameStateRef,
    setLiveGameState,
    advanceToQuestion,
    showPodium,
  ]);

  const handleNext = useCallback(() => {
    console.log("[GameFlowController] handleNext called.");
    const currentState = liveGameStateRef.current;
    if (!currentState || !initialQuizData) {
      console.warn(
        "[GameFlowController] handleNext with no current state or quiz data."
      );
      return;
    }

    const currentStatus = currentState.status;
    const currentIndex = currentState.currentQuestionIndex;
    const totalQuestions = initialQuizData.questions.length;
    const nextIndex = currentIndex + 1;

    if (currentStatus === "LOBBY") {
      if (totalQuestions > 0) {
        advanceToQuestion(0);
      } else {
        console.warn("[GameFlowController] No questions in quiz.");
      }
    } else if (currentStatus === "QUESTION_SHOW") {
      const currentHostQuestionForLog = getCurrentHostQuestion(
        initialQuizData,
        currentIndex
      );
      if (currentHostQuestionForLog?.type === "content") {
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
          if (
            !updatedEventsLog.some((e) => e.questionIndex === currentIndex) &&
            currentIndex !== -1
          ) {
            updatedEventsLog.push({
              questionIndex: currentIndex,
              startedAt: prev.currentQuestionStartTime,
              endedAt: Date.now(),
              status: "ENDED" as QuestionEventStatus,
            });
            updatedEventsLog.sort((a, b) => a.questionIndex - b.questionIndex);
          }
          return { ...prev, questionEventsLog: updatedEventsLog };
        });
        if (nextIndex < totalQuestions) {
          advanceToQuestion(nextIndex);
        } else {
          showPodium();
        }
      } else {
        handleTimeUp(); // For interactive questions, time up leads to stats
      }
    } else if (currentStatus === "SHOWING_STATS") {
      transitionToShowingScoreboard();
    } else if (currentStatus === "SHOWING_SCOREBOARD") {
      if (nextIndex < totalQuestions) {
        advanceToQuestion(nextIndex);
      } else {
        showPodium();
      }
    } else if (currentStatus === "PODIUM") {
      endGame();
    } else {
      console.warn(
        `[GameFlowController] handleNext in unexpected state: ${currentStatus}`
      );
    }
  }, [
    initialQuizData,
    liveGameStateRef,
    setLiveGameState,
    advanceToQuestion,
    handleTimeUp, // handleTimeUp is now part of this hook, so it's a stable reference
    showPodium,
    endGame,
    transitionToShowingScoreboard,
  ]);

  return {
    handleTimeUp,
    handleSkip,
    handleNext,
  };
}
