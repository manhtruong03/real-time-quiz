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
    imageFile: null,
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
        baseQuestion.question = "Đúng hoặc Sai: ...";
        baseQuestion.choices = [
          createDefaultChoice(true, "Đúng"),
          createDefaultChoice(false, "Sai"),
        ];
      } else {
        baseQuestion.question = "Nhập câu hỏi của bạn...";
        baseQuestion.choices = [
          createDefaultChoice(true),
          createDefaultChoice(false),
          createDefaultChoice(false),
          createDefaultChoice(false),
        ];
      }
      break;

    case "jumble":
      baseQuestion.question = "Sắp xếp các mục sau theo đúng thứ tự...";
      baseQuestion.choices = [
        createDefaultChoice(true, "Lựa chọn 1"),
        createDefaultChoice(true, "Lựa chọn 2"),
        createDefaultChoice(true, "Lựa chọn 3"),
        createDefaultChoice(true, "Lựa chọn 4"),
      ];
      baseQuestion.time = 60000;
      break;

    case "survey":
      baseQuestion.question = "Đặt câu hỏi khảo sát ý kiến...";
      baseQuestion.pointsMultiplier = 0;
      baseQuestion.choices = [
        createDefaultChoice(true, "Lựa chọn A"),
        createDefaultChoice(true, "Lựa chọn B"),
      ];
      break;

    case "open_ended":
      baseQuestion.question = "Đặt câu hỏi mở...";
      baseQuestion.choices = [createDefaultChoice(true, "Đáp án đúng")];
      break;

    case "content":
      baseQuestion.title = "Tiêu đề trang thông tin";
      baseQuestion.description = "Thêm nội dung của bạn vào đây...";
      baseQuestion.time = 0;
      baseQuestion.pointsMultiplier = 0;
      baseQuestion.choices = [];
      delete baseQuestion.question;
      break;

    default:
      console.warn(
        `Đã yêu cầu loại câu hỏi không xác định: ${type}. Tạo quiz chung.`
      );
      baseQuestion.type = "quiz";
      baseQuestion.question = "Nhập câu hỏi của bạn...";
      baseQuestion.choices = [createDefaultChoice(true)];
      break;
  }

  return baseQuestion as QuestionHost;
};
