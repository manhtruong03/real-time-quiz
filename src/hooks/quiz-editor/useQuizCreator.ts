// src/hooks/quiz-editor/useQuizCreator.ts
import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  QuizMetadataSchema,
  QuizMetadataSchemaType,
  QuizVisibilityEnum,
} from "@/src/lib/schemas/quiz-settings.schema";
import type {
  QuestionHost,
  QuizStructureHost,
  ChoiceHost,
} from "@/src/lib/types/quiz-structure";
import type {
  QuestionFormContextType,
  ChoiceHostSchemaType,
} from "@/src/lib/schemas/quiz-question.schema";
import { createDefaultQuestion } from "@/src/lib/game-utils/quiz-creation";

const createDefaultQuizShell = (): QuizStructureHost => ({
  uuid: "", // Will be generated on actual save
  creator: "", // Will be set based on logged-in user
  creator_username: "",
  visibility: 0, // Default to Private (0)
  title: "",
  description: "",
  quizType: "quiz",
  cover: "",
  lobby_video: {
    youtube: {
      id: "",
      startTime: 0.0,
      endTime: 0.0,
      service: "youtube",
      fullUrl: "",
    },
  },
  questions: [],
  isValid: false,
  playAsGuest: true,
  type: "quiz",
  created: Date.now(),
  modified: Date.now(),
});

export function useQuizCreator() {
  const [quizData, setQuizData] = useState<QuizStructureHost>(
    createDefaultQuizShell()
  );
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(-1); // -1 means settings or no slide selected

  const formMethods = useForm<QuizMetadataSchemaType>({
    resolver: zodResolver(QuizMetadataSchema),
    defaultValues: {
      title: quizData.title,
      description: quizData.description,
      visibility:
        quizData.visibility === 1
          ? QuizVisibilityEnum.enum.PUBLIC
          : QuizVisibilityEnum.enum.PRIVATE,
      tags: [], // quizData.tags || [], // Assuming tags might be added to QuizStructureHost later
      cover: quizData.cover || null,
    },
    mode: "onChange", // Or "onBlur"
  });

  const { reset: resetForm, handleSubmit: handleMetadataSubmit } = formMethods;

  useEffect(() => {
    resetForm({
      title: quizData.title,
      description: quizData.description,
      visibility:
        quizData.visibility === 1
          ? QuizVisibilityEnum.enum.PUBLIC
          : QuizVisibilityEnum.enum.PRIVATE,
      tags: (quizData as any).tags || [], // Assuming tags might be added later
      cover: quizData.cover || null,
    });
  }, [
    quizData.title,
    quizData.description,
    quizData.visibility,
    quizData.cover,
    // (quizData as any).tags,
    resetForm,
  ]);

  const updateQuizMetadata = useCallback(
    (data: QuizMetadataSchemaType) => {
      setQuizData((prevData) => ({
        ...prevData,
        title: data.title,
        description: data.description ?? "",
        visibility: data.visibility === QuizVisibilityEnum.enum.PUBLIC ? 1 : 0,
        tags: data.tags,
        cover: data.cover ?? "",
        modified: Date.now(),
      }));
    },
    [setQuizData]
  );

  const addQuestion = useCallback(
    (type: QuestionHost["type"], isTrueFalse: boolean = false): number => {
      const newQuestion = createDefaultQuestion(type, isTrueFalse);
      let newIndex = 0;
      setQuizData((prevData) => {
        const currentQuestions = prevData.questions || [];
        const updatedQuestions = [...currentQuestions, newQuestion];
        newIndex = updatedQuestions.length - 1;
        return {
          ...prevData,
          questions: updatedQuestions,
          modified: Date.now(),
        };
      });
      return newIndex; // Return the index of the newly added question
    },
    [setQuizData]
  );

  const updateQuestion = useCallback(
    (index: number, finalQuestionData: QuestionHost | null) => {
      console.log(
        `[useQuizCreator updateQuestion] Called for index ${index}. Incoming type: ${
          finalQuestionData?.type ?? "null"
        }`
      );
      if (finalQuestionData === null) {
        console.error(
          `[useQuizCreator] Update failed for index ${index} because incoming data was null.`
        );
        return;
      }
      setQuizData((prevData) => {
        if (index < 0 || index >= prevData.questions.length) {
          console.error(
            `[useQuizCreator] Invalid index ${index} for updateQuestion.`
          );
          return prevData;
        }
        console.log(
          `[useQuizCreator] Successfully updating question at index ${index}`
        );
        const updatedQuestions = [...prevData.questions];
        updatedQuestions[index] = finalQuestionData;
        return {
          ...prevData,
          questions: updatedQuestions,
          modified: Date.now(),
        };
      });
    },
    [setQuizData]
  );

  const deleteQuestion = useCallback(
    // ... (same as before, ensure setCurrentSlideIndex is called correctly)
    (indexToDelete: number) => {
      console.log(
        `[useQuizCreator] Attempting to delete question at index: ${indexToDelete}`
      );
      let newCurrentSlideIndexValue = currentSlideIndex;

      setQuizData((prevData) => {
        if (indexToDelete < 0 || indexToDelete >= prevData.questions.length) {
          console.warn(
            `[useQuizCreator] Invalid index ${indexToDelete} for deletion. No changes made.`
          );
          newCurrentSlideIndexValue = prevData.questions.length > 0 ? 0 : -1; // Fallback if index was bad
          return prevData;
        }

        const updatedQuestions = prevData.questions.filter(
          (_, index) => index !== indexToDelete
        );

        if (updatedQuestions.length === 0) {
          newCurrentSlideIndexValue = -1;
        } else if (indexToDelete < currentSlideIndex) {
          newCurrentSlideIndexValue = currentSlideIndex - 1;
        } else if (indexToDelete === currentSlideIndex) {
          newCurrentSlideIndexValue = Math.min(
            indexToDelete,
            updatedQuestions.length - 1
          );
          if (newCurrentSlideIndexValue < 0 && updatedQuestions.length > 0)
            newCurrentSlideIndexValue = 0;
          else if (updatedQuestions.length === 0)
            newCurrentSlideIndexValue = -1;
        } else {
          newCurrentSlideIndexValue = currentSlideIndex;
        }
        console.log(
          `[useQuizCreator internal] Intended new currentSlideIndex after deletion: ${newCurrentSlideIndexValue}`
        );
        return {
          ...prevData,
          questions: updatedQuestions,
          modified: Date.now(),
        };
      });
      setCurrentSlideIndex(newCurrentSlideIndexValue);
    },
    [setQuizData, currentSlideIndex, setCurrentSlideIndex]
  );

  // --- Phase Dup1: Add duplicateQuestion function ---
  const duplicateQuestion = useCallback(
    (indexToDuplicate: number): number => {
      console.log(
        `[useQuizCreator] Attempting to duplicate question at index: ${indexToDuplicate}`
      );
      let newSlideIndex = -1;

      setQuizData((prevData) => {
        if (
          indexToDuplicate < 0 ||
          indexToDuplicate >= prevData.questions.length
        ) {
          console.warn(
            `[useQuizCreator] Invalid index ${indexToDuplicate} for duplication. No changes made.`
          );
          return prevData;
        }

        const originalQuestion = prevData.questions[indexToDuplicate];
        // Deep copy the question object
        // For plain JSON-like data, JSON.parse(JSON.stringify()) is a common way.
        // If QuestionHost contained Dates, Functions, or undefined values that need preservation,
        // a more robust deep cloning method would be needed. For now, this should suffice.
        const duplicatedQuestion = JSON.parse(
          JSON.stringify(originalQuestion)
        ) as QuestionHost;

        // Optional: Modify any properties of the duplicatedQuestion if needed,
        // e.g., if questions had unique IDs, generate a new one here.
        // For now, it's a true structural copy.

        const updatedQuestions = [...prevData.questions];
        const insertionPoint = indexToDuplicate + 1;
        updatedQuestions.splice(insertionPoint, 0, duplicatedQuestion);

        newSlideIndex = insertionPoint; // The index of the new duplicated slide

        console.log(
          `[useQuizCreator] Duplicated question inserted at index: ${newSlideIndex}`
        );
        return {
          ...prevData,
          questions: updatedQuestions,
          modified: Date.now(),
        };
      });

      // Set the current slide index to the newly duplicated slide
      setCurrentSlideIndex(newSlideIndex);
      return newSlideIndex; // Return the index for the calling component
    },
    [setQuizData, setCurrentSlideIndex]
  );
  // --- End Phase Dup1 ---

  const resetCreatorState = useCallback(() => {
    const initialQuiz = createDefaultQuizShell();
    setQuizData(initialQuiz);
    resetForm({
      title: initialQuiz.title,
      description: initialQuiz.description,
      visibility:
        initialQuiz.visibility === 1
          ? QuizVisibilityEnum.enum.PUBLIC
          : QuizVisibilityEnum.enum.PRIVATE,
      tags: [],
      cover: initialQuiz.cover || null,
    });
    setCurrentSlideIndex(-1);
    console.log("useQuizCreator: State reset to default shell");
  }, [setQuizData, setCurrentSlideIndex, resetForm]);

  return {
    quizData,
    setQuizData, // Keep exposing this for direct manipulation if absolutely needed
    currentSlideIndex,
    setCurrentSlideIndex,
    formMethods,
    updateQuizMetadata,
    handleMetadataSubmit, // RHF's handleSubmit wrapped
    addQuestion,
    updateQuestion,
    deleteQuestion, // Expose the new function
    duplicateQuestion,
    resetCreatorState,
  };
}
