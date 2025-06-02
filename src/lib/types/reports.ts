// File: @/src/lib/types/reports.ts
// Purpose: Defines TypeScript types for report-related data structures.

export interface QuizInfoFromSummary {
  quizId: string;
  title: string; // This seems to be the actual Quiz title
  creatorUserId: string;
  creatorUsername: string;
}

export interface SessionSummaryDto {
  type?: string; // e.g., "LIVE" - can be used to determine session characteristics
  name: string; // Session name, potentially different from quiz title, might include date/time context
  controllersCount: number; // Participant count
  questionsCount: number; // Question count
  averageAccuracy: number; // For the accuracy chart
  time: number; // Start time (epoch milliseconds)
  endTime?: number | null; // End time (epoch milliseconds)
  username: string; // Host of the session
  hostId: string;
  isScored?: boolean;
  hasCorrectness?: boolean;
  quizInfo: QuizInfoFromSummary;
  scoredBlocksWithAnswersCount?: number;
  averageTime?: number; // Not directly used in Overview card yet
  averageScore?: number; // Not directly used in Overview card yet (API doesn't have this directly, maybe needs calculation from player scores later)
  // sessionId is implicitly known by the page, but can be added if needed globally
}
