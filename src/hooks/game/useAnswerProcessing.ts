// src/hooks/game/useAnswerProcessing.ts (Fix: Use imported util inside setter)
import { useCallback } from "react";
import {
  QuizStructureHost,
  // QuestionHost, // No longer needed directly if quizData is passed
  PlayerAnswerPayload,
  LiveGameState,
  LivePlayerState,
  PlayerAnswerRecord,
  PointsData,
  AnswerPayloadQuiz,
  AnswerPayloadJumble,
  AnswerPayloadOpenEnded,
} from "@/src/lib/types";
import {
  calculateBasePoints,
  applyPointsMultiplier,
  checkAnswerCorrectness,
} from "@/src/lib/game-utils/quiz-scoring";
// Import the utility directly
import { getCurrentHostQuestion } from "@/src/lib/game-utils/question-formatter";

// No longer need GetCurrentHostQuestionFn type

export function useAnswerProcessing(
  quizData: QuizStructureHost | null, // Pass quizData directly
  setLiveGameState: React.Dispatch<React.SetStateAction<LiveGameState | null>>
) {
  const processPlayerAnswer = useCallback(
    (
      playerId: string,
      submittedPayload: PlayerAnswerPayload,
      answerTimestamp: number | undefined
    ) => {
      const timestamp = answerTimestamp || Date.now();

      setLiveGameState((prev) => {
        // console.log(`[AnswerProcHook] setLiveGameState called for Player: ${playerId}. Prev state status: ${prev?.status}, Prev QIndex: ${prev?.currentQuestionIndex}`);

        if (!prev || !quizData) {
          // Also check if quizData is available
          console.error(
            "[AnswerProcHook] Cannot process answer, previous state or quizData is null"
          );
          return prev; // Return prev state if no state or quizData
        }

        // --- FIX: Get the hostQuestion *inside* the setter using imported util and prev state ---
        const hostQuestion = getCurrentHostQuestion(
          quizData,
          prev.currentQuestionIndex
        );
        // --- End FIX ---

        // Now perform the checks using the hostQuestion derived from the correct index and data
        if (
          prev.status !== "QUESTION_SHOW" ||
          !hostQuestion || // Check if question exists for this index
          hostQuestion.type === "content" ||
          submittedPayload.questionIndex !== prev.currentQuestionIndex // Ensure answer matches current Q
        ) {
          console.log(
            `[AnswerProcHook] Answer rejected inside setter - Invalid state, hostQuestion, or index. Prev QIndex: ${prev.currentQuestionIndex}, hostQuestion type: ${hostQuestion?.type}, Prev Status: ${prev.status}, Submitted QIndex: ${submittedPayload.questionIndex}`
          );
          return prev; // Return unchanged state
        }

        const currentPlayerState = prev.players[playerId];
        if (
          !currentPlayerState ||
          currentPlayerState.answers.some(
            (a) => a.questionIndex === prev.currentQuestionIndex
          )
        ) {
          // console.log(`[AnswerProcHook] Answer rejected inside setter - Duplicate or invalid player: ${playerId}`);
          return prev; // Return unchanged state
        }

        // console.log(`[AnswerProcHook] Player ${playerId} answers BEFORE update:`, currentPlayerState.answers);

        // --- Scoring and Correctness (uses hostQuestion fetched above) ---
        const isCorrect = checkAnswerCorrectness(
          hostQuestion,
          submittedPayload
        );
        let basePoints = 0;
        let finalPointsEarned = 0;
        let currentStatus: PlayerAnswerRecord["status"] = "SUBMITTED";
        let pointsDataResult: PointsData | null = null;
        let playerChoice: PlayerAnswerRecord["choice"] = null;
        let playerText: PlayerAnswerRecord["text"] = null;
        const reactionTimeMs = prev.currentQuestionStartTime
          ? timestamp - prev.currentQuestionStartTime
          : hostQuestion.time ?? 0;

        switch (
          submittedPayload.type /* ... assign playerChoice/playerText ... */
        ) {
          case "quiz":
          case "survey":
            playerChoice = submittedPayload.choice;
            break;
          case "jumble":
            playerChoice = submittedPayload.choice;
            break;
          case "open_ended":
            playerText = submittedPayload.text;
            playerChoice = null;
            break;
        }
        if (hostQuestion.type !== "survey" && isCorrect) {
          /* ... calculate points ... */
          currentStatus = "CORRECT";
          basePoints = calculateBasePoints(
            reactionTimeMs,
            hostQuestion.time ?? 20000
          );
          finalPointsEarned = applyPointsMultiplier(
            basePoints,
            hostQuestion.pointsMultiplier
          );
        } else if (hostQuestion.type !== "survey" && !isCorrect) {
          /* ... assign 0 points ... */
          currentStatus = "WRONG";
          finalPointsEarned = 0;
          basePoints = 0;
        } else {
          currentStatus = "SUBMITTED";
          finalPointsEarned = 0;
          basePoints = 0;
        }

        pointsDataResult = {
          /* ... construct pointsData ... */
          totalPointsWithBonuses: finalPointsEarned,
          questionPoints: finalPointsEarned,
          answerStreakPoints: {
            streakLevel: isCorrect ? currentPlayerState.currentStreak + 1 : 0,
            previousStreakLevel: currentPlayerState.currentStreak,
          },
          lastGameBlockIndex: prev.currentQuestionIndex,
        };
        const newAnswerRecord: PlayerAnswerRecord = {
          /* ... construct newAnswerRecord ... */
          questionIndex: prev.currentQuestionIndex,
          blockType: submittedPayload.type,
          choice: playerChoice,
          text: playerText,
          reactionTimeMs: reactionTimeMs,
          answerTimestamp: timestamp,
          isCorrect: isCorrect,
          status: currentStatus,
          basePoints: basePoints,
          finalPointsEarned: finalPointsEarned,
          pointsData: pointsDataResult,
        };

        // --- Update Player State ---
        const updatedPlayer: LivePlayerState = {
          /* ... construct updatedPlayer ... */ ...currentPlayerState,
          totalScore: currentPlayerState.totalScore + finalPointsEarned,
          lastActivityAt: timestamp,
          currentStreak: isCorrect ? currentPlayerState.currentStreak + 1 : 0,
          answers: [...currentPlayerState.answers, newAnswerRecord], // Add the new record
          correctCount: currentPlayerState.correctCount + (isCorrect ? 1 : 0),
          incorrectCount:
            currentPlayerState.incorrectCount +
            (!isCorrect && hostQuestion.type !== "survey" ? 1 : 0),
          answersCount: currentPlayerState.answersCount + 1,
          totalReactionTimeMs:
            currentPlayerState.totalReactionTimeMs + reactionTimeMs,
          playerStatus: "PLAYING",
        };
        updatedPlayer.maxStreak = Math.max(
          updatedPlayer.maxStreak,
          updatedPlayer.currentStreak
        );

        const newState = {
          ...prev,
          players: { ...prev.players, [playerId]: updatedPlayer },
        };
        // console.log(`[AnswerProcHook] Player ${playerId} answers AFTER update (in newState):`, newState.players[playerId].answers);
        // console.log(`[AnswerProcHook] Returning updated state from setter for QIndex: ${prev.currentQuestionIndex}`);

        return newState;
      });
    },
    [quizData, setLiveGameState]
  ); // Dependency on quizData now

  // --- Logic for Handling Timeouts ---
  const processTimeUpForPlayer = useCallback(
    (playerId: string) => {
      setLiveGameState((prev) => {
        if (!prev || !quizData) return prev; // Check quizData too
        // FIX: Get hostQuestion inside setter using imported util
        const hostQuestion = getCurrentHostQuestion(
          quizData,
          prev.currentQuestionIndex
        );
        if (!hostQuestion || hostQuestion.type === "content") return prev;

        const player = prev.players[playerId];
        const currentIdx = prev.currentQuestionIndex;
        if (
          !player ||
          !player.isConnected ||
          player.answers.some((a) => a.questionIndex === currentIdx)
        )
          return prev;

        // console.log(`[AnswerProcHook] Processing TIMEOUT for Player: ${playerId}, QIndex: ${currentIdx}`);
        const questionTime = hostQuestion.time ?? 0;
        const timeoutAnswer: PlayerAnswerRecord = {
          /* ... timeout record ... */ questionIndex: currentIdx,
          blockType: hostQuestion.type,
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
            lastGameBlockIndex: currentIdx,
          },
        };
        const updatedPlayer: LivePlayerState = {
          /* ... updated player ... */ ...player,
          answers: [...player.answers, timeoutAnswer],
          currentStreak: 0,
          unansweredCount: player.unansweredCount + 1,
          lastActivityAt: Date.now(),
        };
        return {
          ...prev,
          players: { ...prev.players, [playerId]: updatedPlayer },
        };
      });
    },
    [quizData, setLiveGameState]
  ); // Dependency on quizData

  return {
    processPlayerAnswer,
    processTimeUpForPlayer,
  };
}
