// src/app/admin/reports/hooks/useAdminReportsData.ts
import { useState, useEffect, useCallback } from "react";
import { getAllSessionReportsAdmin } from "@/src/lib/api/admin/reports";
import { Page, PageableParams } from "@/src/lib/types/api";
import { SessionSummaryDto } from "@/src/lib/types/reports";
import { useToast } from "@/src/hooks/use-toast"; // Corrected path

const DEFAULT_PAGE_SIZE = 10;

interface UseAdminReportsDataReturn {
  reports: SessionSummaryDto[];
  isLoading: boolean;
  error: Error | null;
  currentPage: number; // 0-indexed
  totalPages: number;
  totalElements: number;
  pageSize: number;
  goToPage: (page: number) => void;
  refreshReports: () => void;
  setPageSize: (size: number) => void;
  // Add sort state and handler if needed in a future phase
}

export const useAdminReportsData = (): UseAdminReportsDataReturn => {
  const [reports, setReports] = useState<SessionSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0); // API is 0-indexed
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const { toast } = useToast();

  // Callback to fetch reports
  const fetchReports = useCallback(
    async (pageToFetch: number, currentSize: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const params: PageableParams = {
          page: pageToFetch,
          size: currentSize,
          sort: ["endedAt,desc"], // Default sort
        };
        const data: Page<SessionSummaryDto> = await getAllSessionReportsAdmin(
          params
        );
        setReports(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
        setCurrentPage(data.number); // API returns 0-indexed page number
        setPageSize(data.size);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Lỗi không xác định";
        setError(err instanceof Error ? err : new Error(errorMessage));
        toast({
          title: "Lỗi",
          description: `Không thể tải danh sách báo cáo: ${errorMessage}`,
          variant: "destructive",
        });
        // Clear data on error to prevent displaying stale data
        setReports([]);
        setTotalPages(0);
        setTotalElements(0);
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  // Effect to fetch reports when page or pageSize changes
  useEffect(() => {
    fetchReports(currentPage, pageSize);
  }, [currentPage, pageSize, fetchReports]);

  // Function to change page
  const goToPage = (page: number) => {
    // Expects 0-indexed page
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    } else if (totalPages === 0 && page === 0) {
      // Allow going to page 0 if no pages yet
      setCurrentPage(page);
    }
  };

  // Function to refresh reports (re-fetch current page)
  const refreshReports = () => {
    fetchReports(currentPage, pageSize);
  };

  return {
    reports,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalElements,
    pageSize,
    goToPage,
    refreshReports,
    setPageSize,
  };
};
