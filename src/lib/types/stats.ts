// src/lib/types/stats.ts

/**
 * Represents statistics for a single answer option or category.
 */
export interface AnswerOptionStats {
  count: number; // Number of players who chose this option/category
  percentage: number; // Percentage of players (0-100)
}

/**
 * Statistics structure for questions where answers map to indices or specific keys.
 * Used for: Quiz, Survey, Open-Ended.
 * Keys can be the choice index (as a string) or predefined keys like 'incorrect'.
 */
export interface IndexedAnswerStats {
  [indexOrKey: string]: AnswerOptionStats;
}

/**
 * Statistics structure specifically for Jumble questions.
 */
export interface JumbleAnswerStats {
  correct: AnswerOptionStats;
  incorrect: AnswerOptionStats;
}

/**
 * Union type representing the calculated statistics for a single question,
 * varying based on the question type.
 */
export type QuestionAnswerStats = IndexedAnswerStats | JumbleAnswerStats;
