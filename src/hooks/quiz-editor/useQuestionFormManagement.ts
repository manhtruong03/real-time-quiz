// src/components/quiz-editor/editor/hooks/useQuestionFormManagement.ts
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm, SubmitHandler, SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/src/components/ui/use-toast";
import type {
  QuizStructureHost,
  QuestionHost,
  ChoiceHost,
} from "@/src/lib/types/quiz-structure";
import {
  QuestionHostSchema,
  QuestionHostSchemaType,
  QuestionFormContextType,
  ChoiceHostSchemaType,
  VideoSchemaType,
  MediaItemSchemaType,
} from "@/src/lib/schemas/quiz-question.schema";
import {
  createDefaultQuestion,
  DEFAULT_TIME_LIMIT,
} from "@/src/lib/game-utils/quiz-creation";
import { transformQuestionDataForType } from "@/src/lib/game-utils/question-type-transformer";

// Utility function for simple deep comparison (can be moved to a utils file if used elsewhere)
function simpleDeepCompare(obj1: any, obj2: any): boolean {
  if (
    obj1 === null ||
    obj2 === null ||
    typeof obj1 !== "object" ||
    typeof obj2 !== "object"
  ) {
    return obj1 === obj2;
  }
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

const getDefaultValuesForEditor = (
  quizData: QuizStructureHost | null,
  currentSlideIndex: number
): QuestionFormContextType => {
  const questionData = quizData?.questions?.[currentSlideIndex];

  const defaultVideoSchemaValue: VideoSchemaType | null = null;
  const defaultMediaSchemaValue: MediaItemSchemaType[] = [];

  if (questionData) {
    let correctIdx = -1;
    if (questionData.type === "quiz" && questionData.choices) {
      correctIdx = questionData.choices.findIndex((c) => c.correct);
    }
    const defaultChoices =
      questionData.choices?.map((c: ChoiceHost) => ({
        answer: c.answer ?? "",
        image: c.image ?? undefined,
        correct: c.correct ?? false,
      })) ?? [];

    const videoValue = questionData.video
      ? {
          id: questionData.video.id || undefined,
          startTime: questionData.video.startTime ?? 0.0,
          endTime: questionData.video.endTime ?? 0.0,
          service: questionData.video.service ?? "youtube",
          fullUrl: questionData.video.fullUrl ?? "",
        }
      : defaultVideoSchemaValue;

    const mediaValue =
      questionData.media?.map((m) => ({
        type: m.type,
        url: m.url,
        id: m.id,
        altText: m.altText,
        zIndex: m.zIndex,
        isColorOnly: m.isColorOnly,
        contentType: m.contentType,
        origin: m.origin,
        externalRef: m.externalRef,
        resources: m.resources,
        width: m.width,
        height: m.height,
      })) ?? defaultMediaSchemaValue;

    return {
      type: questionData.type,
      image: questionData.image ?? null,
      video: videoValue,
      media: mediaValue,
      question: questionData.question ?? "",
      title: questionData.title ?? "",
      description: questionData.description ?? "",
      time: questionData.time ?? DEFAULT_TIME_LIMIT,
      pointsMultiplier:
        questionData.pointsMultiplier ??
        (questionData.type === "survey" || questionData.type === "content"
          ? 0
          : 1),
      choices: defaultChoices,
      correctChoiceIndex: correctIdx === -1 ? -1 : correctIdx,
    };
  } else {
    const defaultNewQuestion = createDefaultQuestion("quiz");
    return {
      type: defaultNewQuestion.type,
      image: defaultNewQuestion.image ?? null,
      video: defaultNewQuestion.video
        ? {
            id: defaultNewQuestion.video.id,
            startTime: defaultNewQuestion.video.startTime ?? 0.0,
            endTime: defaultNewQuestion.video.endTime ?? 0.0,
            service: defaultNewQuestion.video.service ?? "youtube",
            fullUrl: defaultNewQuestion.video.fullUrl ?? "",
          }
        : defaultVideoSchemaValue,
      media:
        defaultNewQuestion.media?.map((m) => ({
          type: m.type,
          url: m.url,
          id: m.id,
          altText: m.altText,
          zIndex: m.zIndex,
          isColorOnly: m.isColorOnly,
          contentType: m.contentType,
          origin: m.origin,
          externalRef: m.externalRef,
          resources: m.resources,
          width: m.width,
          height: m.height,
        })) ?? defaultMediaSchemaValue,
      question: defaultNewQuestion.question ?? "",
      title: defaultNewQuestion.title ?? "",
      description: defaultNewQuestion.description ?? "",
      time: defaultNewQuestion.time ?? DEFAULT_TIME_LIMIT,
      pointsMultiplier: defaultNewQuestion.pointsMultiplier ?? 1,
      choices: defaultNewQuestion.choices.map((c) => ({
        answer: c.answer ?? "",
        image: c.image,
        correct: c.correct ?? false,
      })),
      correctChoiceIndex:
        defaultNewQuestion.choices.findIndex((c) => c.correct) ?? -1,
    };
  }
};

interface UseQuestionFormManagementProps {
  quizData: QuizStructureHost | null;
  currentSlideIndex: number;
  onQuestionChange: (
    index: number,
    updatedQuestion: QuestionHost | null
  ) => void;
  triggerSaveRef?: React.MutableRefObject<(() => Promise<boolean>) | null>;
}

export function useQuestionFormManagement({
  quizData,
  currentSlideIndex,
  onQuestionChange,
  triggerSaveRef,
}: UseQuestionFormManagementProps) {
  const { toast } = useToast();
  const methods = useForm<QuestionFormContextType>({
    resolver: zodResolver(QuestionHostSchema),
    mode: "onBlur",
    defaultValues: getDefaultValuesForEditor(quizData, currentSlideIndex),
  });
  const {
    reset,
    getValues,
    setValue,
    handleSubmit,
    trigger,
    watch,
    formState: { errors, isDirty },
  } = methods;

  const watchedType = watch("type");
  const prevSlideIndexRef = useRef(currentSlideIndex);
  const prevWatchedTypeRef = useRef(watchedType);
  const isHandlingTypeChange = useRef(false);

  useEffect(() => {
    let shouldReset = false;
    if (prevSlideIndexRef.current !== currentSlideIndex) {
      shouldReset = true;
    }

    if (shouldReset && currentSlideIndex >= 0) {
      const newDefaultValues = getDefaultValuesForEditor(
        quizData,
        currentSlideIndex
      );
      reset(newDefaultValues);
      prevWatchedTypeRef.current = newDefaultValues.type;
    }
    prevSlideIndexRef.current = currentSlideIndex;
  }, [currentSlideIndex, quizData, reset]);

  const onValidSubmit: SubmitHandler<QuestionFormContextType> = useCallback(
    (validatedRHFData) => {
      const currentIndex = currentSlideIndex;
      let finalQuestionData: QuestionHost;

      if (validatedRHFData.type === "quiz") {
        const selectedIndex = validatedRHFData.correctChoiceIndex ?? -1;
        finalQuestionData = {
          ...validatedRHFData,
          choices: (validatedRHFData.choices || []).map((choice, idx) => ({
            answer: choice.answer,
            image: choice.image,
            correct: idx === selectedIndex,
          })),
        } as QuestionHost;
      } else {
        finalQuestionData = {
          ...validatedRHFData,
          choices: (validatedRHFData.choices || []).map((choice) => ({
            answer: choice.answer,
            image: choice.image,
            correct: choice.correct ?? true, // Default to true for non-quiz if not specified
          })),
        } as QuestionHost;
      }

      if ("correctChoiceIndex" in finalQuestionData) {
        delete (finalQuestionData as any).correctChoiceIndex;
      }

      onQuestionChange(currentIndex, finalQuestionData);
      reset(validatedRHFData, {
        keepValues: true,
        keepDirty: false,
        keepErrors: false,
      });
      prevWatchedTypeRef.current = validatedRHFData.type;
    },
    [currentSlideIndex, onQuestionChange, reset]
  );

  const onInvalidSubmit: SubmitErrorHandler<QuestionFormContextType> =
    useCallback(
      (errors) => {
        const currentIndex = currentSlideIndex;
        console.error(
          `[useQuestionFormManagement onInvalidSubmit] RHF validation FAILED (index ${currentIndex}):`,
          JSON.stringify(errors, null, 2)
        );
        toast({
          title: "Validation Error",
          description: `Please fix the errors in Slide ${
            currentIndex + 1
          }. Changes could not be saved.`,
          variant: "destructive",
        });
      },
      [currentSlideIndex, toast]
    );

  const triggerSave = useCallback(async (): Promise<boolean> => {
    const currentIndex = currentSlideIndex;
    if (currentIndex < 0) return true;

    const currentValues = getValues();
    const currentType = currentValues.type;
    const isCurrentTF =
      currentType === "quiz" &&
      currentValues.choices?.length === 2 &&
      currentValues.choices.some(
        (c: ChoiceHostSchemaType) => c.answer === "True"
      ) &&
      currentValues.choices.some(
        (c: ChoiceHostSchemaType) => c.answer === "False"
      );

    const transformedData = transformQuestionDataForType(
      currentValues,
      currentType,
      isCurrentTF
    );

    const needsReset = !simpleDeepCompare(currentValues, transformedData);

    if (needsReset) {
      reset(transformedData, {
        keepDefaultValues: false,
        keepDirty: true,
        keepErrors: false,
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    if (!isDirty && !needsReset) {
      return true;
    }

    await handleSubmit(onValidSubmit, onInvalidSubmit)();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const finalErrors = methods.formState.errors;
    return Object.keys(finalErrors).length === 0;
  }, [
    currentSlideIndex,
    isDirty,
    handleSubmit,
    onValidSubmit,
    onInvalidSubmit,
    methods.formState.errors,
    reset,
    getValues,
  ]);

  useEffect(() => {
    if (triggerSaveRef) triggerSaveRef.current = triggerSave;
    return () => {
      if (triggerSaveRef) triggerSaveRef.current = null;
    };
  }, [triggerSaveRef, triggerSave]);

  const handleTypeChange = useCallback(
    async (newType: QuestionHost["type"], isTrueFalseOverride = false) => {
      if (isHandlingTypeChange.current) return;
      isHandlingTypeChange.current = true;

      const currentIndex = currentSlideIndex;
      const currentRhfType = getValues("type");
      if (currentIndex < 0) {
        isHandlingTypeChange.current = false;
        return;
      }

      const choices = getValues("choices");
      const isCurrentlyTF =
        currentRhfType === "quiz" &&
        choices?.length === 2 &&
        choices.some((c: ChoiceHostSchemaType) => c.answer === "True") &&
        choices.some((c: ChoiceHostSchemaType) => c.answer === "False");

      if (newType === currentRhfType && isTrueFalseOverride === isCurrentlyTF) {
        if (prevWatchedTypeRef.current !== currentRhfType)
          prevWatchedTypeRef.current = currentRhfType;
        isHandlingTypeChange.current = false;
        return;
      }

      const currentValues = getValues();
      const transformedData = transformQuestionDataForType(
        currentValues,
        newType,
        isTrueFalseOverride
      );

      reset(transformedData, {
        keepDefaultValues: false,
        keepDirty: true,
        keepErrors: false,
      });
      prevWatchedTypeRef.current = newType;

      const isValidAfterReset = await trigger();
      if (!isValidAfterReset) {
        toast({
          title: "Type Change Error",
          description:
            "Could not apply changes for the new question type due to validation issues.",
          variant: "destructive",
        });
        isHandlingTypeChange.current = false;
        return;
      }

      const parseResult = QuestionHostSchema.safeParse(transformedData);
      let finalDefaultQuestionData: QuestionHost | null = null;
      if (parseResult.success) {
        const validatedData = parseResult.data;
        if (validatedData.type === "quiz") {
          const selectedIndex = transformedData.correctChoiceIndex ?? -1;
          finalDefaultQuestionData = {
            ...validatedData,
            choices: (validatedData.choices || []).map((choice, idx) => ({
              answer: choice.answer,
              image: choice.image,
              correct: idx === selectedIndex,
            })),
          } as QuestionHost;
        } else {
          finalDefaultQuestionData = {
            ...validatedData,
            choices: (validatedData.choices || []).map((choice) => ({
              answer: choice.answer,
              image: choice.image,
              correct: choice.correct ?? true,
            })),
          } as QuestionHost;
        }
        if ("correctChoiceIndex" in finalDefaultQuestionData) {
          delete (finalDefaultQuestionData as any).correctChoiceIndex;
        }
      } else {
        toast({
          title: "Internal Error",
          description: "Could not prepare default data structure.",
          variant: "destructive",
        });
      }

      onQuestionChange(currentIndex, finalDefaultQuestionData);
      isHandlingTypeChange.current = false;
    },
    [currentSlideIndex, reset, onQuestionChange, getValues, toast, trigger]
  );

  useEffect(() => {
    if (isHandlingTypeChange.current) return;
    const currentRhfType = getValues("type");
    if (currentRhfType && currentRhfType !== prevWatchedTypeRef.current) {
      const choices = getValues("choices");
      const isCurrentlyTF =
        currentRhfType === "quiz" &&
        choices?.length === 2 &&
        choices.some((c: ChoiceHostSchemaType) => c.answer === "True") &&
        choices.some((c: ChoiceHostSchemaType) => c.answer === "False");
      handleTypeChange(currentRhfType, isCurrentlyTF);
    } else if (currentRhfType && !prevWatchedTypeRef.current) {
      prevWatchedTypeRef.current = currentRhfType;
    }
  }, [watchedType, getValues, handleTypeChange]);

  return {
    methods, // RHF methods
    isDirty,
    errors,
    watchedType,
    triggerSave, // Expose triggerSave
    handleTypeChange, // Expose handleTypeChange
    // No need to return onValidSubmit and onInvalidSubmit if handleSubmit is used internally or via triggerSave
  };
}
