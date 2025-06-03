// Path: @/src/app/reports/sessions/[sessionId]/hooks/useSessionPlayersData.ts
import { useState, useEffect, useCallback } from "react";
import { getSessionPlayersReport } from "@/src/lib/api/reports";
import type { Page, PageableParams } from "@/src/lib/types/api";
import type { PlayerReportItemDto } from "@/src/lib/types/reports";

const ITEMS_PER_PAGE = 10; // Default items per page, matches screen-10-report-player.html
const DEFAULT_SORT_PROPERTY = "rank"; // Default sort property
const DEFAULT_SORT_DIRECTION = "asc"; // Default sort direction
const DEBOUNCE_DELAY = 500; // 500ms for search debounce

interface UseSessionPlayersDataReturn {
  playersData: Page<PlayerReportItemDto> | null;
  isLoading: boolean;
  error: Error | null;
  currentPage: number; // 0-indexed
  totalPages: number;
  setPage: (page: number) => void; // Expects 0-indexed page
  sortBy: (newSortProperty: keyof PlayerReportItemDto | string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  currentSort: {
    property: keyof PlayerReportItemDto | string;
    direction: "asc" | "desc";
  };
  itemsPerPage: number;
}

export const useSessionPlayersData = (
  sessionId: string
): UseSessionPlayersDataReturn => {
  const [playersData, setPlayersData] =
    useState<Page<PlayerReportItemDto> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(0);
  const [currentSort, setCurrentSort] = useState({
    property: DEFAULT_SORT_PROPERTY,
    direction: DEFAULT_SORT_DIRECTION as "asc" | "desc",
  });
  const [internalSearchTerm, setInternalSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");

  // Debounce search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(internalSearchTerm);
      setCurrentPage(0); // Reset to first page on new search
    }, DEBOUNCE_DELAY);

    return () => {
      clearTimeout(timerId);
    };
  }, [internalSearchTerm]);

  const fetchPlayers = useCallback(async () => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const pageable: PageableParams = {
      page: currentPage,
      size: ITEMS_PER_PAGE,
      sort: [`${currentSort.property},${currentSort.direction}`],
    };

    // Note: The current API spec for getSessionPlayersReport doesn't include a search parameter.
    // If the API is updated to support search, the `debouncedSearchTerm` should be passed here.
    // For now, filtering based on `debouncedSearchTerm` will need to be client-side.

    try {
      const data = await getSessionPlayersReport(sessionId, pageable);
      setPlayersData(data);
    } catch (e) {
      setError(
        e instanceof Error ? e : new Error("Failed to fetch players data")
      );
      setPlayersData(null); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, currentPage, currentSort, debouncedSearchTerm]); // debouncedSearchTerm is included for potential future API integration or to re-evaluate if client-side filtering logic were part of this hook.

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const setPage = (page: number) => {
    setCurrentPage(page);
  };

  const sortBy = (newSortProperty: keyof PlayerReportItemDto | string) => {
    setCurrentSort((prevSort) => {
      const newDirection =
        prevSort.property === newSortProperty && prevSort.direction === "asc"
          ? "desc"
          : "asc";
      return {
        property: newSortProperty,
        direction: newDirection,
      };
    });
    setCurrentPage(0); // Reset to first page on sort change
  };

  const setSearchTerm = (term: string) => {
    setInternalSearchTerm(term);
  };

  const totalPages = playersData?.totalPages ?? 0;

  return {
    playersData,
    isLoading,
    error,
    currentPage,
    totalPages,
    setPage,
    sortBy,
    searchTerm: internalSearchTerm, // Expose the immediate search term for input binding
    setSearchTerm,
    currentSort,
    itemsPerPage: ITEMS_PER_PAGE,
  };
};
