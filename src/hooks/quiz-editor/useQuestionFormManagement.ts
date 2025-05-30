// src/hooks/quiz-editor/useQuestionFormManagement.ts
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm, SubmitHandler, SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/src/components/ui/use-toast"; // Ensure this path is correct
import type {
  QuizStructureHost,
  QuestionHost,
  ChoiceHost,
} from "@/src/lib/types/quiz-structure"; // QuestionHost now includes imageFile
import {
  QuestionHostSchema,
  QuestionHostSchemaType, // Infers to include imageFile
  QuestionFormContextType, // Infers to include imageFile
  ChoiceHostSchemaType,
  VideoSchemaType,
  MediaItemSchemaType,
} from "@/src/lib/schemas/quiz-question.schema"; // Zod schemas
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
  // For File objects, compare names and sizes as a proxy for content identity for this use case.
  // A more robust comparison would involve reading file contents, which is too heavy here.
  if (obj1 instanceof File && obj2 instanceof File) {
    return (
      obj1.name === obj2.name &&
      obj1.size === obj2.size &&
      obj1.type === obj2.type
    );
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
      image: questionData.image ?? null, // This is the URL string (or objectURL)
      imageFile: questionData.imageFile || null, // This is the File object
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
    // Create a default new question structure, ensuring imageFile is initialized
    const defaultNewQuestion = createDefaultQuestion("quiz");
    return {
      type: defaultNewQuestion.type,
      image: defaultNewQuestion.image ?? null,
      imageFile: (defaultNewQuestion as QuestionHost).imageFile || null, // Initialize imageFile
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
    updatedQuestion: QuestionHost | null // Updated type to QuestionHost which includes imageFile
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
    // QuestionFormContextType now includes imageFile
    resolver: zodResolver(QuestionHostSchema), // QuestionHostSchema now includes imageFile
    mode: "onBlur", // Or "onChange" if preferred for more immediate feedback
    defaultValues: getDefaultValuesForEditor(quizData, currentSlideIndex),
  });
  const {
    reset,
    getValues,
    setValue,
    handleSubmit,
    trigger,
    watch,
    formState: { errors, isDirty: rhfIsDirty }, // Renamed to avoid conflict
  } = methods;

  const watchedType = watch("type");
  const watchedImage = watch("image"); // Watch the image URL field
  const watchedImageFile = watch("imageFile"); // Watch the image File field

  const prevSlideIndexRef = useRef(currentSlideIndex);
  const prevWatchedTypeRef = useRef(watchedType);
  const isHandlingTypeChange = useRef(false);

  // Track initial form values to compare for true dirtiness including File objects
  const [initialFormValues, setInitialFormValues] =
    useState<QuestionFormContextType | null>(null);

  useEffect(() => {
    if (currentSlideIndex >= 0) {
      const newDefaultValues = getDefaultValuesForEditor(
        quizData,
        currentSlideIndex
      );
      reset(newDefaultValues);
      setInitialFormValues(newDefaultValues); // Store initial values for comparison
      prevWatchedTypeRef.current = newDefaultValues.type;
    } else {
      setInitialFormValues(null); // Clear if no slide is selected
    }
    prevSlideIndexRef.current = currentSlideIndex;
  }, [currentSlideIndex, quizData, reset]);

  // Custom isDirty check considering File objects
  const isFormTrulyDirty = useCallback(() => {
    if (currentSlideIndex < 0 || !initialFormValues) return false;
    const currentValues = getValues();
    // Compare relevant fields, including special handling for File objects
    const fieldsToCompare: (keyof QuestionFormContextType)[] = [
      "type",
      "question",
      "title",
      "description",
      "time",
      "pointsMultiplier",
      "choices",
      "correctChoiceIndex",
      "image",
      // "video", "media" // Add these if they can be edited and need dirty checking
    ];

    for (const key of fieldsToCompare) {
      if (!simpleDeepCompare(currentValues[key], initialFormValues[key])) {
        return true;
      }
    }
    // Specifically compare File objects
    if (
      !simpleDeepCompare(currentValues.imageFile, initialFormValues.imageFile)
    ) {
      return true;
    }

    return false;
  }, [getValues, initialFormValues, currentSlideIndex]);

  const onValidSubmit: SubmitHandler<QuestionFormContextType> = useCallback(
    (validatedRHFData) => {
      // validatedRHFData includes image and imageFile
      const currentIndex = currentSlideIndex;
      let finalQuestionData: QuestionHost;

      // Base data, including image (URL) and imageFile (File object)
      const baseDataFromForm = {
        ...validatedRHFData,
        image: validatedRHFData.image, // This is the URL or objectURL
        imageFile: validatedRHFData.imageFile, // This is the File object
      };

      if (validatedRHFData.type === "quiz") {
        const selectedIndex = validatedRHFData.correctChoiceIndex ?? -1;
        finalQuestionData = {
          ...baseDataFromForm,
          choices: (validatedRHFData.choices || []).map((choice, idx) => ({
            answer: choice.answer,
            image: choice.image, // This is ChoiceHostImage, should be fine
            correct: idx === selectedIndex,
          })),
        } as unknown as QuestionHost; // Cast needed as RHF type might slightly differ from strict QuestionHost
      } else {
        finalQuestionData = {
          ...baseDataFromForm,
          choices: (validatedRHFData.choices || []).map((choice) => ({
            answer: choice.answer,
            image: choice.image,
            correct: choice.correct ?? true,
          })),
        } as unknown as QuestionHost;
      }

      // Remove the temporary RHF-specific correctChoiceIndex if it exists on the final object
      if ("correctChoiceIndex" in finalQuestionData) {
        delete (finalQuestionData as any).correctChoiceIndex;
      }

      onQuestionChange(currentIndex, finalQuestionData);
      // Reset RHF state to new "clean" state AFTER successfully updating parent
      const newDefaults = getDefaultValuesForEditor(quizData, currentIndex); // Get fresh defaults which should include the just saved data
      reset(newDefaults, {
        keepValues: false,
        keepDirty: false,
        keepErrors: false,
      });
      setInitialFormValues(newDefaults); // Update initial values for dirty checking
      prevWatchedTypeRef.current = validatedRHFData.type;
    },
    [currentSlideIndex, onQuestionChange, reset, quizData, setInitialFormValues]
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
    if (currentIndex < 0) return true; // No slide selected, nothing to save

    const currentValues = getValues();
    const currentType = currentValues.type;

    // Determine if it's a True/False variant for transformation
    const isCurrentTF =
      currentType === "quiz" &&
      currentValues.choices?.length === 2 &&
      currentValues.choices.some(
        (c: ChoiceHostSchemaType) => c.answer?.toLowerCase() === "true"
      ) &&
      currentValues.choices.some(
        (c: ChoiceHostSchemaType) => c.answer?.toLowerCase() === "false"
      );

    // Transform data just before validation (if needed, e.g. for quiz correctness)
    // This transformation should mainly ensure data structure consistency for validation.
    const transformedDataForValidation = transformQuestionDataForType(
      currentValues,
      currentType,
      isCurrentTF
    );

    // Reset the form with potentially transformed data to ensure RHF validates the correct structure
    // Keep dirty state if it was dirty, to ensure handleSubmit still processes.
    const needsResetForValidation = !simpleDeepCompare(
      currentValues,
      transformedDataForValidation
    );
    if (needsResetForValidation) {
      reset(transformedDataForValidation, {
        keepDefaultValues: false,
        keepDirty: isFormTrulyDirty(),
        keepErrors: false,
      });
      // Wait for reset to apply before handleSubmit
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    if (!isFormTrulyDirty() && !needsResetForValidation) {
      console.log(
        "[triggerSave] Form is not dirty, and no transformation needed. Skipping submit."
      );
      return true; // Form is not dirty, consider it "saved"
    }

    console.log(
      "[triggerSave] Form is dirty or transformed, attempting handleSubmit."
    );
    await handleSubmit(onValidSubmit, onInvalidSubmit)();

    // Give RHF time to update its internal error state after submit
    await new Promise((resolve) => setTimeout(resolve, 0));

    const finalErrors = methods.formState.errors;
    const isValid = Object.keys(finalErrors).length === 0;
    if (isValid) {
      // After successful validation and submission logic (onValidSubmit),
      // the form's defaultValues and isDirty state should be updated to reflect the new "clean" state.
      // onValidSubmit now handles resetting and updating initialFormValues.
    } else {
      console.log("[triggerSave] Validation failed. Errors:", finalErrors);
    }
    return isValid;
  }, [
    currentSlideIndex,
    isFormTrulyDirty, // Use custom dirty check
    handleSubmit,
    onValidSubmit,
    onInvalidSubmit,
    methods.formState.errors, // Use methods.formState for current errors
    reset,
    getValues,
    initialFormValues, // Include for comparison logic
    setInitialFormValues,
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
        choices.some(
          (c: ChoiceHostSchemaType) => c.answer?.toLowerCase() === "true"
        ) &&
        choices.some(
          (c: ChoiceHostSchemaType) => c.answer?.toLowerCase() === "false"
        );

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

      // When changing type, imageFile should be preserved if the new type supports images.
      // If the new type is 'content', imageFile might need to be cleared or handled.
      // transformQuestionDataForType should ideally handle this.
      // For now, assume transformQuestionDataForType correctly manages imageFile.
      if (newType === "content" && transformedData.imageFile) {
        // Example: if content slides shouldn't have a file, clear it
        // transformedData.imageFile = null;
        // transformedData.image = null;
      }

      reset(transformedData, {
        keepDefaultValues: false, // Important: we are setting new defaults
        keepDirty: true, // Consider it dirty after type change
        keepErrors: false, // Clear previous errors
      });
      setInitialFormValues(transformedData); // Update initial values for dirty checking
      prevWatchedTypeRef.current = newType;

      // Wait for RHF to process the reset
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Trigger validation after reset and transformation
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

      // Logic to convert RHF data (QuestionFormContextType) to QuestionHost
      // This should be similar to what's in onValidSubmit
      const parseResult = QuestionHostSchema.safeParse(transformedData);
      let finalQuestionHostData: QuestionHost | null = null;
      if (parseResult.success) {
        const validatedData = parseResult.data; // This is QuestionHostSchemaType
        if (validatedData.type === "quiz") {
          const selectedIndex = transformedData.correctChoiceIndex ?? -1; // Use correctChoiceIndex from transformedData for quiz
          finalQuestionHostData = {
            ...validatedData, // Spread validated data which includes type, image, imageFile etc.
            choices: (validatedData.choices || []).map((choice, idx) => ({
              answer: choice.answer,
              image: choice.image, // from ChoiceHostObjectSchema
              correct: idx === selectedIndex,
            })),
          } as unknown as QuestionHost;
        } else {
          finalQuestionHostData = {
            ...validatedData,
            choices: (validatedData.choices || []).map((choice) => ({
              answer: choice.answer,
              image: choice.image,
              correct: choice.correct ?? true, // For non-quiz, correct is usually true or not applicable for scoring
            })),
          } as unknown as QuestionHost;
        }
        if (
          finalQuestionHostData &&
          "correctChoiceIndex" in finalQuestionHostData
        ) {
          delete (finalQuestionHostData as any).correctChoiceIndex;
        }
      } else {
        console.error(
          "Zod parsing failed after type change:",
          parseResult.error.flatten()
        );
        toast({
          title: "Internal Error",
          description:
            "Could not prepare default data structure after type change.",
          variant: "destructive",
        });
      }

      onQuestionChange(currentIndex, finalQuestionHostData);
      isHandlingTypeChange.current = false;
    },
    [
      currentSlideIndex,
      reset,
      onQuestionChange,
      getValues,
      toast,
      trigger,
      setInitialFormValues,
    ]
  );

  useEffect(() => {
    if (isHandlingTypeChange.current) return;

    const currentRhfType = getValues("type");

    if (currentRhfType && currentRhfType !== prevWatchedTypeRef.current) {
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
      handleTypeChange(currentRhfType, isCurrentlyTF);
    } else if (currentRhfType && !prevWatchedTypeRef.current) {
      // Initialize prevWatchedTypeRef if it's the first render with a type
      prevWatchedTypeRef.current = currentRhfType;
    }
  }, [watchedType, getValues, handleTypeChange]); // RHF's `watch` is stable

  return {
    methods,
    isDirty: isFormTrulyDirty(), // Use custom dirty check
    errors,
    watchedType,
    triggerSave,
    handleTypeChange,
  };
}
