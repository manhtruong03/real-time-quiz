// src/lib/game-utils/quiz-creation.ts
import type { QuestionHost, ChoiceHost } from "@/src/lib/types/quiz-structure";
import type {
  VideoSchemaType,
  MediaItemSchemaType,
} from "@/src/lib/schemas/quiz-question.schema";

// Default time limit for new questions (in milliseconds)
export const DEFAULT_TIME_LIMIT = 20000; // <<< Add export

// Helper to create a default choice structure
export const createDefaultChoice = (
  isCorrect: boolean = false,
  answer: string = ""
): ChoiceHost => ({
  answer: answer,
  image: undefined,
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
  isTrueFalse: boolean = false
): QuestionHost => {
  const baseQuestion: Partial<QuestionHost> & {
    video?: VideoSchemaType | null;
    media?: MediaItemSchemaType[];
  } = {
    type: type,
    question: "",
    time: DEFAULT_TIME_LIMIT,
    pointsMultiplier: 1,
    choices: [],
    image: null,
    video: {
      // Default video object structure
      id: undefined,
      startTime: 0.0,
      endTime: 0.0,
      service: "youtube",
      fullUrl: "",
    },
    media: [], // Default to empty array
  };

  switch (type) {
    case "quiz":
      if (isTrueFalse) {
        baseQuestion.question = "True or False: ...";
        baseQuestion.choices = [
          createDefaultChoice(true, "True"),
          createDefaultChoice(false, "False"),
        ];
      } else {
        baseQuestion.question = "Enter your question...";
        baseQuestion.choices = [
          createDefaultChoice(true),
          createDefaultChoice(false),
          createDefaultChoice(false),
          createDefaultChoice(false),
        ];
      }
      break;

    case "jumble":
      baseQuestion.question = "Place these items in the correct order...";
      baseQuestion.choices = [
        createDefaultChoice(true, "Option 1"),
        createDefaultChoice(true, "Option 2"),
        createDefaultChoice(true, "Option 3"),
        createDefaultChoice(true, "Option 4"),
      ];
      baseQuestion.time = 60000;
      break;

    case "survey":
      baseQuestion.question = "Ask an opinion question...";
      baseQuestion.pointsMultiplier = 0;
      baseQuestion.choices = [
        createDefaultChoice(true, "Option A"),
        createDefaultChoice(true, "Option B"),
      ];
      break;

    case "open_ended":
      baseQuestion.question = "Ask an open-ended question...";
      baseQuestion.choices = [createDefaultChoice(true, "Correct Answer")];
      break;

    case "content":
      baseQuestion.title = "Informational Slide Title";
      baseQuestion.description = "Add your content here...";
      baseQuestion.time = 0;
      baseQuestion.pointsMultiplier = 0;
      baseQuestion.choices = [];
      delete baseQuestion.question;
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

  return baseQuestion as QuestionHost;
};
