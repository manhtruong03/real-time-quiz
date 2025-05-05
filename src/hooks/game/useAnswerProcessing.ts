// src/hooks/game/useAnswerProcessing.ts
import { useCallback } from "react";
import {
  QuizStructureHost,
  PlayerAnswerPayload,
  LiveGameState,
  LivePlayerState,
  PlayerAnswerRecord,
  PointsData,
  QuestionHost, // Need QuestionHost for detailed checks
} from "@/src/lib/types";
// --- Import Stat Types ---
import {
  QuestionAnswerStats,
  AnswerOptionStats,
  IndexedAnswerStats,
  JumbleAnswerStats,
} from "@/src/lib/types/stats";
// --- End Import Stat Types ---

import {
  calculateBasePoints,
  applyPointsMultiplier,
  checkAnswerCorrectness,
} from "@/src/lib/game-utils/quiz-scoring";
import { getCurrentHostQuestion } from "@/src/lib/game-utils/question-formatter";

// --- NEW: Statistics Calculation Function ---
/**
 * Calculates the distribution of answers for a specific question index.
 * @param players - The current player map from LiveGameState.
 * @param currentQuestionIndex - The index of the question to analyze.
 * @param hostQuestion - The corresponding host question data (needed for structure).
 * @returns The calculated statistics object (QuestionAnswerStats) or null.
 */
const calculateAnswerStats = (
  players: Record<string, LivePlayerState>,
  currentQuestionIndex: number,
  hostQuestion: QuestionHost | null
): QuestionAnswerStats | null => {
  if (!hostQuestion || hostQuestion.type === "content") {
    return null; // No stats for content blocks or missing host question
  }

  const relevantAnswers = Object.values(players)
    .map((p) => p.answers.find((a) => a.questionIndex === currentQuestionIndex))
    .filter(
      (a): a is PlayerAnswerRecord => a !== undefined && a.status !== "TIMEOUT"
    ); // Filter out undefined and potentially timeouts for percentage base? Or include timeouts? Let's include submitted/correct/wrong

  const totalAnswers = relevantAnswers.length;
  if (totalAnswers === 0) {
    return null; // No answers submitted (or only timeouts), no stats to show
  }

  if (hostQuestion.type === "quiz" || hostQuestion.type === "survey") {
    const stats: IndexedAnswerStats = {};
    // Initialize counts for all possible choices
    hostQuestion.choices.forEach((_, index) => {
      stats[index.toString()] = { count: 0, percentage: 0 };
    });

    // Tally counts
    relevantAnswers.forEach((answer) => {
      const choiceIndex = answer.choice;
      if (
        typeof choiceIndex === "number" &&
        stats[choiceIndex.toString()] !== undefined
      ) {
        stats[choiceIndex.toString()].count++;
      }
    });

    // Calculate percentages
    Object.keys(stats).forEach((key) => {
      stats[key].percentage = (stats[key].count / totalAnswers) * 100;
    });
    return stats;
  } else if (hostQuestion.type === "jumble") {
    let correctCount = 0;
    relevantAnswers.forEach((answer) => {
      if (answer.isCorrect) {
        correctCount++;
      }
    });
    const incorrectCount = totalAnswers - correctCount;
    const stats: JumbleAnswerStats = {
      correct: {
        count: correctCount,
        percentage: (correctCount / totalAnswers) * 100,
      },
      incorrect: {
        count: incorrectCount,
        percentage: (incorrectCount / totalAnswers) * 100,
      },
    };
    return stats;
  } else if (hostQuestion.type === "open_ended") {
    const stats: IndexedAnswerStats = {};
    const correctTextsLower = hostQuestion.choices
      .map((c) => c.answer?.trim().toLowerCase())
      .filter(Boolean);
    let incorrectCount = 0;

    // Initialize stats for correct answers defined in the question
    correctTextsLower.forEach((_, index) => {
      stats[index.toString()] = { count: 0, percentage: 0 }; // Use index as key for correct answers
    });
    stats["incorrect"] = { count: 0, percentage: 0 }; // Bucket for incorrect answers

    // Tally counts
    relevantAnswers.forEach((answer) => {
      const playerTextLower = answer.text?.trim().toLowerCase() ?? "";
      const correctIndex = correctTextsLower.indexOf(playerTextLower);

      if (correctIndex !== -1) {
        stats[correctIndex.toString()].count++;
      } else {
        stats["incorrect"].count++;
      }
    });

    // Calculate percentages
    Object.keys(stats).forEach((key) => {
      stats[key].percentage = (stats[key].count / totalAnswers) * 100;
    });

    return stats;
  }

  return null; // Should not reach here for valid types
};
// --- END NEW Statistics Calculation Function ---

export function useAnswerProcessing(
  quizData: QuizStructureHost | null, // Pass quizData directly
  setLiveGameState: React.Dispatch<React.SetStateAction<LiveGameState | null>>
) {
  const processPlayerAnswer = useCallback(
    // ... (existing processPlayerAnswer logic remains unchanged) ...
    (
      playerId: string,
      submittedPayload: PlayerAnswerPayload,
      answerTimestamp: number | undefined
    ) => {
      const timestamp = answerTimestamp || Date.now();

      setLiveGameState((prev) => {
        if (!prev || !quizData) {
          console.error(
            "[AnswerProcHook] Cannot process answer, previous state or quizData is null"
          );
          return prev;
        }

        const hostQuestion = getCurrentHostQuestion(
          quizData,
          prev.currentQuestionIndex
        );

        if (
          prev.status !== "QUESTION_SHOW" ||
          !hostQuestion ||
          hostQuestion.type === "content" ||
          submittedPayload.questionIndex !== prev.currentQuestionIndex
        ) {
          // console.log(`[AnswerProcHook] Answer rejected inside setter - Invalid state, hostQuestion, or index.`);
          return prev;
        }

        const currentPlayerState = prev.players[playerId];
        if (
          !currentPlayerState ||
          currentPlayerState.answers.some(
            (a) => a.questionIndex === prev.currentQuestionIndex
          )
        ) {
          // console.log(`[AnswerProcHook] Answer rejected inside setter - Duplicate or invalid player: ${playerId}`);
          return prev;
        }

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

        switch (submittedPayload.type) {
          case "quiz":
          case "survey":
            playerChoice = submittedPayload.choice;
            // Set text based on chosen option for quiz/survey for easier display later
            playerText =
              hostQuestion.choices[playerChoice as number]?.answer ?? null;
            if (hostQuestion.type === "survey") currentStatus = "SUBMITTED"; // Surveys are just submitted
            break;
          case "jumble":
            playerChoice = submittedPayload.choice;
            // Construct text representation of player's jumble order? Optional.
            break;
          case "open_ended":
            playerText = submittedPayload.text;
            playerChoice = null; // No single 'choice' index
            break;
        }

        if (hostQuestion.type !== "survey") {
          // Scoring only applies to non-survey
          if (isCorrect) {
            currentStatus = "CORRECT";
            basePoints = calculateBasePoints(
              reactionTimeMs,
              hostQuestion.time ?? 20000
            );
            finalPointsEarned = applyPointsMultiplier(
              basePoints,
              hostQuestion.pointsMultiplier
            );
          } else {
            currentStatus = "WRONG";
            finalPointsEarned = 0;
            basePoints = 0;
          }

          pointsDataResult = {
            totalPointsWithBonuses: finalPointsEarned, // Simplification: Assume no streak bonus calculation here yet
            questionPoints: finalPointsEarned,
            answerStreakPoints: {
              streakLevel: isCorrect ? currentPlayerState.currentStreak + 1 : 0,
              previousStreakLevel: currentPlayerState.currentStreak,
            },
            lastGameBlockIndex: prev.currentQuestionIndex,
          };
        } else {
          // Ensure pointsDataResult is null for surveys or provide a zeroed-out version if needed downstream
          pointsDataResult = {
            totalPointsWithBonuses: 0,
            questionPoints: 0,
            answerStreakPoints: {
              streakLevel: currentPlayerState.currentStreak,
              previousStreakLevel: currentPlayerState.currentStreak,
            }, // Streak unchanged
            lastGameBlockIndex: prev.currentQuestionIndex,
          };
        }

        const newAnswerRecord: PlayerAnswerRecord = {
          questionIndex: prev.currentQuestionIndex,
          blockType: submittedPayload.type,
          choice: playerChoice,
          text: playerText,
          reactionTimeMs: reactionTimeMs,
          answerTimestamp: timestamp,
          isCorrect: hostQuestion.type === "survey" ? false : isCorrect, // Surveys are never 'correct'
          status: currentStatus,
          basePoints: basePoints,
          finalPointsEarned: finalPointsEarned,
          pointsData: pointsDataResult,
        };

        const updatedPlayer: LivePlayerState = {
          ...currentPlayerState,
          totalScore: currentPlayerState.totalScore + finalPointsEarned,
          lastActivityAt: timestamp,
          currentStreak:
            hostQuestion.type === "survey"
              ? currentPlayerState.currentStreak // Streak doesn't change for survey
              : isCorrect
              ? currentPlayerState.currentStreak + 1
              : 0,
          answers: [...currentPlayerState.answers, newAnswerRecord],
          correctCount:
            currentPlayerState.correctCount +
            (isCorrect && hostQuestion.type !== "survey" ? 1 : 0),
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
        return newState;
      });
    },
    [quizData, setLiveGameState]
  );

  const processTimeUpForPlayer = useCallback(
    // ... (existing processTimeUpForPlayer logic remains unchanged) ...
    (playerId: string) => {
      setLiveGameState((prev) => {
        if (!prev || !quizData) return prev;
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

        const questionTime = hostQuestion.time ?? 0;
        const timeoutAnswer: PlayerAnswerRecord = {
          questionIndex: currentIdx,
          blockType: hostQuestion.type,
          choice: null,
          text: null,
          reactionTimeMs: questionTime, // Timeout means full time elapsed
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
          ...player,
          answers: [...player.answers, timeoutAnswer],
          currentStreak: 0, // Timeout breaks streak
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
  );

  return {
    processPlayerAnswer,
    processTimeUpForPlayer,
    calculateAnswerStats, // <-- EXPORT the new function
  };
}
