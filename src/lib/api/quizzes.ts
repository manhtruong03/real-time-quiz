// src/lib/api/quizzes.ts (Create this file or add to existing API file)
import type { QuizDTO, Page } from "@/src/lib/types/api"; // Assuming QuizDTO is defined in types based on openapi.json
import { fetchWithAuth, FetchOptions } from "./client"; // Assuming client.ts exists

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

// Define Pageable parameters structure if needed, or pass as query string
interface PageableParams {
  page?: number;
  size?: number;
  sort?: string; // e.g., "modifiedAt,desc"
}

/**
 * Fetches the quizzes created by the currently authenticated user.
 * @param params - Optional pagination and sorting parameters.
 * @returns A promise that resolves with a Page object containing QuizDTOs.
 * @throws {AuthApiError} If the request fails.
 */
export async function fetchMyQuizzes(
  params?: PageableParams
): Promise<Page<QuizDTO>> {
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) queryParams.set("page", String(params.page));
  if (params?.size !== undefined) queryParams.set("size", String(params.size));
  if (params?.sort) queryParams.set("sort", params.sort);

  const endpoint = `${API_BASE_URL}/api/quizzes/my-quizzes?${queryParams.toString()}`;
  console.log(`[API Quizzes] Fetching my quizzes from ${endpoint}`);

  const options: FetchOptions = {
    method: "GET",
    includeAuthHeader: true, // This endpoint requires authentication
  };

  // Assuming QuizDTO matches the structure returned by the backend
  // and Page is a generic structure like { content: T[], totalPages: number, ... }
  return fetchWithAuth<Page<QuizDTO>>(endpoint, options);
}

// Add other quiz-related API functions here (create, update, delete, getById) as needed
// Example for getting public quizzes (based on openapi.json)
export async function fetchPublicQuizzes(
  params?: PageableParams
): Promise<Page<QuizDTO>> {
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) queryParams.set("page", String(params.page));
  if (params?.size !== undefined) queryParams.set("size", String(params.size));
  if (params?.sort) queryParams.set("sort", params.sort);

  const endpoint = `${API_BASE_URL}/api/quizzes/public?${queryParams.toString()}`;
  console.log(`[API Quizzes] Fetching public quizzes from ${endpoint}`);

  const options: FetchOptions = {
    method: "GET",
    includeAuthHeader: false, // Public endpoint might not need auth
  };

  return fetchWithAuth<Page<QuizDTO>>(endpoint, options);
}

/**
 * Fetches the full details of a specific quiz by its ID.
 * @param quizId - The UUID of the quiz to fetch.
 * @returns A promise that resolves with the QuizDTO.
 * @throws {AuthApiError} If the request fails (e.g., not found, network error).
 */
export async function fetchQuizDetails(quizId: string): Promise<QuizDTO> {
  if (!quizId) {
    throw new Error("Quiz ID is required to fetch details.");
  }
  const endpoint = `${API_BASE_URL}/api/quizzes/${quizId}`;
  console.log(`[API Quizzes] Fetching quiz details from ${endpoint}`);

  const options: FetchOptions = {
    method: "GET",
    // Assuming fetching a specific quiz might require auth,
    // set to false if it's truly public access based on your backend rules
    includeAuthHeader: true,
  };

  // The backend should return a single QuizDTO based on openapi.json definition for this path
  return fetchWithAuth<QuizDTO>(endpoint, options);
}
