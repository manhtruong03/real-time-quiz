// src/lib/types/game-state.ts
import type { GameBlock, PointsData } from "./websocket-protocol";
import type { QuestionAnswerStats } from "./stats";

export interface PlayerAnswerRecord {
  questionIndex: number;
  blockType: GameBlock["type"];
  choice: number | number[] | null;
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
  avatarId: string | null;

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

// Define the structure for the snapshot
export interface PlayerScoreRankSnapshot {
  score: number;
  rank: number;
}

export interface QuestionEventLogEntry {
  questionIndex: number; // The 0-based index of the question in the quiz
  startedAt: number | null;
  endedAt: number | null;
  // More granular statuses can be added if needed for SessionGameSlideDto.status mapping
  status:
    | "PENDING"
    | "ACTIVE"
    | "SKIPPED"
    | "ENDED"
    | "STATS_SHOWN"
    | "SCOREBOARD_SHOWN";
}

export interface LiveGameState {
  gamePin: string;
  quizId: string;
  hostUserId: string;
  status:
    | "LOBBY"
    | "QUESTION_GET_READY"
    | "QUESTION_SHOW"
    | "SHOWING_STATS"
    | "SHOWING_SCOREBOARD"
    | "PODIUM"
    | "ENDED";

  currentQuestionIndex: number;
  players: Record<string, LivePlayerState>;

  currentQuestionStartTime: number | null;
  currentQuestionEndTime: number | null;
  sessionStartTime: number;
  allowLateJoin: boolean;

  powerUpsEnabled: boolean;

  currentQuestionStats: QuestionAnswerStats | null;

  /** Stores a snapshot of player scores and ranks just BEFORE the results of the last question were finalized. Used for scoreboard animations. */
  previousPlayerStateForScoreboard: Record<
    string,
    PlayerScoreRankSnapshot
  > | null;

  /** Log of events for each question/slide presented during the game. */
  questionEventsLog: QuestionEventLogEntry[];
}
