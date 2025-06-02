// /src/app/reports/sessions/[sessionId]/hooks/useSessionSummaryData.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { getSessionSummary } from "@/src/lib/api/reports";
import type { SessionSummaryDto } from "@/src/lib/types/reports";

interface UseSessionSummaryDataReturn {
  summaryData: SessionSummaryDto | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => // Explicitly define the refetch function signature
  Promise<void>; // Or specific return type if needed
}

export function useSessionSummaryData(
  sessionId: string | null | undefined
): UseSessionSummaryDataReturn {
  const [summaryData, setSummaryData] = useState<SessionSummaryDto | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start with loading true if sessionId is provided initially
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!sessionId) {
      // If sessionId is null or undefined, don't attempt to fetch.
      // Set loading to false if it was true, and clear data/error.
      setSummaryData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    console.log(
      `[useSessionSummaryData] Attempting to fetch data for sessionId: ${sessionId}`
    );
    setIsLoading(true);
    setError(null); // Clear previous errors

    try {
      const data = await getSessionSummary(sessionId);
      setSummaryData(data);
      console.log("[useSessionSummaryData] Data fetched successfully:", data);
    } catch (err) {
      const typedError =
        err instanceof Error
          ? err
          : new Error(
              "Failed to fetch session summary due to an unknown error."
            );
      setError(typedError);
      console.error(
        "[useSessionSummaryData] Error fetching session summary:",
        typedError
      );
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]); // Dependency array includes sessionId

  useEffect(() => {
    // Fetch data when the component mounts or when sessionId changes.
    // The check within fetchData handles the null/undefined case for sessionId.
    fetchData();
  }, [fetchData]); // useEffect depends on the memoized fetchData callback

  return { summaryData, isLoading, error, refetch: fetchData };
}
