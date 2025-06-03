// src/hooks/quiz-editor/creator-utils/quizQuestionManager.ts
import { useCallback } from "react";
import type {
  QuestionHost,
  QuizStructureHost,
} from "@/src/lib/types/quiz-structure";
import { createDefaultEditorQuestion } from "./defaultQuizValues"; // Use the new local helper

interface QuizQuestionManagerArgs {
  setQuizData: React.Dispatch<React.SetStateAction<QuizStructureHost>>;
  currentSlideIndex: number; // Keep for context in delete/duplicate
  setCurrentSlideIndex: React.Dispatch<React.SetStateAction<number>>;
}

export function useQuizQuestionManager({
  setQuizData,
  currentSlideIndex,
  setCurrentSlideIndex,
}: QuizQuestionManagerArgs) {
  const addQuestion = useCallback(
    (type: QuestionHost["type"], isTrueFalse: boolean = false): number => {
      const newQuestion = createDefaultEditorQuestion(type, isTrueFalse);
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
      if (finalQuestionData === null) {
        console.error(
          `[QuestionManager] Update failed for index ${index} because incoming data was null.`
        );
        return;
      }
      if (
        finalQuestionData.imageFile &&
        !finalQuestionData.questionImageUploadKey
      ) {
        console.warn(
          `[QuestionManager] Updating question ${index}: imageFile exists but questionImageUploadKey is missing.`
        );
      } else if (
        !finalQuestionData.imageFile &&
        finalQuestionData.questionImageUploadKey
      ) {
        finalQuestionData.questionImageUploadKey = null;
      }

      setQuizData((prevData) => {
        if (index < 0 || index >= prevData.questions.length) {
          console.error(
            `[QuestionManager] Invalid index ${index} for updateQuestion.`
          );
          return prevData;
        }
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
    (indexToDelete: number) => {
      let newCurrentSlideIndexValue = currentSlideIndex;
      setQuizData((prevData) => {
        if (indexToDelete < 0 || indexToDelete >= prevData.questions.length) {
          newCurrentSlideIndexValue = prevData.questions.length > 0 ? 0 : -1;
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
        }
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

  const duplicateQuestion = useCallback(
    (indexToDuplicate: number): number => {
      let newSlideIndex = -1;
      setQuizData((prevData) => {
        if (
          indexToDuplicate < 0 ||
          indexToDuplicate >= prevData.questions.length
        ) {
          return prevData;
        }
        const originalQuestion = prevData.questions[indexToDuplicate];
        const duplicatedQuestionData = JSON.parse(
          JSON.stringify(originalQuestion)
        ) as Omit<QuestionHost, "imageFile" | "questionImageUploadKey">;

        const duplicatedQuestion: QuestionHost = {
          ...duplicatedQuestionData,
          id: undefined,
          imageFile: null,
          questionImageUploadKey: null,
        };
        const updatedQuestions = [...prevData.questions];
        const insertionPoint = indexToDuplicate + 1;
        updatedQuestions.splice(insertionPoint, 0, duplicatedQuestion);
        newSlideIndex = insertionPoint;
        return {
          ...prevData,
          questions: updatedQuestions,
          modified: Date.now(),
        };
      });
      setCurrentSlideIndex(newSlideIndex);
      return newSlideIndex;
    },
    [setQuizData, setCurrentSlideIndex]
  );

  return {
    addQuestion,
    updateQuestion,
    deleteQuestion,
    duplicateQuestion,
  };
}
