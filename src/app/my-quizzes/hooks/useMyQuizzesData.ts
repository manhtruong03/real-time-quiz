// src/app/my-quizzes/hooks/useMyQuizzesData.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchMyQuizzes } from "@/src/lib/api/quizzes"; //
import type { QuizDTO, Page } from "@/src/lib/types/api"; //

const PAGE_SIZE = 10; // Define page size, can be configured if needed later

export const useMyQuizzesData = () => {
  const [quizzes, setQuizzes] = useState<QuizDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0); // API pages are 0-indexed
  const [totalPages, setTotalPages] = useState(0);

  const loadQuizzes = useCallback(async (pageToLoad: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch quizzes for the specified page
      const quizPage: Page<QuizDTO> = await fetchMyQuizzes({
        page: pageToLoad,
        size: PAGE_SIZE,
        sort: "modifiedAt,desc",
      });
      setQuizzes(quizPage.content || []);
      setTotalPages(quizPage.totalPages || 0);
      setCurrentPage(quizPage.number || 0); // Current page from the API response
    } catch (err: any) {
      console.error("Failed to fetch quizzes:", err);
      setError(err.message || "Could not load your quizzes.");
      // Optionally reset quizzes, totalPages if fetch fails
      setQuizzes([]);
      setTotalPages(0);
      setCurrentPage(0);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array for useCallback, as PAGE_SIZE is constant here

  useEffect(() => {
    // Load the initial page (page 0) when the hook mounts
    loadQuizzes(0);
  }, [loadQuizzes]);

  const goToPage = (pageNumber: number) => {
    if (
      pageNumber >= 0 &&
      pageNumber < totalPages &&
      pageNumber !== currentPage
    ) {
      loadQuizzes(pageNumber);
    }
  };

  return {
    quizzes,
    isLoading,
    error,
    loadQuizzes, // Exposing this if direct reload of current page needed elsewhere
    setQuizzes, // Still needed for optimistic updates by useQuizActions
    currentPage,
    totalPages,
    goToPage,
  };
};
