// src/lib/types.ts
// --- KEEP Existing types that were NOT moved ---
export interface AnswerOptionIndicatorProps {
  index: number;
  color: string;
  Icon: React.ElementType;
}

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
  date: Date;
}

export interface ExistingQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}
// This seems redundant if `ExistingQuestion` is used. Consolidate if possible.
export interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

// Keep GameAssetsState here or move to context file? Keeping here for now.
import { Background, Sound, Avatar, PowerUp } from "./types/assets";
export interface GameAssetsState {
  backgrounds: Background[];
  sounds: Sound[];
  avatars: Avatar[];
  powerups: PowerUp[];
  isLoading: boolean;
  error: string | null;
  preloadedPaths: Set<string>;
}

// Re-export from new modules for easier access if desired, or update imports directly
export * from "./types/websocket-protocol";
export * from "./types/game-state";
export * from "./types/quiz-structure";
export * from "./types/assets"; // If index file is used

// Add DTO export
export * from "./types/stats";
export * from "./dto/session-finalization.dto";

// --- Remove the definitions that were moved ---
