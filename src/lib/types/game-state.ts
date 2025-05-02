// src/lib/types/game-state.ts
import type { GameBlock, PointsData } from "./websocket-protocol"; // Import from new file

/**
 * Represents the detailed record of a single answer submitted by a player,
 * processed and stored temporarily by the host during the game session.
 */
export interface PlayerAnswerRecord {
  questionIndex: number;
  blockType: GameBlock["type"];
  choice: number | number[] | string | null;
  text?: string | null;
  reactionTimeMs: number;
  answerTimestamp: number;
  isCorrect: boolean;
  status: "CORRECT" | "WRONG" | "TIMEOUT" | "SUBMITTED";
  basePoints: number;
  finalPointsEarned: number;
  pointsData: PointsData | null;
  // usedPowerUpId?: string | null;
  // usedPowerUpContext?: any | null;
}

/**
 * Represents the complete state for a single player managed by the host
 * during an active game session.
 */
export interface LivePlayerState {
  cid: string;
  nickname: string;
  avatar: { id?: number; type?: number; item?: number } | null;
  isConnected: boolean;
  joinedAt: number;
  userId?: string | null;
  lastActivityAt: number;
  playerStatus: "JOINING" | "PLAYING" | "FINISHED" | "DISCONNECTED" | "KICKED";
  joinSlideIndex?: number | null;
  waitingSince?: number | null;
  deviceInfoJson?: any | null;
  totalScore: number;
  rank: number;
  currentStreak: number;
  maxStreak: number;
  lastAnswerTimestamp: number | null;
  answers: PlayerAnswerRecord[];
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  answersCount: number;
  totalReactionTimeMs: number;
}

/**
 * Represents the overall state of the game session managed by the host.
 */
export interface LiveGameState {
  gamePin: string;
  quizId: string;
  hostUserId: string;
  status:
    | "LOBBY"
    | "QUESTION_GET_READY"
    | "QUESTION_SHOW"
    | "QUESTION_RESULT"
    | "PODIUM"
    | "ENDED";
  currentQuestionIndex: number;
  players: Record<string, LivePlayerState>; // Map CID -> Player State
  currentQuestionStartTime: number | null;
  currentQuestionEndTime: number | null;
  sessionStartTime: number;
  allowLateJoin: boolean;
  powerUpsEnabled: boolean;
}
