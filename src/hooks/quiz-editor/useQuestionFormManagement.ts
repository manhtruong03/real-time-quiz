// src/hooks/quiz-editor/useQuestionFormManagement.ts
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/src/hooks/use-toast";
import type {
  QuizStructureHost,
  QuestionHost,
} from "@/src/lib/types/quiz-structure";
import {
  QuestionHostSchema,
  QuestionFormContextType,
  ChoiceHostSchemaType,
} from "@/src/lib/schemas/quiz-question.schema";
import { transformQuestionDataForType } from "@/src/lib/game-utils/question-type-transformer";

// Import refactored functions
import { getDefaultValuesForEditor } from "./form-management/questionFormDefaultValues";
import {
  simpleDeepCompare,
  createIsFormTrulyDirty,
} from "./form-management/questionFormUtils";
import {
  createOnValidSubmit,
  createOnInvalidSubmit,
} from "./form-management/questionFormSubmission";
import { createHandleTypeChange } from "./form-management/questionFormTypeChange";

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
    mode: "onBlur", // Or "onChange" if preferred
    defaultValues: getDefaultValuesForEditor(quizData, currentSlideIndex),
  });

  const {
    reset,
    getValues,
    setValue,
    handleSubmit,
    trigger,
    watch,
    formState: { errors, isDirty: rhfIsDirty },
  } = methods;

  const watchedType = watch("type");
  const prevSlideIndexRef = useRef(currentSlideIndex);
  const prevWatchedTypeRef = useRef(watchedType); // Initialized with watchedType from RHF
  const isHandlingTypeChange = useRef(false);
  const [initialFormValues, setInitialFormValues] =
    useState<QuestionFormContextType | null>(null);

  // Initialize prevWatchedTypeRef based on initial form values
  useEffect(() => {
    const initialValues = getDefaultValuesForEditor(
      quizData,
      currentSlideIndex
    );
    prevWatchedTypeRef.current = initialValues.type;
    setInitialFormValues(initialValues); // Also set initialFormValues here
  }, [quizData, currentSlideIndex]);

  useEffect(() => {
    if (currentSlideIndex >= 0) {
      const newDefaultValues = getDefaultValuesForEditor(
        quizData,
        currentSlideIndex
      );
      reset(newDefaultValues);
      setInitialFormValues(newDefaultValues); // Also set when slide index changes
      if (prevWatchedTypeRef.current !== newDefaultValues.type) {
        // Sync prevWatchedType if needed
        prevWatchedTypeRef.current = newDefaultValues.type;
      }
    } else {
      setInitialFormValues(null);
    }
    prevSlideIndexRef.current = currentSlideIndex;
  }, [currentSlideIndex, quizData, reset]);

  const isFormTrulyDirty = useCallback(
    createIsFormTrulyDirty(getValues, initialFormValues, currentSlideIndex),
    [getValues, initialFormValues, currentSlideIndex]
  );

  const onValidSubmit = useCallback(
    createOnValidSubmit({
      quizData,
      currentSlideIndex,
      onQuestionChange,
      resetForm: reset,
      setInitialFormValues,
      setPrevWatchedTypeRef: (type) => {
        prevWatchedTypeRef.current = type;
      },
      toast,
    }),
    [
      quizData,
      currentSlideIndex,
      onQuestionChange,
      reset,
      setInitialFormValues,
      toast,
    ]
  );

  const onInvalidSubmit = useCallback(
    createOnInvalidSubmit({ currentSlideIndex, toast }),
    [currentSlideIndex, toast]
  );

  const handleTypeChange = useCallback(
    createHandleTypeChange({
      quizData,
      currentSlideIndex,
      isHandlingTypeChangeRef: isHandlingTypeChange,
      getValues,
      reset,
      trigger,
      setInitialFormValues,
      setPrevWatchedTypeRef: (type) => {
        prevWatchedTypeRef.current = type;
      },
      onQuestionChange,
      toast,
    }),
    [
      quizData,
      currentSlideIndex,
      getValues,
      reset,
      trigger,
      setInitialFormValues,
      onQuestionChange,
      toast,
    ]
  );

  // Effect for watching RHF's 'type' field to trigger handleTypeChange
  useEffect(() => {
    if (isHandlingTypeChange.current) return;

    const subscription = watch((value, { name, type }) => {
      if (name === "type" && type === "change") {
        const newTypeValue = value.type;
        if (newTypeValue && newTypeValue !== prevWatchedTypeRef.current) {
          console.log(
            `[Main Hook useEffect] Watched type changed from ${prevWatchedTypeRef.current} to ${newTypeValue}. Triggering handleTypeChange.`
          );
          const currentChoices = getValues("choices");
          const isCurrentlyTF =
            newTypeValue === "quiz" &&
            currentChoices?.length === 2 &&
            currentChoices.some(
              (c: ChoiceHostSchemaType) => c.answer?.toLowerCase() === "true"
            ) &&
            currentChoices.some(
              (c: ChoiceHostSchemaType) => c.answer?.toLowerCase() === "false"
            );
          // Call handleTypeChange, assuming the 'quiz-tf' distinction is now handled within it or via transformQuestionDataForType
          handleTypeChange(newTypeValue, isCurrentlyTF);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, getValues, handleTypeChange]); // prevWatchedTypeRef is a ref, not needed in deps

  const triggerSave = useCallback(async (): Promise<boolean> => {
    const currentIndex = currentSlideIndex;
    if (currentIndex < 0) return true;

    const currentValues = getValues();
    const currentTypeFromForm = currentValues.type;

    // Determine if the current form state for 'quiz' is True/False
    const isCurrentFormTF =
      currentTypeFromForm === "quiz" &&
      currentValues.choices?.length === 2 &&
      currentValues.choices.some(
        (c: ChoiceHostSchemaType) => c.answer?.toLowerCase() === "true"
      ) &&
      currentValues.choices.some(
        (c: ChoiceHostSchemaType) => c.answer?.toLowerCase() === "false"
      );

    const transformedDataForValidation = transformQuestionDataForType(
      currentValues,
      currentTypeFromForm,
      isCurrentFormTF // Pass whether the current RHF state represents T/F
    );

    const needsResetForValidation = !simpleDeepCompare(
      currentValues,
      transformedDataForValidation
    );

    if (needsResetForValidation) {
      const isFormDirtyBeforeTransform = isFormTrulyDirty();
      reset(transformedDataForValidation, {
        keepDefaultValues: false,
        keepDirty: isFormDirtyBeforeTransform, // Preserve original dirty state
        keepErrors: false,
      });
      // It's important to allow React to re-render and RHF to process the reset
      // before calling trigger or handleSubmit.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    // After potential reset, check dirty state again against the potentially new baseline
    if (!isFormTrulyDirty() && !needsResetForValidation) {
      // If it wasn't dirty before, and didn't need a reset for validation,
      // or if it became non-dirty *after* the reset (meaning transform fixed it to initial state),
      // then no save needed.
      return true;
    }

    // Proceed with submission. handleSubmit will use the latest (possibly transformed) form data.
    await handleSubmit(onValidSubmit, onInvalidSubmit)();
    // Allow RHF's submit process and state updates to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    const finalErrors = methods.formState.errors;
    const isValid = Object.keys(finalErrors).length === 0;

    if (!isValid) {
      console.log(
        "[triggerSave] Form is invalid after submit attempt:",
        finalErrors
      );
    }

    return isValid;
  }, [
    currentSlideIndex,
    getValues,
    reset, // Added reset
    isFormTrulyDirty,
    handleSubmit,
    onValidSubmit,
    onInvalidSubmit,
    methods.formState.errors, // Depends on errors to check validity
  ]);

  useEffect(() => {
    if (triggerSaveRef) {
      triggerSaveRef.current = triggerSave;
    }
    return () => {
      if (triggerSaveRef) {
        triggerSaveRef.current = null;
      }
    };
  }, [triggerSaveRef, triggerSave]);

  return {
    methods,
    isDirty: isFormTrulyDirty(),
    errors,
    watchedType, // Still useful for the UI to react to type changes
    triggerSave,
    handleTypeChange, // Expose if direct calls are needed from UI (e.g., specific button)
  };
}
