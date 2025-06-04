// src/app/reports/hooks/useUserReportsData.ts
import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/src/hooks/use-toast";
import { fetchUserSessionHistory } from "@/src/lib/api/reports";
import type { Page, UserSessionHistoryItemDto } from "@/src/lib/types/api";

export function useUserReportsData(
  initialPage: number = 0,
  pageSize: number = 9
) {
  const [reportsData, setReportsData] =
    useState<Page<UserSessionHistoryItemDto> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const { toast } = useToast();

  const loadReports = useCallback(
    async (pageToLoad: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = {
          page: pageToLoad,
          size: pageSize,
          sort: ["time,desc"],
        };
        const data = await fetchUserSessionHistory(params);
        setReportsData(data);
        setCurrentPage(data.number); // API returns 0-based page number
      } catch (err: any) {
        console.error("Failed to fetch user session reports:", err);
        const errorMessage =
          err.message || "Không thể tải lịch sử phiên. Vui lòng thử lại.";
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize, toast]
  );

  useEffect(() => {
    loadReports(currentPage);
  }, [loadReports, currentPage]); // loadReports will be stable due to useCallback dependencies

  const handlePageChange = (newPage: number) => {
    // newPage from pagination component is typically 0-based
    setCurrentPage(newPage);
  };

  const retryLoadReports = () => {
    loadReports(currentPage);
  };

  return {
    reports: reportsData?.content || [],
    totalPages: reportsData?.totalPages || 0,
    currentPage: reportsData?.number ?? currentPage, // Use current page from state as fallback
    isLoading,
    error,
    handlePageChange,
    retryLoadReports,
    totalElements: reportsData?.totalElements || 0,
  };
}
