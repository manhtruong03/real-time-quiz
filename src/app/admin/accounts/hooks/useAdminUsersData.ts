// src/app/admin/accounts/hooks/useAdminUsersData.ts
import { useState, useCallback, useEffect } from "react";
import { getAllUsersAdmin } from "@/src/lib/api/admin/users";
import type {
  UserAccountAdminViewDTO,
  Page,
  PageableParams,
} from "@/src/lib/types/api";
import { useToast } from "@/src/hooks/use-toast";

const DEFAULT_PAGE_SIZE = 10;

interface UseAdminUsersDataReturn {
  users: UserAccountAdminViewDTO[];
  isLoading: boolean;
  error: Error | null;
  currentPage: number; // 0-indexed
  totalPages: number;
  totalElements: number;
  pageSize: number;
  goToPage: (page: number) => void; // For pagination controls
  refreshUsers: (params?: Partial<PageableParams>) => Promise<void>; // To reload data, e.g., after add/edit/delete
  setUsers: React.Dispatch<React.SetStateAction<UserAccountAdminViewDTO[]>>; // Allow direct manipulation if needed
}

export function useAdminUsersData(
  initialPage: number = 0,
  initialPageSize: number = DEFAULT_PAGE_SIZE
): UseAdminUsersDataReturn {
  const [users, setUsers] = useState<UserAccountAdminViewDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(initialPage); // 0-indexed for API
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);

  const { toast } = useToast();

  const fetchUsers = useCallback(
    async (page: number, size: number, sort?: string[]) => {
      setIsLoading(true);
      setError(null);
      try {
        const pageableParams: PageableParams = { page, size };
        if (sort) {
          pageableParams.sort = sort;
        }
        const data: Page<UserAccountAdminViewDTO> = await getAllUsersAdmin(
          pageableParams
        );
        setUsers(data.content);
        setTotalPages(data.totalPages);
        setCurrentPage(data.number); // API returns 0-indexed current page
        setTotalElements(data.totalElements);
        setPageSize(data.size);
      } catch (err: any) {
        console.error("Failed to fetch admin users:", err);
        setError(
          err instanceof Error
            ? err
            : new Error("Không thể tải thông tin người dùng.")
        );
        toast({
          title: "Lỗi",
          description:
            err.message ||
            "Không thể tải danh sách tài khoản. Vui lòng thử lại.",
          variant: "destructive",
        });
        // Keep existing users on error to prevent UI flicker, or clear them:
        // setUsers([]);
        // setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchUsers(currentPage, pageSize);
  }, [fetchUsers, currentPage, pageSize]); // Initial fetch and on page/size change

  const goToPage = useCallback(
    (pageNumber: number) => {
      // pageNumber is 0-indexed
      if (
        pageNumber >= 0 &&
        pageNumber < totalPages &&
        pageNumber !== currentPage
      ) {
        setCurrentPage(pageNumber);
      } else if (pageNumber === currentPage) {
        // If trying to go to the current page, just refresh it
        fetchUsers(pageNumber, pageSize);
      }
    },
    [totalPages, currentPage, fetchUsers, pageSize]
  );

  const refreshUsers = useCallback(
    async (params?: Partial<PageableParams>) => {
      // Fetches the current page with optional new sort/filter parameters
      // For now, just re-fetches the current page and size.
      // Sorting/filtering params can be added later.
      const sortParams = params?.sort; // Example for future extension
      await fetchUsers(
        params?.page ?? currentPage,
        params?.size ?? pageSize,
        sortParams
      );
    },
    [fetchUsers, currentPage, pageSize]
  );

  return {
    users,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalElements,
    pageSize,
    goToPage,
    refreshUsers,
    setUsers,
  };
}
