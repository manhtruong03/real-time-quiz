// src/app/my-quizzes/hooks/useMyQuizzesData.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchMyQuizzes } from "@/src/lib/api/quizzes";
import type { QuizDTO, Page } from "@/src/lib/types/api";

export const useMyQuizzesData = () => {
  const [quizzes, setQuizzes] = useState<QuizDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuizzes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const quizPage: Page<QuizDTO> = await fetchMyQuizzes({
        page: 0,
        size: 20,
        sort: "modifiedAt,desc",
      });
      setQuizzes(quizPage.content || []);
    } catch (err: any) {
      console.error("Failed to fetch quizzes:", err);
      setError(err.message || "Could not load your quizzes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  return { quizzes, isLoading, error, loadQuizzes, setQuizzes }; // Exposing setQuizzes for potential use in quiz actions
};
