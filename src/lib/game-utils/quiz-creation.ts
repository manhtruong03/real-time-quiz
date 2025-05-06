// src/lib/game-utils/quiz-creation.ts
import type { QuestionHost, ChoiceHost } from "@/src/lib/types/quiz-structure"; // Import types

// Default time limit for new questions (in milliseconds)
const DEFAULT_TIME_LIMIT = 20000; // 20 seconds

// Helper to create a default choice structure
const createDefaultChoice = (
  isCorrect: boolean = false,
  answer: string = ""
): ChoiceHost => ({
  answer: answer,
  image: undefined, // Default to no image
  correct: isCorrect,
});

/**
 * Creates a default QuestionHost object based on the provided type.
 * @param type - The type of question/slide to create.
 * @param isTrueFalse - Optional flag to specifically create a True/False quiz variant.
 * @returns A default QuestionHost object.
 */
export const createDefaultQuestion = (
  type: QuestionHost["type"],
  isTrueFalse: boolean = false // Flag for True/False variant
): QuestionHost => {
  const baseQuestion: Partial<QuestionHost> = {
    type: type,
    question: "",
    time: DEFAULT_TIME_LIMIT,
    pointsMultiplier: 1,
    choices: [],
    image: null,
    video: {
      // Default empty video object
      startTime: 0.0,
      endTime: 0.0,
      service: "youtube",
      fullUrl: "",
    },
    media: [],
  };

  switch (type) {
    case "quiz":
      if (isTrueFalse) {
        baseQuestion.question = "True or False: ...";
        baseQuestion.choices = [
          createDefaultChoice(true, "True"), // Default True as correct
          createDefaultChoice(false, "False"),
        ];
      } else {
        // Default 4-choice quiz
        baseQuestion.question = "Enter your question...";
        baseQuestion.choices = [
          createDefaultChoice(true), // Default first option as correct
          createDefaultChoice(false),
          createDefaultChoice(false),
          createDefaultChoice(false),
        ];
      }
      break;

    case "jumble":
      baseQuestion.question = "Place these items in the correct order...";
      // Jumble requires 4 options, all marked 'correct' structurally
      baseQuestion.choices = [
        createDefaultChoice(true, "Option 1"),
        createDefaultChoice(true, "Option 2"),
        createDefaultChoice(true, "Option 3"),
        createDefaultChoice(true, "Option 4"),
      ];
      baseQuestion.time = 60000; // Jumble often has longer time
      break;

    case "survey":
      baseQuestion.question = "Ask an opinion question...";
      baseQuestion.pointsMultiplier = 0; // Surveys don't award points
      // Default 2 options, all 'correct' structurally
      baseQuestion.choices = [
        createDefaultChoice(true, "Option A"),
        createDefaultChoice(true, "Option B"),
      ];
      break;

    case "open_ended":
      baseQuestion.question = "Ask an open-ended question...";
      // Defines the acceptable answer(s)
      baseQuestion.choices = [createDefaultChoice(true, "Correct Answer")];
      break;

    case "content":
      baseQuestion.title = "Informational Slide Title";
      baseQuestion.description = "Add your content here...";
      baseQuestion.time = 0; // Content slides are not timed
      baseQuestion.pointsMultiplier = 0;
      baseQuestion.choices = []; // No choices for content
      delete baseQuestion.question; // Remove question field for content
      break;

    default:
      console.warn(
        `Unknown question type requested: ${type}. Creating generic quiz.`
      );
      baseQuestion.type = "quiz";
      baseQuestion.question = "Enter your question...";
      baseQuestion.choices = [createDefaultChoice(true)];
      break;
  }

  // Ensure all required fields for QuestionHost are present
  return baseQuestion as QuestionHost; // Cast needed as we build it partially
};
