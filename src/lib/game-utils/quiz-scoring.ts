// src/lib/game-utils/quiz-scoring.ts
import { QuestionHost, PlayerAnswerPayload } from "@/src/lib/types"; // Import necessary types

/**
 * Calculates the base points awarded for a correct answer based on time.
 * Score decreases linearly from basePointsMax to 0 as reaction time increases.
 * @param reactionTimeMs - Time taken by the player in milliseconds.
 * @param timeAvailableMs - Total time available for the question in milliseconds.
 * @param basePointsMax - Maximum base points possible (typically 1000).
 * @returns The calculated base points (rounded, non-negative).
 */
export const calculateBasePoints = (
  reactionTimeMs: number,
  timeAvailableMs: number,
  basePointsMax: number = 1000
): number => {
  // If question isn't timed or reaction time is invalid, return 0 points.
  if (timeAvailableMs <= 0 || reactionTimeMs < 0) return 0;

  // Ensure reaction time doesn't exceed available time for calculation
  const clampedReactionTime = Math.min(reactionTimeMs, timeAvailableMs);

  // Calculate the time factor (ranges from 1 down to 0)
  // Points decrease linearly based on how much time was used.
  const timeFactor = 1 - clampedReactionTime / timeAvailableMs;

  // Calculate points
  const points = basePointsMax * timeFactor;

  // Return rounded, non-negative points
  return Math.max(0, Math.round(points)); // Ensure points aren't negative
};

/**
 * Calculates the final points earned for an answer, considering multipliers.
 * @param basePoints - The base points calculated from timing/correctness.
 * @param pointsMultiplier - The multiplier for the question (e.g., 1, 2, or 0).
 * @returns The final points earned for the answer.
 */
export const applyPointsMultiplier = (
  basePoints: number,
  pointsMultiplier: number | undefined | null
): number => {
  // Default to 1 if multiplier is null or undefined, but treat 0 as 0
  const multiplier =
    pointsMultiplier === null || pointsMultiplier === undefined
      ? 1
      : pointsMultiplier;
  return Math.round(basePoints * multiplier);
};

/**
 * Checks if a submitted player answer is correct based on the host question data.
 * @param hostQuestion - The full question data including correct answers (from QuizStructureHost).
 * @param submittedPayload - The answer payload sent by the player.
 * @returns True if the answer is correct, false otherwise.
 */
export const checkAnswerCorrectness = (
  hostQuestion: QuestionHost | null,
  submittedPayload: PlayerAnswerPayload // Use the specific DTO type
): boolean => {
  if (
    !hostQuestion ||
    hostQuestion.type === "content" ||
    hostQuestion.type === "survey"
  ) {
    return false; // Content/Survey questions aren't 'correct' in scoring sense
  }

  switch (submittedPayload.type) {
    case "quiz": {
      const choiceIndex = submittedPayload.choice;
      // Ensure choiceIndex is within bounds
      if (choiceIndex >= 0 && choiceIndex < hostQuestion.choices.length) {
        return hostQuestion.choices[choiceIndex]?.correct ?? false;
      }
      return false; // Index out of bounds
    }
    case "jumble": {
      // Note: Jumble 'choice' from player uses indices based on the *shuffled* order they received.
      // Host needs to map these back to the original indices to compare with the correct sequence.
      // This mapping requires knowing the shuffled order sent, which complicates a pure function here.
      // **Decision:** Keep correctness check simple for now, assuming 'choice' somehow represents original indices order.
      // TODO: Revisit Jumble correctness check if host needs to reconstruct mapping.
      // This simplified check assumes the *original* indices [0, 1, 2, ...] define correctness
      const correctJumbleOrder = hostQuestion.choices.map((_, i) => i);
      // Compare the player's submitted order of *original* indices against the correct sequence
      return (
        JSON.stringify(submittedPayload.choice) ===
        JSON.stringify(correctJumbleOrder)
      );
    }
    case "open_ended": {
      const playerText = submittedPayload.text;
      const correctTexts = hostQuestion.choices
        .map((c) => c.answer?.trim().toLowerCase())
        .filter(Boolean) as string[];
      // Get defined, trimmed, lowercase correct answers
      // Check if the player's trimmed, lowercase answer is included in the list of correct texts
      return correctTexts.includes(playerText?.trim().toLowerCase() ?? "");
    }
    default:
      return false;
  }
};
