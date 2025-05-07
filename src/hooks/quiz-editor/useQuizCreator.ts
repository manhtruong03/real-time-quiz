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
  ChoiceHost, // Import ChoiceHost if needed for types
} from "@/src/lib/types/quiz-structure";
import type {
  QuestionFormContextType,
  ChoiceHostSchemaType,
} from "@/src/lib/schemas/quiz-question.schema"; // Import types
import { createDefaultQuestion } from "@/src/lib/game-utils/quiz-creation";

// ... createDefaultQuizShell ...
const createDefaultQuizShell = (): QuizStructureHost => ({
  // ... (contents remain the same) ...
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
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(-1);
  const formMethods = useForm<QuizMetadataSchemaType>({
    resolver: zodResolver(QuizMetadataSchema),
    defaultValues: {
      title: quizData.title,
      description: quizData.description,
      visibility:
        quizData.visibility === 1
          ? QuizVisibilityEnum.enum.PUBLIC
          : QuizVisibilityEnum.enum.PRIVATE,
      tags: [],
      cover: quizData.cover || null,
    },
    mode: "onChange",
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
      // tags: quizData.tags || [], // Uncomment if/when tags are added to QuizStructureHost
      cover: quizData.cover || null,
    });
  }, [
    quizData.title,
    quizData.description,
    quizData.visibility,
    quizData.cover,
    // quizData.tags, // Uncomment if/when tags are added
    resetForm,
  ]);

  const updateQuizMetadata = useCallback(
    (data: QuizMetadataSchemaType) => {
      setQuizData((prevData) => ({
        ...prevData,
        title: data.title,
        description: data.description ?? "",
        visibility: data.visibility === QuizVisibilityEnum.enum.PUBLIC ? 1 : 0,
        // tags: data.tags, // Uncomment if/when tags are added
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
      return newIndex;
    },
    [setQuizData]
  );

  const updateQuestion = useCallback(
    // --- FIX: Expect QuestionHost | null, NOT QuestionFormContextType ---
    (index: number, finalQuestionData: QuestionHost | null) => {
      console.log(
        `[useQuizCreator updateQuestion] Called for index ${index}. Incoming type: ${
          finalQuestionData?.type ?? "null"
        }` // Log incoming
      );

      if (finalQuestionData === null) {
        console.error(
          `[useQuizCreator] Update failed for index ${index} because incoming data was null (likely validation error upstream).`
        );
        // Optionally show a toast or handle error state
        return; // Stop update
      }

      // --- REMOVE Transformation logic - Data is already transformed ---
      // No need to check correctChoiceIndex or map choices here.
      // The data received *is* the final QuestionHost structure.
      // -------------------------------------------------------------

      setQuizData((prevData) => {
        if (index < 0 || index >= prevData.questions.length) {
          console.error(
            `[useQuizCreator] Invalid index ${index} for updateQuestion.`
          );
          return prevData;
        }
        // Directly use the finalQuestionData received
        console.log(
          `[useQuizCreator] Successfully updating question at index ${index} with:`,
          JSON.stringify(finalQuestionData, null, 2)
        );
        const updatedQuestions = [...prevData.questions];
        // *** ADD Log BEFORE update ***
        console.log(
          `[useQuizCreator updateQuestion] Question type at index ${index} BEFORE update: ${updatedQuestions[index]?.type}`
        );
        updatedQuestions[index] = finalQuestionData;
        // *** ADD Log AFTER update ***
        console.log(
          `[useQuizCreator updateQuestion] Question type at index ${index} AFTER update: ${updatedQuestions[index]?.type}`
        );

        console.log(
          `[useQuizCreator updateQuestion] Setting new state. Modified timestamp: ${Date.now()}`
        ); // Log state set time

        return {
          ...prevData,
          questions: updatedQuestions,
          modified: Date.now(),
        };
      });
    },
    [setQuizData]
  );

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
    setQuizData,
    currentSlideIndex,
    setCurrentSlideIndex,
    formMethods,
    updateQuizMetadata,
    handleMetadataSubmit,
    addQuestion,
    updateQuestion,
    resetCreatorState,
  };
}
