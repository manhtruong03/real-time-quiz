import { useState, useEffect, useCallback, useMemo } from "react";
import { getSessionQuestionsReport } from "@/src/lib/api/reports"; //
import type { Page, PageableParams } from "@/src/lib/types/api"; //
import type { QuestionReportItemDto } from "@/src/lib/types/reports"; //

const DEBOUNCE_DELAY = 500;
const DIFFICULT_QUESTION_THRESHOLD = 0.35;

export type QuestionFilterType = "all" | "difficult";

interface UseSessionQuestionsDataProps {
  sessionId: string | null;
  pageSize?: number;
  initialSortProperty?: keyof QuestionReportItemDto | string;
  initialSortDirection?: "asc" | "desc";
}

interface UseSessionQuestionsDataReturn {
  displayedQuestions: QuestionReportItemDto[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  loadMore: () => void;
  hasMore: boolean;
  retryLoad: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeFilter: QuestionFilterType;
  setActiveFilter: (filter: QuestionFilterType) => void;
  sortBy: (newSortProperty: keyof QuestionReportItemDto | string) => void;
  currentSortProperty: keyof QuestionReportItemDto | string;
  currentSortDirection: "asc" | "desc";
  totalDisplayedQuestions: number;
}

const useSessionQuestionsData = ({
  sessionId,
  pageSize = 5,
  initialSortProperty = "slideIndex",
  initialSortDirection = "asc",
}: UseSessionQuestionsDataProps): UseSessionQuestionsDataReturn => {
  const [allFetchedQuestions, setAllFetchedQuestions] = useState<
    QuestionReportItemDto[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const [currentPageForApi, setCurrentPageForApi] = useState<number>(0);
  const [totalPagesFromApi, setTotalPagesFromApi] = useState<number>(0);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<QuestionFilterType>("all");

  const [currentSortProperty, setCurrentSortProperty] = useState<
    keyof QuestionReportItemDto | string
  >(initialSortProperty);
  const [currentSortDirection, setCurrentSortDirection] = useState<
    "asc" | "desc"
  >(initialSortDirection);

  useEffect(() => {
    const timerId = setTimeout(
      () => setDebouncedSearchTerm(searchTerm),
      DEBOUNCE_DELAY
    );
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  const fetchAndProcessQuestions = useCallback(
    async (pageToFetch: number, isLoadMore: boolean) => {
      if (!sessionId) {
        setAllFetchedQuestions([]);
        setCurrentPageForApi(0);
        setTotalPagesFromApi(0);
        setError(null);
        setIsLoading(false);
        setIsLoadingMore(false);
        return;
      }

      if (isLoadMore) setIsLoadingMore(true);
      else setIsLoading(true);
      setError(null);

      const params: PageableParams = {
        page: pageToFetch,
        size: pageSize,
      };

      try {
        const data: Page<QuestionReportItemDto> =
          await getSessionQuestionsReport(sessionId, params);
        setAllFetchedQuestions((prev) =>
          isLoadMore ? [...prev, ...data.content] : data.content
        );
        setCurrentPageForApi(data.number);
        setTotalPagesFromApi(data.totalPages);
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to load question reports")
        );
        if (!isLoadMore) setAllFetchedQuestions([]);
      } finally {
        if (isLoadMore) setIsLoadingMore(false);
        else setIsLoading(false);
      }
    },
    [sessionId, pageSize]
  );

  useEffect(() => {
    if (sessionId) {
      setAllFetchedQuestions([]);
      setCurrentPageForApi(0);
      fetchAndProcessQuestions(0, false);
    } else {
      setAllFetchedQuestions([]);
      setCurrentPageForApi(0);
      setTotalPagesFromApi(0);
      setError(null);
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [sessionId, fetchAndProcessQuestions]);

  const loadMore = () => {
    if (!isLoadingMore && currentPageForApi < totalPagesFromApi - 1) {
      fetchAndProcessQuestions(currentPageForApi + 1, true);
    }
  };

  const sortBy = (newSortProperty: keyof QuestionReportItemDto | string) => {
    const newDirection =
      currentSortProperty === newSortProperty && currentSortDirection === "asc"
        ? "desc"
        : "asc";
    setCurrentSortProperty(newSortProperty);
    setCurrentSortDirection(newDirection);
  };

  const retryLoad = () => {
    setAllFetchedQuestions([]);
    setCurrentPageForApi(0);
    fetchAndProcessQuestions(0, false);
  };

  const displayedQuestions = useMemo(() => {
    if (!allFetchedQuestions) return [];

    let filtered = [...allFetchedQuestions];

    if (activeFilter === "difficult") {
      filtered = filtered.filter(
        (q) =>
          q.averageAccuracy !== null &&
          q.averageAccuracy !== undefined &&
          q.averageAccuracy < DIFFICULT_QUESTION_THRESHOLD
      );
    }

    if (debouncedSearchTerm) {
      const lowercasedSearchTerm = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter((question) => {
        if (question.title.toLowerCase().includes(lowercasedSearchTerm)) {
          return true;
        }
        if (question.choices && Array.isArray(question.choices)) {
          for (const choice of question.choices) {
            if (
              choice.answer &&
              typeof choice.answer === "string" &&
              choice.answer.toLowerCase().includes(lowercasedSearchTerm)
            ) {
              return true;
            }
          }
        }
        return false;
      });
    }

    // Updated client-side sorting logic
    if (currentSortProperty) {
      filtered.sort((a, b) => {
        let comparison = 0;

        if (currentSortProperty === "slideIndex") {
          comparison = (a.slideIndex || 0) - (b.slideIndex || 0);
        } else if (currentSortProperty === "averageAccuracy") {
          // Default null, undefined, or non-numeric averageAccuracy to 0 for sorting
          const valA =
            a.averageAccuracy === null || a.averageAccuracy === undefined
              ? -0.5
              : Number(a.averageAccuracy);
          const valB =
            b.averageAccuracy === null || b.averageAccuracy === undefined
              ? -0.5
              : Number(b.averageAccuracy);

          comparison = valA - valB;
        }

        return currentSortDirection === "asc" ? comparison : -comparison;
      });
    }
    return filtered;
  }, [
    allFetchedQuestions,
    debouncedSearchTerm,
    activeFilter,
    currentSortProperty,
    currentSortDirection,
  ]);

  const hasMore = currentPageForApi < totalPagesFromApi - 1;

  return {
    displayedQuestions,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    hasMore,
    retryLoad,
    searchTerm,
    setSearchTerm,
    activeFilter,
    setActiveFilter,
    sortBy,
    currentSortProperty,
    currentSortDirection,
    totalDisplayedQuestions: displayedQuestions.length,
  };
};

export default useSessionQuestionsData;
