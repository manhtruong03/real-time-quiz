// src/app/admin/users/hooks/useAdminUsersData.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchAdminUsers } from "@/src/lib/api/admin"; // Import the API function from Phase 1, Step 1
import type { UserAccountAdminViewDTO, Page } from "@/src/lib/types/api"; // Import relevant types

const PAGE_SIZE = 10; // Define page size, consistent with other pagination in the project

export const useAdminUsersData = () => {
  const [users, setUsers] = useState<UserAccountAdminViewDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0); // API pages are 0-indexed, consistent with useMyQuizzesData
  const [totalPages, setTotalPages] = useState(0);

  const loadAdminUsers = useCallback(async (pageToLoad: number) => {
    setIsLoading(true);
    setError(null); // Clear any previous errors
    try {
      // Fetch users for the specified page using the admin API client
      const usersPage: Page<UserAccountAdminViewDTO> = await fetchAdminUsers({
        page: pageToLoad,
        size: PAGE_SIZE,
        sort: ["username", "asc"], // Default sort by username ascending; can be refined in Phase 2
      });
      setUsers(usersPage.content || []);
      setTotalPages(usersPage.totalPages || 0);
      setCurrentPage(usersPage.number || 0); // Update current page from the API response
    } catch (err: any) {
      console.error("Failed to fetch admin users:", err);
      setError(err.message || "Could not load admin users.");
      // Optionally reset data if fetch fails
      setUsers([]);
      setTotalPages(0);
      setCurrentPage(0);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array for useCallback, as PAGE_SIZE and sort are constants here

  useEffect(() => {
    // Load the initial page (page 0) when the hook mounts
    loadAdminUsers(0);
  }, [loadAdminUsers]);

  const goToPage = (pageNumber: number) => {
    // Prevent navigating out of bounds or to the current page unnecessarily
    if (
      pageNumber >= 0 &&
      pageNumber < totalPages &&
      pageNumber !== currentPage
    ) {
      loadAdminUsers(pageNumber);
    }
  };

  return {
    users,
    isLoading,
    error,
    loadAdminUsers, // Exposing this for potential direct reload (e.g., after an action)
    setUsers, // Useful for optimistic updates or external manipulation if needed
    currentPage,
    totalPages,
    goToPage,
  };
};
