// src/app/admin/images/hooks/useAdminImagesData.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllImagesAdmin } from "@/src/lib/api/admin/images"; // [from Step 2.1]
import type {
  ImageStorageAdminViewDTO,
  PageableParams,
  Page,
} from "@/src/lib/types/api"; // [cite: manhtruong03/real-time-quiz/real-time-quiz-main/src/lib/types/api.ts]

interface UseAdminImagesDataReturn {
  images: ImageStorageAdminViewDTO[];
  isLoading: boolean;
  error: Error | null;
  currentPage: number; // 0-indexed
  totalPages: number;
  totalElements: number;
  goToPage: (page: number) => void; // page is 0-indexed
  refreshImages: (params?: {
    page?: number;
    size?: number;
    sort?: string[];
  }) => void;
  currentSort: string[];
  setCurrentSort: React.Dispatch<React.SetStateAction<string[]>>;
  pageSize: number;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
}

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SORT = ["createdAt,desc"];

export const useAdminImagesData = (
  initialPage: number = 0,
  initialSize: number = DEFAULT_PAGE_SIZE,
  initialSort: string[] = DEFAULT_SORT
): UseAdminImagesDataReturn => {
  const [images, setImages] = useState<ImageStorageAdminViewDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [currentSort, setCurrentSort] = useState<string[]>(initialSort);
  const [pageSize, setPageSize] = useState<number>(initialSize);

  const fetchImages = useCallback(
    async (pageableParams?: PageableParams) => {
      setIsLoading(true);
      setError(null);
      try {
        const params: PageableParams = {
          page: pageableParams?.page ?? currentPage,
          size: pageableParams?.size ?? pageSize,
          sort: pageableParams?.sort ?? currentSort,
        };
        const data: Page<ImageStorageAdminViewDTO> = await getAllImagesAdmin(
          params
        );
        setImages(data.content);
        setTotalPages(data.totalPages);
        setCurrentPage(data.number); // API returns 0-indexed page number
        setTotalElements(data.totalElements);
      } catch (err: any) {
        console.error("Failed to fetch images:", err);
        setError(err instanceof Error ? err : new Error("Lỗi không xác định"));
        setImages([]); // Clear images on error
        setTotalPages(0);
        setTotalElements(0);
      } finally {
        setIsLoading(false);
      }
    },
    [currentPage, pageSize, currentSort]
  ); // Dependencies for useCallback

  useEffect(() => {
    // Initial fetch when component mounts or when sort/pageSize changes
    fetchImages({ page: currentPage, size: pageSize, sort: currentSort });
  }, [fetchImages, currentPage, pageSize, currentSort]); // Rerun if fetchImages, currentPage, pageSize, or currentSort changes

  const goToPage = (page: number) => {
    // page is 0-indexed
    setCurrentPage(page);
    // The useEffect will trigger a refetch due to currentPage change
  };

  const refreshImages = (params?: {
    page?: number;
    size?: number;
    sort?: string[];
  }) => {
    const refreshPage = params?.page ?? currentPage;
    const refreshSize = params?.size ?? pageSize;
    const refreshSort = params?.sort ?? currentSort;

    // If page is explicitly provided, update currentPage state to ensure useEffect dependency change
    if (params?.page !== undefined && params.page !== currentPage) {
      setCurrentPage(refreshPage);
    }
    if (params?.size !== undefined && params.size !== pageSize) {
      setPageSize(refreshSize);
    }
    if (
      params?.sort !== undefined &&
      JSON.stringify(params.sort) !== JSON.stringify(currentSort)
    ) {
      setCurrentSort(refreshSort);
    }
    // Trigger fetch directly if only sort/size changed but page remained same,
    // or let useEffect handle it if page changed.
    // For simplicity and to ensure fetch always happens on refresh:
    fetchImages({ page: refreshPage, size: refreshSize, sort: refreshSort });
  };

  return {
    images,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalElements,
    goToPage,
    refreshImages,
    currentSort,
    setCurrentSort,
    pageSize,
    setPageSize,
  };
};
