// src/hooks/quiz-editor/creator-utils/defaultQuizValues.ts
import type {
  QuestionHost,
  QuizStructureHost,
  VideoDetailsHost, // Assuming VideoDetailsHost is defined in quiz-structure
} from "@/src/lib/types/quiz-structure";
import { createDefaultQuestion as utilCreateDefaultQuestion } from "@/src/lib/game-utils/quiz-creation";

// Re-export or wrap createDefaultQuestion if needed, or it can be imported directly
// For now, let's assume it's used directly where needed by other creator utils or the main hook.

export const createDefaultQuizShell = (): QuizStructureHost => ({
  uuid: "", // Will be set by backend upon save
  creator: "", // Will be set by backend
  creator_username: "", // Will be set by backend
  visibility: 0, // Default to Private (0)
  title: "",
  description: "",
  quizType: "quiz", // Default quizType
  cover: "", // URL string, initially empty or null
  coverImageFile: null,
  coverImageUploadKey: null,
  lobby_video: {
    youtube: {
      id: "",
      startTime: 0.0,
      endTime: 0.0,
      service: "youtube",
      fullUrl: "",
    } as VideoDetailsHost, // Added type assertion
  },
  questions: [],
  isValid: false, // Backend might set this
  playAsGuest: true, // Default
  type: "quiz", // Default, seems redundant with quizType but present in mock
  created: Date.now(),
  modified: Date.now(),
  tags: [], // Initialize tags as empty array
});

// If you need to customize createDefaultQuestion further for the editor context,
// you could wrap it here. Otherwise, it can be imported from lib/game-utils.
export const createDefaultEditorQuestion = (
  type: QuestionHost["type"],
  isTrueFalse: boolean = false
): QuestionHost => {
  const newQuestion = utilCreateDefaultQuestion(type, isTrueFalse);
  // Ensure editor-specific fields like imageFile and questionImageUploadKey are present
  return {
    ...newQuestion,
    imageFile: newQuestion.imageFile || null,
    questionImageUploadKey: newQuestion.questionImageUploadKey || null,
  };
};
