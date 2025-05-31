// src/lib/api/quizzes.ts
import type { QuizDTO, Page } from "@/src/lib/types/api";
import { fetchWithAuth, FetchOptions } from "./client";
import type { QuizStructureHost } from "@/src/lib/types/quiz-structure";
import { transformQuizStateToDTO } from "@/src/lib/api-utils/quiz-transformer";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export const API_ENDPOINTS = {
  // ... other endpoints
  QUIZZES: {
    CREATE: `${API_BASE_URL}/api/quizzes`, // This is the endpoint for creating quizzes
    GET_BY_ID: (quizId: string) => `${API_BASE_URL}/api/quizzes/${quizId}`,
    // ... other quiz-related endpoints
  },
  // ...
};

// Interface for pagination parameters (keep existing functions if they are there)
interface PageableParams {
  page?: number;
  size?: number;
  sort?: string;
}

// --- KEEP existing fetchMyQuizzes, fetchPublicQuizzes, fetchQuizDetails ---
// ... (previous functions like fetchMyQuizzes, fetchPublicQuizzes, fetchQuizDetails) ...
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
  return fetchWithAuth<Page<QuizDTO>>(endpoint, options);
}

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

export async function fetchQuizDetails(quizId: string): Promise<QuizDTO> {
  if (!quizId) {
    throw new Error("Quiz ID is required to fetch details.");
  }
  const endpoint = `${API_BASE_URL}/api/quizzes/${quizId}`;
  console.log(`[API Quizzes] Fetching quiz details from ${endpoint}`);
  const options: FetchOptions = {
    method: "GET",
    includeAuthHeader: true, // Assuming auth needed
  };
  return fetchWithAuth<QuizDTO>(endpoint, options);
}

/**
 * Creates a new quiz by sending quiz data and optional images as multipart/form-data.
 * @param quizState - The full quiz structure from the frontend, including any File objects.
 * @returns A Promise resolving to the created QuizDTO from the backend.
 */
export const createQuiz = async (
  quizState: QuizStructureHost
): Promise<QuizDTO> => {
  console.log(
    "[API Quizzes] Preparing to create quiz. Initial state:",
    quizState
  );

  // Transform the frontend state to FormData
  const formData = transformQuizStateToDTO(quizState);

  // Optional: Log FormData entries for debugging (can be verbose for actual file data)
  console.log("[API Quizzes] FormData to be sent:");
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(
        `  ${key}: File { name: "${value.name}", size: ${value.size}, type: "${value.type}" }`
      );
    } else {
      // This will log the 'quizData' JSON string
      console.log(`  ${key}: ${value}`);
    }
  }

  try {
    console.log(
      `[API Quizzes] Sending POST request to ${API_ENDPOINTS.QUIZZES.CREATE} with FormData.`
    );
    const response = await fetchWithAuth<QuizDTO>(
      API_ENDPOINTS.QUIZZES.CREATE,
      {
        method: "POST",
        body: formData, // Pass FormData directly
        // Content-Type header will be set by the browser for FormData
      }
    );
    console.log("[API Quizzes] Quiz creation successful. Response:", response);
    return response;
  } catch (error) {
    console.error("[API Quizzes] Error during quiz creation:", error);
    // Re-throw the error so it can be caught by the calling UI component (e.g., to show a toast)
    throw error;
  }
};

/**
 * Updates an existing quiz via the backend API.
 * @param quizId - The UUID of the quiz to update.
 * @param quizData - The QuizDTO object containing the updated quiz data.
 * @returns A promise that resolves with the updated QuizDTO (as returned by the backend).
 * @throws {AuthApiError} If the request fails.
 */
export async function updateQuiz(
  quizId: string,
  quizData: QuizDTO
): Promise<QuizDTO> {
  // Note: OpenAPI spec doesn't explicitly define PUT /api/quizzes/{quizId}
  // Assuming it exists and behaves similarly to POST but targets a specific ID.
  // Adjust endpoint and method if your backend implementation differs.
  if (!quizId) {
    throw new Error("Quiz ID is required for update.");
  }
  const endpoint = `${API_BASE_URL}/api/quizzes/${quizId}`; // Assuming PUT uses ID in path
  console.log(`[API Quizzes] Updating quiz ${quizId} at ${endpoint}`);

  // Remove fields that shouldn't be sent on update or are generated by backend
  const updatePayload: Partial<QuizDTO> = { ...quizData };
  delete updatePayload.uuid;
  delete updatePayload.creator;
  delete updatePayload.creator_username;
  delete updatePayload.created;
  delete updatePayload.modified;
  // Potentially remove question IDs if backend handles updates based on position/content match

  const options: FetchOptions = {
    method: "PUT", // Assuming PUT for update
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatePayload),
    includeAuthHeader: true, // Updating likely requires authentication
  };

  try {
    // Assuming backend returns the updated QuizDTO
    const updatedQuiz = await fetchWithAuth<QuizDTO>(endpoint, options);
    console.log(`[API Quizzes] Quiz ${quizId} updated successfully`);
    return updatedQuiz;
  } catch (error) {
    console.error(`[API Quizzes] Failed to update quiz ${quizId}:`, error);
    throw error; // Re-throw for caller handling
  }
}

// Optional: Add deleteQuiz function if needed
// export async function deleteQuiz(quizId: string): Promise<void> { ... }
