// src/hooks/quiz-editor/form-management/questionFormTypeChange.ts
import { UseFormReturn } from "react-hook-form";
import type {
  QuestionHost,
  ChoiceHost,
  QuizStructureHost,
} from "@/src/lib/types/quiz-structure";
import {
  QuestionHostSchema, // Now a value import
  type QuestionFormContextType,
  type ChoiceHostSchemaType,
} from "@/src/lib/schemas/quiz-question.schema";
import { transformQuestionDataForType } from "@/src/lib/game-utils/question-type-transformer";
import { useToast } from "@/src/hooks/use-toast";

interface TypeChangeHandlerProps {
  quizData: QuizStructureHost | null; // Added quizData for ID preservation
  currentSlideIndex: number;
  isHandlingTypeChangeRef: React.MutableRefObject<boolean>;
  getValues: UseFormReturn<QuestionFormContextType>["getValues"];
  reset: UseFormReturn<QuestionFormContextType>["reset"];
  trigger: UseFormReturn<QuestionFormContextType>["trigger"];
  setInitialFormValues: (values: QuestionFormContextType | null) => void;
  setPrevWatchedTypeRef: (type: QuestionFormContextType["type"]) => void;
  onQuestionChange: (
    index: number,
    updatedQuestion: QuestionHost | null
  ) => void;
  toast: ReturnType<typeof useToast>["toast"];
}

export const createHandleTypeChange =
  ({
    quizData,
    currentSlideIndex,
    isHandlingTypeChangeRef,
    getValues,
    reset,
    trigger,
    setInitialFormValues,
    setPrevWatchedTypeRef,
    onQuestionChange,
    toast,
  }: TypeChangeHandlerProps) =>
  async (newType: QuestionHost["type"], isTrueFalseOverride = false) => {
    if (isHandlingTypeChangeRef.current) return;
    isHandlingTypeChangeRef.current = true;

    const currentIndex = currentSlideIndex;
    const currentRhfType = getValues("type");
    if (currentIndex < 0) {
      isHandlingTypeChangeRef.current = false;
      return;
    }

    const choices = getValues("choices");
    const isCurrentlyTF =
      currentRhfType === "quiz" &&
      choices?.length === 2 &&
      choices.some(
        (c: ChoiceHostSchemaType) => c.answer?.toLowerCase() === "true"
      ) &&
      choices.some(
        (c: ChoiceHostSchemaType) => c.answer?.toLowerCase() === "false"
      );

    if (newType === currentRhfType && isTrueFalseOverride === isCurrentlyTF) {
      setPrevWatchedTypeRef(currentRhfType); // Update ref if it was somehow out of sync
      isHandlingTypeChangeRef.current = false;
      return;
    }

    const currentValues = getValues();
    const transformedData = transformQuestionDataForType(
      currentValues,
      newType,
      isTrueFalseOverride
    );

    if (currentValues.imageFile) {
      transformedData.imageFile = currentValues.imageFile;
      transformedData.image = currentValues.image;
      transformedData.questionImageUploadKey =
        currentValues.questionImageUploadKey;
    }

    reset(transformedData, {
      keepDefaultValues: false,
      keepDirty: true,
      keepErrors: false,
    });
    setInitialFormValues(transformedData);
    setPrevWatchedTypeRef(newType);

    await new Promise((resolve) => setTimeout(resolve, 0));
    const isValidAfterReset = await trigger();

    if (!isValidAfterReset) {
      toast({
        title: "Type Change Error",
        description:
          "Could not apply new question type due to validation issues.",
        variant: "destructive",
      });
      isHandlingTypeChangeRef.current = false;
      return;
    }

    const parseResult = QuestionHostSchema.safeParse(transformedData);
    let finalQuestionHostData: QuestionHost | null = null;

    if (parseResult.success) {
      const validatedDataFromParse = parseResult.data;
      const baseHostPortion: Omit<QuestionHost, "choices" | "id"> & {
        id?: string;
      } = {
        type: validatedDataFromParse.type,
        image: validatedDataFromParse.image,
        imageFile: validatedDataFromParse.imageFile,
        questionImageUploadKey: validatedDataFromParse.imageFile
          ? validatedDataFromParse.questionImageUploadKey
          : null,
        video: validatedDataFromParse.video,
        media: (validatedDataFromParse.media || []).map((m) => ({ ...m })),
        time: validatedDataFromParse.time,
        pointsMultiplier: validatedDataFromParse.pointsMultiplier,
      };

      let questionSpecificPortion: Partial<
        Pick<QuestionHost, "question" | "title" | "description">
      > = {};
      if (validatedDataFromParse.type === "content") {
        questionSpecificPortion.title = validatedDataFromParse.title;
        questionSpecificPortion.description =
          validatedDataFromParse.description;
      } else {
        questionSpecificPortion.question = validatedDataFromParse.question;
      }

      let hostChoices: ChoiceHost[] = [];
      if (validatedDataFromParse.type === "quiz") {
        const selectedIndex =
          (transformedData as QuestionFormContextType).correctChoiceIndex ?? -1;
        hostChoices = (validatedDataFromParse.choices || []).map(
          (choice, idx) => ({
            answer: choice.answer,
            image: choice.image ? { ...choice.image } : undefined,
            correct: idx === selectedIndex,
          })
        );
      } else if (validatedDataFromParse.choices) {
        hostChoices = (validatedDataFromParse.choices || []).map((choice) => ({
          answer: choice.answer,
          image: choice.image ? { ...choice.image } : undefined,
          correct: choice.correct ?? true,
        }));
      }

      finalQuestionHostData = {
        id: quizData?.questions?.[currentIndex]?.id,
        ...baseHostPortion,
        ...questionSpecificPortion,
        choices: hostChoices,
      };
    } else {
      console.error(
        "Zod parsing failed (handleTypeChange):",
        parseResult.error.flatten()
      );
      toast({
        title: "Internal Error",
        description: "Could not prepare data after type change.",
        variant: "destructive",
      });
    }

    onQuestionChange(currentIndex, finalQuestionHostData);
    isHandlingTypeChangeRef.current = false;
  };
