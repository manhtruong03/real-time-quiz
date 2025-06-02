// Existing content of src/lib/types/reports.ts
// Path: @/src/lib/types/reports.ts
// Purpose: Defines TypeScript types for report-related data structures.

import type { ChoiceDTO, VideoDetailDTO } from "@/src/lib/types/api"; // Import necessary types

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

/**
 * Report details for a single player in a game session.
 * Based on components.schemas.PlayerReportItemDto from api-docs.json
 */
export interface PlayerReportItemDto {
  nickname: string;
  rank: number;
  unansweredCount: number;
  averageAccuracy: number; // Represented as a fraction (e.g., 0.75 for 75%)
  averagePoints: number;
  totalPoints: number;
  totalTime: number; // Total reaction time in milliseconds
  averageTime: number; // Average reaction time per answered question in milliseconds
  streakCount: number;
  playerId: string; // Internal Player UUID
  clientId: string; // WebSocket client ID
  answersCount: number; // Total number of questions the player answered
  correctAnswersCount: number;
}

/**
 * Represents the distribution of answers for a specific choice in a question report.
 */
export interface AnswerDistributionDto {
  answerText: string;
  choiceIndex: number;
  status: "CORRECT" | "INCORRECT" | "NO_ANSWER" | string; // Allow for other statuses if API provides
  count: number;
}

/**
 * Represents a single question's report details from a session.
 * This will utilize ChoiceDTO and VideoDetailDTO from '@/src/lib/types/api'.
 */
export interface QuestionReportItemDto {
  slideIndex: number;
  title: string;
  type: string; // e.g., 'content', 'jumble', 'quiz', 'open_ended', 'survey'
  choices: ChoiceDTO[]; // Reusing ChoiceDTO from api.ts
  imageUrl?: string | null;
  video?: VideoDetailDTO | null; // Reusing VideoDetailDTO from api.ts
  totalAnswers: number;
  totalAnsweredControllers: number;
  averageAccuracy?: number | null; // e.g., for quiz, jumble
  averageTime?: number | null; // e.g., for quiz, jumble
  answersDistribution: AnswerDistributionDto[];
}
