// src/lib/types/quiz-structure.ts
import type { GameBlock } from "./websocket-protocol"; // Import base type

// --- Host-specific Quiz Structure (Phase 1 REST) ---
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
