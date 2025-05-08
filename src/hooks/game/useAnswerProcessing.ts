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
import { calculateUpdatedRankings } from "@/src/lib/game-utils/quiz-ranking";
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
    (
      playerId: string,
      submittedPayload: PlayerAnswerPayload,
      answerTimestamp: number | undefined // Timestamp from WS message or Date.now()
    ) => {
      // Use timestamp from message or generate host-side timestamp
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
          console.log(
            `[AnswerProcHook] Answer rejected for player ${playerId} - Invalid state (${prev.status}), missing host question, content block, or mismatched index (${submittedPayload.questionIndex} vs ${prev.currentQuestionIndex}).`
          );
          return prev; // Ignore answer if game state is wrong or question doesn't match
        }

        const currentPlayerState = prev.players[playerId];
        // Check if player exists and hasn't already answered this question
        if (
          !currentPlayerState ||
          currentPlayerState.answers.some(
            (a) => a.questionIndex === prev.currentQuestionIndex
          )
        ) {
          console.log(
            `[AnswerProcHook] Answer rejected for player ${playerId} - Duplicate or invalid player.`
          );
          return prev; // Ignore answer if player doesn't exist or already answered
        }

        // --- Start Score Calculation ---
        const isCorrect = checkAnswerCorrectness(
          hostQuestion,
          submittedPayload
        );
        let basePoints = 0;
        let finalPointsEarned = 0;
        let currentStatus: PlayerAnswerRecord["status"] = "SUBMITTED"; // Default status

        // Calculate reaction time
        const reactionTimeMs = prev.currentQuestionStartTime
          ? Math.max(0, timestamp - prev.currentQuestionStartTime) // Ensure non-negative
          : hostQuestion.time ?? 0; // Fallback if start time is missing

        // *** CORRECTED CONDITION ***
        // We already know hostQuestion.type is NOT 'content' due to the earlier guard clause.
        // We only need to check if it's NOT 'survey' to apply scoring.
        if (hostQuestion.type !== "survey") {
          // Scoring applies to 'quiz', 'jumble', 'open_ended'
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
            console.log(
              `[AnswerProcHook] Correct Answer | Player: ${playerId}, QIdx: ${prev.currentQuestionIndex}, ReactTime: ${reactionTimeMs}ms, BasePts: ${basePoints}, FinalPts: ${finalPointsEarned}`
            );
          } else {
            currentStatus = "WRONG";
            finalPointsEarned = 0;
            basePoints = 0;
            console.log(
              `[AnswerProcHook] Incorrect Answer | Player: ${playerId}, QIdx: ${prev.currentQuestionIndex}`
            );
          }
        } else {
          // This block now ONLY handles 'survey' type
          currentStatus = "SUBMITTED";
          finalPointsEarned = 0;
          basePoints = 0;
          console.log(
            `[AnswerProcHook] Survey Answer | Player: ${playerId}, QIdx: ${prev.currentQuestionIndex}`
          );
        }
        // --- End Score Calculation ---

        // --- Prepare PointsData ---
        // (Streak logic remains, but score calculation now uses finalPointsEarned)
        const currentStreak = currentPlayerState.currentStreak ?? 0;
        const newStreak =
          isCorrect && hostQuestion.type !== "survey" ? currentStreak + 1 : 0;
        const pointsDataResult: PointsData = {
          totalPointsWithBonuses: finalPointsEarned, // For Stage 1, bonus = 0
          questionPoints: finalPointsEarned, // Points for this question
          answerStreakPoints: {
            streakLevel: newStreak,
            previousStreakLevel: currentStreak,
          },
          lastGameBlockIndex: prev.currentQuestionIndex,
        };
        // --- End Prepare PointsData ---

        // --- Prepare Answer Record ---
        let playerChoice: PlayerAnswerRecord["choice"] = null;
        let playerText: PlayerAnswerRecord["text"] = null;
        switch (submittedPayload.type) {
          case "quiz":
          case "survey":
            playerChoice = submittedPayload.choice;
            playerText =
              hostQuestion.choices[playerChoice as number]?.answer ?? null;
            break;
          case "jumble":
            playerChoice = submittedPayload.choice;
            // Text could be constructed here if needed, e.g., pipe-separated
            break;
          case "open_ended":
            playerText = submittedPayload.text;
            playerChoice = null;
            break;
        }

        const newAnswerRecord: PlayerAnswerRecord = {
          questionIndex: prev.currentQuestionIndex,
          blockType: submittedPayload.type,
          choice: playerChoice,
          text: playerText,
          reactionTimeMs: reactionTimeMs,
          answerTimestamp: timestamp,
          isCorrect: hostQuestion.type === "survey" ? false : isCorrect,
          status: currentStatus,
          basePoints: basePoints, // Store calculated base points
          finalPointsEarned: finalPointsEarned, // Store final points
          pointsData: pointsDataResult,
        };
        // --- End Prepare Answer Record ---

        // --- Update Player State ---
        const updatedPlayer: LivePlayerState = {
          ...currentPlayerState,
          totalScore: currentPlayerState.totalScore + finalPointsEarned, // Score updated here
          lastActivityAt: timestamp,
          currentStreak: newStreak,
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
        // --- End Update Answering Player State ---

        // --- Create intermediate state with the updated player ---
        const intermediatePlayersMap = {
          ...prev.players,
          [playerId]: updatedPlayer,
        };

        // *** === NEW: Calculate and Apply Ranks === ***
        // Calculate ranks based on the state *including* the latest score update
        const playersWithUpdatedRanks = calculateUpdatedRankings(
          intermediatePlayersMap
        );
        // *** === END NEW === ***

        // --- Update Game State with updated player and ranks ---
        const newState: LiveGameState = {
          ...prev,
          players: playersWithUpdatedRanks, // Use the map with updated ranks
        };
        // --- End Update Game State ---

        console.log(
          `[AnswerProcHook] Player state updated for ${playerId} and ranks recalculated.`
        );

        return newState; // Return the final new game state with updated ranks
      }); // End setLiveGameState
    },
    [quizData, setLiveGameState] // Dependencies remain the same
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
          return prev; // Don't process timeout if already answered or disconnected

        console.log(
          `[AnswerProcHook] Processing timeout for player ${playerId} on question ${currentIdx}`
        );

        const questionTime = hostQuestion.time ?? 0;
        const timeoutAnswer: PlayerAnswerRecord = {
          questionIndex: currentIdx,
          blockType: hostQuestion.type,
          choice: null,
          text: null,
          reactionTimeMs: questionTime, // Timeout means full time elapsed
          answerTimestamp: Date.now(),
          isCorrect: false,
          status: "TIMEOUT", // Set status to TIMEOUT
          basePoints: 0,
          finalPointsEarned: 0,
          pointsData: {
            // Ensure pointsData is not null
            totalPointsWithBonuses: 0,
            questionPoints: 0,
            answerStreakPoints: {
              streakLevel: 0, // Timeout breaks streak
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
          lastActivityAt: Date.now(), // Update activity time
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
    calculateAnswerStats, // Keep this exported for later stages
  };
}
