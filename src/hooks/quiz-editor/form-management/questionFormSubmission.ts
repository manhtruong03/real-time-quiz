// src/hooks/quiz-editor/form-management/questionFormSubmission.ts
import { SubmitHandler, SubmitErrorHandler } from "react-hook-form";
import type {
  QuestionHost,
  ChoiceHost,
  QuizStructureHost,
} from "@/src/lib/types/quiz-structure";
import type { QuestionFormContextType } from "@/src/lib/schemas/quiz-question.schema";
import { useToast } from "@/src/hooks/use-toast"; // Keep this
import { getDefaultValuesForEditor } from "./questionFormDefaultValues";

interface SubmissionHandlerProps {
  quizData: QuizStructureHost | null;
  currentSlideIndex: number;
  onQuestionChange: (
    index: number,
    updatedQuestion: QuestionHost | null
  ) => void;
  resetForm: (
    values?: QuestionFormContextType,
    options?: {
      keepValues?: boolean;
      keepDirty?: boolean;
      keepErrors?: boolean;
    }
  ) => void;
  setInitialFormValues: (values: QuestionFormContextType | null) => void;
  setPrevWatchedTypeRef: (type: QuestionFormContextType["type"]) => void;
  toast: ReturnType<typeof useToast>["toast"]; // Use ReturnType here
}

export const createOnValidSubmit =
  ({
    quizData,
    currentSlideIndex,
    onQuestionChange,
    resetForm,
    setInitialFormValues,
    setPrevWatchedTypeRef,
  }: SubmissionHandlerProps): SubmitHandler<QuestionFormContextType> =>
  (validatedRHFData) => {
    const currentIndex = currentSlideIndex;

    const baseHostData: Omit<QuestionHost, "choices" | "id"> & {
      id?: string;
    } = {
      type: validatedRHFData.type,
      image: validatedRHFData.image || null,
      imageFile: validatedRHFData.imageFile || null,
      questionImageUploadKey: validatedRHFData.imageFile
        ? validatedRHFData.questionImageUploadKey
        : null,
      video: validatedRHFData.video ? { ...validatedRHFData.video } : null,
      media: (validatedRHFData.media || []).map((m) => ({ ...m })),
      time: validatedRHFData.time,
      pointsMultiplier: validatedRHFData.pointsMultiplier,
    };

    let questionSpecificFields: Partial<
      Pick<QuestionHost, "question" | "title" | "description">
    > = {};
    if (validatedRHFData.type === "content") {
      questionSpecificFields.title = validatedRHFData.title;
      questionSpecificFields.description = validatedRHFData.description;
    } else {
      questionSpecificFields.question = validatedRHFData.question;
    }

    let finalChoices: ChoiceHost[] = [];
    if (validatedRHFData.type === "quiz") {
      const selectedIndex = validatedRHFData.correctChoiceIndex ?? -1;
      finalChoices = (validatedRHFData.choices || []).map((choice, idx) => ({
        answer: choice.answer,
        image: choice.image ? { ...choice.image } : undefined,
        correct: idx === selectedIndex,
      }));
    } else {
      finalChoices = (validatedRHFData.choices || []).map((choice) => ({
        answer: choice.answer,
        image: choice.image ? { ...choice.image } : undefined,
        correct: choice.correct ?? true,
      }));
    }

    const finalQuestionData: QuestionHost = {
      id: quizData?.questions?.[currentIndex]?.id,
      ...baseHostData,
      ...questionSpecificFields,
      choices: finalChoices,
    };

    if (
      finalQuestionData.imageFile &&
      !finalQuestionData.questionImageUploadKey
    ) {
      console.error(
        `[questionFormSubmission onValidSubmit] Lỗi không nhất quán: imageFile hiện có nhưng questionImageUploadKey bị thiếu.`
      );
    } else if (
      !finalQuestionData.imageFile &&
      finalQuestionData.questionImageUploadKey
    ) {
      finalQuestionData.questionImageUploadKey = null;
    }

    onQuestionChange(currentIndex, finalQuestionData);

    const newDefaults = getDefaultValuesForEditor(quizData, currentIndex);
    resetForm(newDefaults, {
      keepValues: false,
      keepDirty: false,
      keepErrors: false,
    });
    setInitialFormValues(newDefaults);
    setPrevWatchedTypeRef(validatedRHFData.type);
  };

export const createOnInvalidSubmit =
  ({
    currentSlideIndex,
    toast,
  }: Pick<
    SubmissionHandlerProps,
    "currentSlideIndex" | "toast"
  >): SubmitErrorHandler<QuestionFormContextType> =>
  (errors) => {
    console.error(
      `[questionFormSubmission onInvalidSubmit] Xác thực RHF THẤT BẠI (chỉ mục ${currentSlideIndex}):`,
      JSON.stringify(errors, null, 2)
    );
    toast({
      title: "Lỗi xác thực",
      description: `Vui lòng sửa các lỗi trong Trang chiếu ${
        currentSlideIndex + 1
      }. Thay đổi không thể lưu.`,
      variant: "destructive",
    });
  };
