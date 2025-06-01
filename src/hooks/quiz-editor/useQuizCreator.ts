// src/hooks/quiz-editor/useQuizCreator.ts
import { useState, useCallback } from "react";
import type { QuizStructureHost } from "@/src/lib/types/quiz-structure";
import { QuizVisibilityEnum } from "@/src/lib/schemas/quiz-settings.schema";

import { createDefaultQuizShell } from "./creator-utils/defaultQuizValues";
import { useQuizMetadataForm } from "./creator-utils/quizMetadataHandler";
import { useQuizQuestionManager } from "./creator-utils/quizQuestionManager";

export function useQuizCreator() {
  const [quizData, setQuizData] = useState<QuizStructureHost>(
    createDefaultQuizShell()
  );
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(-1);

  const {
    metadataFormMethods,
    handleMetadataSubmit,
    updateQuizMetadataDirectly, // <-- Get this
    resetMetadataForm,
  } = useQuizMetadataForm({ quizData, setQuizData });

  const { addQuestion, updateQuestion, deleteQuestion, duplicateQuestion } =
    useQuizQuestionManager({
      setQuizData,
      currentSlideIndex,
      setCurrentSlideIndex,
    });

  const resetCreatorState = useCallback(() => {
    const initialQuiz = createDefaultQuizShell();
    setQuizData(initialQuiz);
    resetMetadataForm({
      title: initialQuiz.title,
      description: initialQuiz.description,
      visibility:
        initialQuiz.visibility === 1
          ? QuizVisibilityEnum.enum.PUBLIC
          : QuizVisibilityEnum.enum.PRIVATE,
      tags: initialQuiz.tags || [],
      cover: initialQuiz.cover || null,
      coverImageFile: null,
      coverImageUploadKey: null,
    });
    setCurrentSlideIndex(-1);
    // console.log("useQuizCreator: State reset to default shell"); // Keep for debugging if needed
  }, [setQuizData, resetMetadataForm, setCurrentSlideIndex]);

  return {
    quizData,
    setQuizData,
    currentSlideIndex,
    setCurrentSlideIndex,
    formMethods: metadataFormMethods,
    handleMetadataSubmit, // This is RHF's handleSubmit(updateQuizMetadataDirectly)
    updateQuizMetadataDirectly, // <--- Export this for useQuizViewManager
    addQuestion,
    updateQuestion,
    deleteQuestion,
    duplicateQuestion,
    resetCreatorState,
  };
}
