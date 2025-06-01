// src/hooks/quiz-editor/useQuestionFormManagement.ts
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
  // QuestionHostSchemaType, // Not directly used in this function
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

// simpleDeepCompare function (as provided by you)
function simpleDeepCompare(obj1: any, obj2: any): boolean {
  if (
    obj1 === null ||
    obj2 === null ||
    typeof obj1 !== "object" ||
    typeof obj2 !== "object"
  ) {
    return obj1 === obj2;
  }
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
  // After schema fix, MediaItemSchemaType is the object, so MediaItemSchemaType[] is correct for default.
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

    // This mapping should now work correctly with the fixed MediaItemSchema
    const mediaValue =
      questionData.media?.map((m) => ({
        // m is MediaItemHost here
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

    // MODIFICATION START: Safely access question, title, description
    let formQuestion = "";
    let formTitle = "";
    let formDescription = "";

    // questionData is QuestionHost here
    if (questionData.type === "content") {
      formTitle = questionData.title ?? "";
      formDescription = questionData.description ?? "";
      // 'question' field is usually not primary for 'content'
    } else if (
      questionData.type === "quiz" ||
      questionData.type === "jumble" ||
      questionData.type === "open_ended" ||
      questionData.type === "survey"
    ) {
      formQuestion = questionData.question ?? "";
      // 'title' and 'description' are usually omitted for these types in their specific QuestionHost variants,
      // but BaseQuestionSchema allows them as optional, so we default to empty string if not present.
      formTitle = (questionData as any).title ?? ""; // Use 'as any' if direct access is problematic after narrowing
      formDescription = (questionData as any).description ?? "";
    }
    // MODIFICATION END

    return {
      type: questionData.type,
      image: questionData.image ?? null,
      imageFile: questionData.imageFile || null,
      questionImageUploadKey: questionData.questionImageUploadKey || null,
      video: videoValue,
      media: mediaValue, // Should be fine now
      question: formQuestion,
      title: formTitle,
      description: formDescription,
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
    // Fallback for new question
    const defaultNewQuestion = createDefaultQuestion("quiz") as QuestionHost; // Assume default is 'quiz'
    // createDefaultQuestion should provide a QuestionHost with relevant fields initialized
    // For "quiz" type, it will have 'question', and 'title'/'description' would be undefined/empty.
    // QuestionFormContextType (BaseQuestionSchema) allows all three as optional.

    return {
      type: defaultNewQuestion.type, // "quiz"
      image: defaultNewQuestion.image ?? null,
      imageFile: defaultNewQuestion.imageFile || null,
      questionImageUploadKey: defaultNewQuestion.questionImageUploadKey || null,
      video: defaultNewQuestion.video
        ? {
            /* video mapping */ id: defaultNewQuestion.video.id,
            startTime: defaultNewQuestion.video.startTime ?? 0.0,
            endTime: defaultNewQuestion.video.endTime ?? 0.0,
            service: defaultNewQuestion.video.service ?? "youtube",
            fullUrl: defaultNewQuestion.video.fullUrl ?? "",
          }
        : defaultVideoSchemaValue,
      // This mapping should also be fine now
      media:
        defaultNewQuestion.media?.map((m) => ({
          /* media mapping */ type: m.type,
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
      question: defaultNewQuestion.question ?? "", // Should exist for 'quiz' type from createDefaultQuestion
      title: (defaultNewQuestion as any).title ?? "", // Initialize to empty if not present
      description: (defaultNewQuestion as any).description ?? "", // Initialize to empty if not present
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

// ... The rest of your useQuestionFormManagement hook remains the same ...
// Ensure that onValidSubmit correctly maps from validatedRHFData (QuestionFormContextType)
// back to QuestionHost, respecting the same logic for question/title/description.
// The onValidSubmit method in your previous version looked reasonable in how it constructed
// finalQuestionData by spreading validatedRHFData and then mapping choices.
// The crucial part is that validatedRHFData (which is QuestionFormContextType)
// already has question, title, description as optional fields from BaseQuestionSchema.

// Example of how onValidSubmit would ensure correct fields for QuestionHost:
// const onValidSubmit: SubmitHandler<QuestionFormContextType> = useCallback(
//   (validatedRHFData) => {
//     const currentIndex = currentSlideIndex;
//     let finalQuestionDataAsHost: Partial<QuestionHost> & Pick<QuestionHost, 'type' | 'choices'> = { // Start with a base
//         id: quizData?.questions?.[currentIndex]?.id,
//         type: validatedRHFData.type,
//         image: validatedRHFData.image || null,
//         imageFile: validatedRHFData.imageFile || null,
//         questionImageUploadKey: validatedRHFData.imageFile ? validatedRHFData.questionImageUploadKey : null,
//         video: validatedRHFData.video ? { ...validatedRHFData.video } : null,
//         media: validatedRHFData.media || [], // This should be fine due to schema fix
//         time: validatedRHFData.time,
//         pointsMultiplier: validatedRHFData.pointsMultiplier,
//         choices: [], // Will be populated below
//     };

//     // Add type-specific fields (question, title, description)
//     if (validatedRHFData.type === "content") {
//         finalQuestionDataAsHost.title = validatedRHFData.title;
//         finalQuestionDataAsHost.description = validatedRHFData.description;
//     } else {
//         finalQuestionDataAsHost.question = validatedRHFData.question;
//         // title & description are typically not on QuestionHost for other types
//     }

//     // Map choices (your existing logic for choices is generally okay, ensure correctness for quiz type)
//     if (validatedRHFData.type === "quiz") {
//       const selectedIndex = validatedRHFData.correctChoiceIndex ?? -1;
//       finalQuestionDataAsHost.choices = (validatedRHFData.choices || []).map((choice, idx) => ({
//         answer: choice.answer,
//         image: choice.image ? { ...choice.image } : undefined,
//         correct: idx === selectedIndex,
//       }));
//     } else {
//       finalQuestionDataAsHost.choices = (validatedRHFData.choices || []).map((choice) => ({
//         answer: choice.answer,
//         image: choice.image ? { ...choice.image } : undefined,
//         correct: choice.correct ?? true,
//       }));
//     }

//     onQuestionChange(currentIndex, finalQuestionDataAsHost as QuestionHost);
//     // ... rest of submit logic
//   },
//   // ... dependencies
// );

// Your existing useQuestionFormManagement structure:
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
    formState: { errors, isDirty: rhfIsDirty },
  } = methods;

  const watchedType = watch("type");
  // ... (other watched fields and refs from your code) ...
  const prevSlideIndexRef = useRef(currentSlideIndex);
  const prevWatchedTypeRef = useRef(watchedType);
  const isHandlingTypeChange = useRef(false);
  const [initialFormValues, setInitialFormValues] =
    useState<QuestionFormContextType | null>(null);

  useEffect(() => {
    if (currentSlideIndex >= 0) {
      const newDefaultValues = getDefaultValuesForEditor(
        quizData,
        currentSlideIndex
      );
      reset(newDefaultValues);
      setInitialFormValues(newDefaultValues);
      prevWatchedTypeRef.current = newDefaultValues.type;
    } else {
      setInitialFormValues(null);
    }
    prevSlideIndexRef.current = currentSlideIndex;
  }, [currentSlideIndex, quizData, reset]);

  const isFormTrulyDirty = useCallback(() => {
    // This function implementation from your code
    if (currentSlideIndex < 0 || !initialFormValues) return false;
    const currentValues = getValues();
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
      "questionImageUploadKey", // Ensure this is part of your comparison
      // "video", "media"
    ];
    for (const key of fieldsToCompare) {
      if (!simpleDeepCompare(currentValues[key], initialFormValues[key]))
        return true;
    }
    if (
      !simpleDeepCompare(currentValues.imageFile, initialFormValues.imageFile)
    )
      return true;
    return false;
  }, [getValues, initialFormValues, currentSlideIndex]);

  const onValidSubmit: SubmitHandler<QuestionFormContextType> = useCallback(
    (validatedRHFData) => {
      const currentIndex = currentSlideIndex;
      // Construct finalQuestionData (QuestionHost) from validatedRHFData (QuestionFormContextType)
      // This needs to carefully map fields, especially question/title/description based on type.

      const baseHostData: Omit<QuestionHost, "choices" | "id"> & {
        id?: string;
      } = {
        // id will be QuestionHost['id'], not QuestionFormContextType['id']
        type: validatedRHFData.type,
        image: validatedRHFData.image || null,
        imageFile: validatedRHFData.imageFile || null,
        questionImageUploadKey: validatedRHFData.imageFile
          ? validatedRHFData.questionImageUploadKey
          : null,
        video: validatedRHFData.video ? { ...validatedRHFData.video } : null,
        media: (validatedRHFData.media || []).map((m) => ({ ...m })), // Ensure deep copy of media items
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
        // For non-content, title/description are not primary QuestionHost fields
        // but BaseQuestionSchema allows them as optional. If you want to pass them through:
        // questionSpecificFields.title = validatedRHFData.title;
        // questionSpecificFields.description = validatedRHFData.description;
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
          correct: choice.correct ?? true, // For non-quiz types
        }));
      }

      const finalQuestionData: QuestionHost = {
        id: quizData?.questions?.[currentIndex]?.id, // Preserve existing ID
        ...baseHostData,
        ...questionSpecificFields,
        choices: finalChoices,
      };

      // Consistency check (as added in previous correct version)
      if (
        finalQuestionData.imageFile &&
        !finalQuestionData.questionImageUploadKey
      ) {
        console.error(
          `[useQuestionFormManagement onValidSubmit] Inconsistency: imageFile present for question but questionImageUploadKey is missing.`
        );
      } else if (
        !finalQuestionData.imageFile &&
        finalQuestionData.questionImageUploadKey
      ) {
        finalQuestionData.questionImageUploadKey = null;
      }

      onQuestionChange(currentIndex, finalQuestionData);

      const newDefaults = getDefaultValuesForEditor(quizData, currentIndex);
      reset(newDefaults, {
        keepValues: false,
        keepDirty: false,
        keepErrors: false,
      });
      setInitialFormValues(newDefaults);
      prevWatchedTypeRef.current = validatedRHFData.type;
    },
    [
      currentSlideIndex,
      onQuestionChange,
      reset,
      quizData,
      setInitialFormValues,
      getValues,
    ] // getValues if used inside
  );

  // ... rest of your hook: onInvalidSubmit, triggerSave, handleTypeChange, useEffects ...
  // These should generally remain the same, ensure they use the corrected data structures.
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
        (c: ChoiceHostSchemaType) => c.answer?.toLowerCase() === "true"
      ) &&
      currentValues.choices.some(
        (c: ChoiceHostSchemaType) => c.answer?.toLowerCase() === "false"
      );

    const transformedDataForValidation = transformQuestionDataForType(
      currentValues,
      currentType,
      isCurrentTF
    );

    const needsResetForValidation = !simpleDeepCompare(
      currentValues,
      transformedDataForValidation
    );
    if (needsResetForValidation) {
      reset(transformedDataForValidation, {
        keepDefaultValues: false,
        keepDirty: isFormTrulyDirty(), // Use your custom dirty check
        keepErrors: false,
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    if (!isFormTrulyDirty() && !needsResetForValidation) {
      return true;
    }

    await handleSubmit(onValidSubmit, onInvalidSubmit)();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const finalErrors = methods.formState.errors;
    const isValid = Object.keys(finalErrors).length === 0;
    return isValid;
  }, [
    currentSlideIndex,
    isFormTrulyDirty,
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
        // This is QuestionFormContextType
        currentValues,
        newType,
        isTrueFalseOverride
      );

      // Preserve imageFile and questionImageUploadKey if they exist in currentValues
      if (currentValues.imageFile) {
        transformedData.imageFile = currentValues.imageFile;
        transformedData.image = currentValues.image; // Also preserve objectURL
        transformedData.questionImageUploadKey =
          currentValues.questionImageUploadKey;
      }

      reset(transformedData, {
        keepDefaultValues: false,
        keepDirty: true,
        keepErrors: false,
      });
      setInitialFormValues(transformedData);
      prevWatchedTypeRef.current = newType;

      await new Promise((resolve) => setTimeout(resolve, 0));
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

      // Re-parse and map to QuestionHost for onQuestionChange
      const parseResult = QuestionHostSchema.safeParse(transformedData); // transformedData is QuestionFormContextType
      let finalQuestionHostData: QuestionHost | null = null;

      if (parseResult.success) {
        const validatedDataFromParse = parseResult.data; // This is QuestionHostSchemaType (discriminated union)

        // Map QuestionHostSchemaType to QuestionHost
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
          // For quiz, jumble, open_ended, survey
          questionSpecificPortion.question = validatedDataFromParse.question;
        }

        let hostChoices: ChoiceHost[] = [];
        if (validatedDataFromParse.type === "quiz") {
          const selectedIndex =
            (transformedData as QuestionFormContextType).correctChoiceIndex ??
            -1; // Use correctChoiceIndex from RHF data before it's lost
          hostChoices = (validatedDataFromParse.choices || []).map(
            (choice, idx) => ({
              answer: choice.answer,
              image: choice.image ? { ...choice.image } : undefined,
              correct: idx === selectedIndex,
            })
          );
        } else if (validatedDataFromParse.choices) {
          // For jumble, survey, open_ended (acceptable answers)
          hostChoices = (validatedDataFromParse.choices || []).map(
            (choice) => ({
              answer: choice.answer,
              image: choice.image ? { ...choice.image } : undefined,
              correct: choice.correct ?? true,
            })
          );
        }

        finalQuestionHostData = {
          id: quizData?.questions?.[currentIndex]?.id, // Preserve existing ID
          ...baseHostPortion,
          ...questionSpecificPortion,
          choices: hostChoices,
        };
      } else {
        console.error(
          "Zod parsing failed after type change (handleTypeChange):",
          parseResult.error.flatten()
        );
        toast({
          title: "Internal Error",
          description: "Could not prepare data structure after type change.",
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
      quizData?.questions,
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
      prevWatchedTypeRef.current = currentRhfType;
    }
  }, [watchedType, getValues, handleTypeChange]); // watchedType from RHF

  return {
    methods,
    isDirty: isFormTrulyDirty(),
    errors,
    watchedType,
    triggerSave,
    handleTypeChange,
  };
}
