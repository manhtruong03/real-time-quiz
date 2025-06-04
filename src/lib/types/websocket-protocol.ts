// src/lib/types/websocket-protocol.ts

// --- Base Interface for Question Data (Phase 2 - WS Question Detail) ---
// Based on docs/data_structures/phase2_ws_question_detail.md
export interface QuestionBase {
  gameBlockIndex: number;
  totalGameBlockCount: number;
  title: string; // Can contain HTML
  video?: {
    startTime?: number;
    endTime?: number;
    service?: string; // e.g., "youtube"
    fullUrl?: string;
    id?: string;
  };
  image?: string | null; // Main image URL
  imageMetadata?: {
    id?: string;
    altText?: string;
    contentType?: string;
    origin?: string;
    externalRef?: string;
    resources?: string;
    width?: number;
    height?: number;
  } | null;
  media?: Array<{
    type?: string; // e.g., "image", "giphy_gif", "background_image"
    url?: string;
    id?: string; // For background_image
    altText?: string;
    contentType?: string;
    width?: number;
    height?: number;
    zIndex?: number;
    isColorOnly?: boolean;
    origin?: string;
    externalRef?: string;
    resources?: string;
  }>;
  timeAvailable: number; // Time limit in ms
  timeRemaining: number; // Remaining time when sent (ms)
  getReadyTimeAvailable?: number; // Optional get ready time
  getReadyTimeRemaining?: number;
  pointsMultiplier?: number; // Not present for survey
  numberOfAnswersAllowed?: number; // Usually 1
  questionIndex: number; // Often same as gameBlockIndex
  gameBlockType: string; // e.g., "quiz", "jumble"
  currentQuestionAnswerCount?: number; // How many have answered
  // Optional fields from examples:
  layout?: string; // e.g., "CLASSIC"
  questionRestricted?: boolean;
  extensiveMode?: boolean;
}

// --- Specific Question Types for Player (Phase 2) ---
export interface QuizChoicePlayer {
  answer?: string; // Text choice
  image?: {
    // Image choice (metadata received by player)
    id?: string;
    altText?: string;
    contentType?: string;
    url?: string; // URL might be derived by frontend if only ID provided
    width?: number;
    height?: number;
    origin?: string;
    externalRef?: string;
    resources?: string;
  };
}

export interface QuestionQuiz extends QuestionBase {
  type: "quiz";
  numberOfChoices: number;
  choices: QuizChoicePlayer[]; // Player receives choices without 'correct' field
}

export interface JumbleChoicePlayer {
  answer: string;
}

export interface QuestionJumble extends QuestionBase {
  type: "jumble";
  numberOfChoices: number;
  choices: JumbleChoicePlayer[]; // Player receives randomized choices
}

export interface SurveyChoicePlayer {
  answer: string;
}

export interface QuestionSurvey extends QuestionBase {
  type: "survey";
  numberOfChoices: number;
  choices: SurveyChoicePlayer[];
  pointsMultiplier?: never; // Explicitly exclude for survey
}

export interface QuestionOpenEnded extends QuestionBase {
  type: "open_ended";
  choices?: never; // No choices sent to player
  numberOfChoices?: 0;
}

export interface ContentBlock extends QuestionBase {
  type: "content";
  description: string;
  choices?: never;
  numberOfChoices?: 0;
  pointsMultiplier?: never;
  numberOfAnswersAllowed?: never;
}

// --- Union Type for any Game Block received by Player ---
export type GameBlock =
  | QuestionQuiz
  | QuestionJumble
  | QuestionOpenEnded
  | QuestionSurvey
  | ContentBlock;

// --- Type Guards ---
export function isQuizQuestion(block: GameBlock): block is QuestionQuiz {
  return block.type === "quiz";
}
export function isJumbleQuestion(block: GameBlock): block is QuestionJumble {
  return block.type === "jumble";
}
export function isOpenEndedQuestion(
  block: GameBlock
): block is QuestionOpenEnded {
  return block.type === "open_ended";
}
export function isSurveyQuestion(block: GameBlock): block is QuestionSurvey {
  return block.type === "survey";
}
export function isContentBlock(block: GameBlock): block is ContentBlock {
  return block.type === "content";
}

// --- Outgoing Answer Payloads (Phase 3) ---
export interface AnswerPayloadBase {
  questionIndex: number;
}

export interface AnswerPayloadQuiz extends AnswerPayloadBase {
  type: "quiz" | "survey"; // Combined as format is identical
  choice: number; // 0-based index of the choice selected by player
}

export interface AnswerPayloadJumble extends AnswerPayloadBase {
  type: "jumble";
  // Array of original 0-based indices in the order submitted by the player
  choice: number[];
}

export interface AnswerPayloadOpenEnded extends AnswerPayloadBase {
  type: "open_ended";
  text: string; // The text entered by the player
}

export type PlayerAnswerPayload =
  | AnswerPayloadQuiz
  | AnswerPayloadJumble
  | AnswerPayloadOpenEnded;

// --- Incoming Result Payload (Phase 4) ---
export interface PointsData {
  totalPointsWithBonuses: number;
  questionPoints: number;
  answerStreakPoints: {
    streakLevel: number;
    previousStreakLevel: number;
  };
  lastGameBlockIndex: number;
}

export interface ResultPayloadBase {
  rank: number;
  totalScore: number;
  pointsData: PointsData;
  hasAnswer: boolean;
  type: GameBlock["type"]; // 'quiz', 'jumble', 'survey', 'open_ended'
}

export interface ResultPayloadQuiz extends ResultPayloadBase {
  type: "quiz";
  choice: number; // Player's choice index
  points: number;
  isCorrect: boolean;
  text: string | null; // Text of the player's choice
  correctChoices: number[]; // Array of correct choice index(es)
}

export interface ResultPayloadJumble extends ResultPayloadBase {
  type: "jumble";
  choice: number[]; // Player's submitted order
  points: number;
  isCorrect: boolean;
  text: string | null; // Pipe-separated text of player's order
  correctChoices: number[]; // Correct order indices
}

export interface ResultPayloadSurvey extends ResultPayloadBase {
  type: "survey";
  choice: number; // Player's choice index
  text: string | null; // Text of the chosen option
  points?: never;
  isCorrect?: never;
  correctChoices?: never;
}

export interface ResultPayloadOpenEnded extends ResultPayloadBase {
  type: "open_ended";
  points: number;
  isCorrect: boolean;
  text: string | null; // Player's submitted text
  choice?: number | string | null;
  correctTexts: string[]; // Array of acceptable correct answers
}

export type QuestionResultPayload =
  | ResultPayloadQuiz
  | ResultPayloadJumble
  | ResultPayloadSurvey
  | ResultPayloadOpenEnded;

// --- Payload for Participant Left Event (Server -> Host) ---
export interface ParticipantLeftPayload {
  playerCount: number; // Updated count of active players after this participant left
  affectedId: string; // The Client ID (CID) of the player who left
  type: "PARTICIPANT_LEFT"; // Message type identifier
  hostId: string; // The host's WebSocket client ID (for context/verification)
}
