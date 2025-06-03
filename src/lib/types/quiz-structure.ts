// src/lib/types/quiz-structure.ts
// ADD THESE LINES:
// At the top with other imports:
import type { GameBlock } from "./websocket-protocol"; // Already there

// Modify QuizStructureHost
export interface QuizStructureHost {
  uuid: string;
  creator: string;
  creator_username: string;
  visibility: number;
  title: string;
  description: string;
  quizType: string;
  cover: string; // URL for the cover image
  coverImageFile?: File | null;
  coverImageUploadKey?: string | null; // New field for cover image upload key
  lobby_video?: {
    youtube?: VideoDetailsHost;
  };
  questions: QuestionHost[];
  isValid: boolean;
  playAsGuest: boolean;
  type: string;
  created: number;
  modified: number;
  // Potentially add tags here if it's part of the core structure and not just DTO
  tags?: string[];
}

// Modify QuestionHost
export interface QuestionHost {
  id?: string;
  type: GameBlock["type"];
  question?: string | undefined;
  title?: string | undefined;
  description?: string | undefined;
  time?: number;
  pointsMultiplier?: number;
  choices: ChoiceHost[];
  image?: string | null;
  imageFile?: File | null;
  questionImageUploadKey?: string | null; // New field for question image upload key
  video?: VideoDetailsHost | null | undefined;
  media?: MediaItemHost[] | undefined;
}

// No changes needed for VideoDetailsHost, MediaItemHost, ChoiceHost for this step.
// Keep existing definitions:
export interface VideoDetailsHost {
  id?: string;
  startTime?: number;
  endTime?: number;
  service?: string;
  fullUrl?: string;
}

export interface MediaItemHost {
  type?: string;
  url?: string;
  id?: string;
  altText?: string;
  contentType?: string;
  width?: number;
  height?: number;
  zIndex?: number;
  isColorOnly?: boolean;
  origin?: string;
  externalRef?: string;
  resources?: string;
}

export interface ChoiceHost {
  answer?: string | undefined;
  image?:
    | {
        id: string;
        altText?: string;
        contentType?: string;
        url?: string;
        width?: number;
        height?: number;
        origin?: string;
        externalRef?: string;
        resources?: string;
      }
    | undefined;
  correct: boolean;
}
