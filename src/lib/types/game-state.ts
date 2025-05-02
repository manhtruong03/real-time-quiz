// src/lib/types/game-state.ts
import type { GameBlock, PointsData } from "./websocket-protocol";

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
}

export interface LivePlayerState {
  cid: string;
  nickname: string;
  // --- MODIFIED ---
  // Store the avatar_id (UUID string) directly
  avatarId: string | null;
  // --- END MODIFIED ---

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
  players: Record<string, LivePlayerState>;

  currentQuestionStartTime: number | null;
  currentQuestionEndTime: number | null;
  sessionStartTime: number;
  allowLateJoin: boolean;

  powerUpsEnabled: boolean;
}
