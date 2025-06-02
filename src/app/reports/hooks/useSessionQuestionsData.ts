import { useState, useEffect, useCallback } from "react";
import { getSessionQuestionsReport } from "@/src/lib/api/reports";
import type { Page, PageableParams } from "@/src/lib/types/api";
import type { QuestionReportItemDto } from "@/src/lib/types/reports";

interface UseSessionQuestionsDataProps {
  sessionId: string | null;
  initialPage?: number;
  pageSize?: number;
}

interface UseSessionQuestionsDataReturn {
  questionsData: Page<QuestionReportItemDto> | null;
  isLoading: boolean;
  error: Error | null;
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
  loadQuestions: (
    pageToLoad: number,
    customParams?: Partial<PageableParams>
  ) => Promise<void>;
}

const useSessionQuestionsData = ({
  sessionId,
  initialPage = 0,
  pageSize = 10, // Default page size, can be overridden
}: UseSessionQuestionsDataProps): UseSessionQuestionsDataReturn => {
  const [questionsData, setQuestionsData] =
    useState<Page<QuestionReportItemDto> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(0);

  const loadQuestions = useCallback(
    async (pageToLoad: number, customParams?: Partial<PageableParams>) => {
      if (!sessionId) {
        setQuestionsData(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params: PageableParams = {
          page: pageToLoad,
          size: pageSize,
          sort: ["slideIndex,asc"], // Default sort
          ...customParams, // Allow overriding sort or other params if needed
        };
        const data = await getSessionQuestionsReport(sessionId, params);
        setQuestionsData(data);
        setCurrentPage(data.number);
        setTotalPages(data.totalPages);
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to load question reports")
        );
        setQuestionsData(null); // Clear data on error
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, pageSize]
  );

  useEffect(() => {
    // Initial load when sessionId is available or changes
    if (sessionId) {
      loadQuestions(initialPage);
    } else {
      // Clear data if sessionId becomes null (e.g., navigating away)
      setQuestionsData(null);
      setCurrentPage(initialPage);
      setTotalPages(0);
      setError(null);
      setIsLoading(false);
    }
  }, [sessionId, initialPage, loadQuestions]);

  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages && page !== currentPage) {
      loadQuestions(page);
    }
  };

  return {
    questionsData,
    isLoading,
    error,
    currentPage,
    totalPages,
    goToPage,
    loadQuestions, // Exposing loadQuestions for potential manual refresh/re-sort later
  };
};

export default useSessionQuestionsData;
