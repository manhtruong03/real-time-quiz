// src/lib/types/quiz-structure.ts
import type { GameBlock } from "./websocket-protocol"; // Import base type

// --- Video Structure for Host Data ---
// Based on quiz_sample_all_types.js and common video object structures
export interface VideoDetailsHost {
  id?: string; // Optional, can be YouTube ID or internal
  startTime?: number; // Typically float or number
  endTime?: number; // Typically float or number
  service?: string; // e.g., "youtube"
  fullUrl?: string; // Full URL to the video
  // Add any other fields from your mock or expected API response
}

// --- Media Item Structure for Host Data ---
// Based on quiz_sample_all_types.js and general media item properties
export interface MediaItemHost {
  type?: string; // e.g., "image", "video_iframe", "background_image" (as seen in Kahoot WS examples)
  url?: string; // URL if it's an external resource not in media library
  id?: string; // ID if it refers to an item in a media library (e.g., Getty ID, Kahoot media ID)
  altText?: string;
  contentType?: string; // e.g., "image/jpeg", "image/png"
  width?: number;
  height?: number;
  // Fields from potential advanced media items or background images
  zIndex?: number;
  isColorOnly?: boolean; // For backgrounds
  origin?: string; // e.g., "Getty Images"
  externalRef?: string; // e.g., "902452584" (Getty ref)
  resources?: string; // e.g., "Diego Mariottini / EyeEm/EyeEm/Getty Images"
  // Add any other fields from your mock or expected API response for media items
}

// --- Host-specific Quiz Structure (Phase 1 REST) ---
export interface ChoiceHost {
  answer?: string | undefined;
  image?:
    | {
        id: string; // Internal ID or from media library
        altText?: string;
        contentType?: string;
        url?: string; // URL to the image. Can be derived from ID or direct.
        // Other image metadata like width, height, origin if needed
        width?: number;
        height?: number;
        origin?: string;
        externalRef?: string;
        resources?: string;
      }
    | undefined;
  correct: boolean; // HOST HAS THIS
}
export interface QuestionHost {
  type: GameBlock["type"];
  question?: string | undefined; // For quiz, jumble, survey, open_ended
  title?: string | undefined; // For content
  description?: string | undefined; // For content
  time?: number; // For timed questions
  pointsMultiplier?: number;
  choices: ChoiceHost[]; // Host sees choices WITH 'correct' field
  image?: string | null; // URL for the main question image/media (can be Kahoot media URL)
  video?: VideoDetailsHost | null | undefined; // Use the defined VideoDetailsHost type
  media?: MediaItemHost[] | undefined; // Use array of MediaItemHost
}

export interface QuizStructureHost {
  uuid: string;
  creator: string;
  creator_username: string;
  visibility: number;
  title: string;
  description: string;
  quizType: string; // e.g., "quiz", "survey" - general type of the quiz
  cover: string; // URL for the cover image
  lobby_video?: {
    // Lobby video for the entire quiz
    youtube?: VideoDetailsHost; // Can reuse VideoDetailsHost if structure is similar
    // other services?
  };
  questions: QuestionHost[]; // Array of host-specific question structures
  isValid: boolean;
  playAsGuest: boolean;
  type: string; // Seems redundant with quizType? Confirm usage. (Present in Kahoot data)
  created: number; // Creation timestamp (Unix millis)
  modified: number; // Last modified timestamp (Unix millis)
}
