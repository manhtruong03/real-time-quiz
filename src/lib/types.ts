// src/lib/types.ts

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
    id?: string; // From open_ended example
  };
  image?: string | null; // Main image URL
  imageMetadata?: {
    // Added from an example, may not be in all Phase 2 messages
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
    // Additional media array
    type?: string; // e.g., "image", "giphy_gif", "background_image"
    url?: string;
    // Add other potential media fields if necessary based on protocol doc examples
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
  extensiveMode?: boolean; // Seen in one example
}

// --- Specific Question Types (Extending Base) ---

// Interface for Quiz Choices (Player receives this)
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
    // Add other relevant metadata fields if needed by UI
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

// Interface for Jumble Choices (Player receives this - order randomized)
export interface JumbleChoicePlayer {
  answer: string;
}

export interface QuestionJumble extends QuestionBase {
  type: "jumble";
  numberOfChoices: number;
  choices: JumbleChoicePlayer[]; // Player receives randomized choices
}

// Interface for Survey Choices (Player receives this)
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

// Interface for Content Block
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
  | ContentBlock; // Added ContentBlock

// --- Outgoing Answer Payloads (Phase 3 - Player WS Answer Detail) ---
// Based on docs/data_structures/phase3_ws_answer_detail.md

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
  // The indices refer to the order *as received by the player* in Phase 2.
  choice: number[];
}

export interface AnswerPayloadOpenEnded extends AnswerPayloadBase {
  type: "open_ended";
  text: string; // The text entered by the player
}

export type PlayerAnswerPayload =
  | AnswerPayloadQuiz // Includes Survey answers now
  | AnswerPayloadJumble
  | AnswerPayloadOpenEnded;

// --- Incoming Result Payload (Phase 4 - WS Result Detail) ---
// Based on docs/data_structures/phase4_ws_result_detail.md

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
  text: string; // Text of the player's choice
  correctChoices: number[]; // Array of correct choice index(es)
}

export interface ResultPayloadJumble extends ResultPayloadBase {
  type: "jumble";
  choice: number[]; // Player's submitted order (indices relative to *received* order)
  points: number;
  isCorrect: boolean;
  text: string; // Pipe-separated text of player's order
  // Correct order (indices relative to *original* definition in Phase 1)
  correctChoices: number[];
}

export interface ResultPayloadSurvey extends ResultPayloadBase {
  type: "survey";
  choice: number; // Player's choice index
  text: string; // Text of the chosen option
  // Surveys don't have points, correctness, or correctChoices
  points?: never;
  isCorrect?: never;
  correctChoices?: never;
}

export interface ResultPayloadOpenEnded extends ResultPayloadBase {
  type: "open_ended";
  points: number;
  isCorrect: boolean;
  text: string; // Player's submitted text
  // 'choice' field seems inconsistent (-4?), rely on isCorrect/correctTexts
  choice?: number | string | null; // Or omit if not reliably used
  correctTexts: string[]; // Array of acceptable correct answers
}

export type QuestionResultPayload =
  | ResultPayloadQuiz
  | ResultPayloadJumble
  | ResultPayloadSurvey
  | ResultPayloadOpenEnded;

// --- Existing types from original file (if any) ---
// Keep these if they are still used elsewhere, otherwise remove or refactor.
export interface ExistingQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

// This seems redundant if `ExistingQuestion` is used, or vice-versa. Consolidate if possible.
export interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

// --- Potentially new types needed ---
// Add any other types that might be required by components based on the new structure

// Example: Type for the overall quiz structure fetched in Phase 1
// Based on docs/data_structures/phase1_rest_quiz_structure.json
// Note: This is the *host-side* structure, containing correct answers.
export interface ChoiceHost {
  answer?: string;
  image?: {
    id: string;
    altText?: string;
    contentType?: string;
    url?: string; // May be derived by host/frontend
    // Other metadata...
  };
  correct: boolean; // HOST HAS THIS
}
export interface QuestionHost {
  type: GameBlock["type"];
  question?: string; // For quiz, jumble, survey, open_ended
  title?: string; // For content
  description?: string; // For content
  time?: number; // For timed questions
  pointsMultiplier?: number;
  choices: ChoiceHost[]; // Host sees choices WITH 'correct' field
  image?: string | null;
  video?: {
    /* ... */
  };
  media?: Array<{
    /* ... */
  }>;
  // Other fields specific to host view if needed
}

export interface QuizStructureHost {
  uuid: string;
  creator: string;
  creator_username: string;
  visibility: number;
  title: string;
  description: string;
  quizType: string;
  cover: string;
  lobby_video?: {
    /* ... */
  };
  questions: QuestionHost[]; // Array of host-specific question structures
  isValid: boolean;
  playAsGuest: boolean;
  type: string; // Seems redundant with quizType
  created: number;
  modified: number;
}

// --- UI Specific Types (Keep if still used) ---
export interface AnswerOptionIndicatorProps {
  index: number; // 0, 1, 2, 3
  color: string;
  Icon: React.ElementType; // Lucide icon component
}

// Keep User and QuizResult if they are used for profile/leaderboard etc.
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  score: number;
  quizzesTaken: number;
}

export interface QuizResult {
  id: string;
  userId: string;
  category: string;
  difficulty: string;
  score: number;
  totalQuestions: number;
  timeSpent: number;
  date: Date; // Consider using number (timestamp) or string (ISO) for consistency
}

// Type guard example (useful for handling different block types)
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
