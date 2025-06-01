// src/lib/api/quizzes.ts
import type { QuizDTO, Page } from "@/src/lib/types/api";
import { fetchWithAuth, FetchOptions } from "./client";
import type { QuizStructureHost } from "@/src/lib/types/quiz-structure";
import { transformQuizStateToDTO } from "@/src/lib/api-utils/quiz-transformer";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export const API_ENDPOINTS = {
  QUIZZES: {
    CREATE: `${API_BASE_URL}/api/quizzes`,
    GET_BY_ID: (quizId: string) => `${API_BASE_URL}/api/quizzes/${quizId}`,
    GET_MY_QUIZZES: `${API_BASE_URL}/api/quizzes/my-quizzes`,
    GET_PUBLIC_QUIZZES: `${API_BASE_URL}/api/quizzes/public`,
    DELETE_BY_ID: (quizId: string) => `${API_BASE_URL}/api/quizzes/${quizId}`,
  },
};

interface PageableParams {
  page?: number;
  size?: number;
  sort?: string;
}

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
    includeAuthHeader: true,
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
    includeAuthHeader: false,
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
    includeAuthHeader: true,
  };
  return fetchWithAuth<QuizDTO>(endpoint, options);
}

export const createQuiz = async (
  quizState: QuizStructureHost
): Promise<QuizDTO> => {
  console.log(
    "[API Quizzes] Preparing to create quiz. Initial state (files omitted for brevity):",
    // Log a version of quizState where File objects are represented by their names for cleaner console output
    {
      ...quizState,
      coverImageFile: quizState.coverImageFile
        ? quizState.coverImageFile.name
        : null,
      questions: quizState.questions.map((q) => ({
        ...q,
        imageFile: q.imageFile ? q.imageFile.name : null,
      })),
    }
  );

  const formData = transformQuizStateToDTO(quizState);

  console.log("[API Quizzes] FormData to be sent (entries):");
  for (const [key, value] of formData.entries()) {
    // All Blob and File instances are treated as File by FormData
    if (value instanceof File) {
      if (key === "quizData") {
        // This 'File' was originally our Blob containing JSON
        console.log(
          `  ${key}: File (originally Blob) { name: "${value.name}", size: ${value.size}, type: "${value.type}" }`
        );
        // Optional: For debugging, asynchronously log the content of the quizData Blob
        // value.text().then(text => console.log(`    quizData (first 100 chars): ${text.substring(0,100)}...`));
      } else {
        // This is for actual image files
        console.log(
          `  ${key}: File { name: "${value.name}", size: ${value.size}, type: "${value.type}" }`
        );
      }
    } else {
      // This case handles plain string values, if any were appended.
      // Based on your transformQuizStateToDTO, this path might not be taken often for quiz creation.
      console.log(`  ${key}: String value - "${value}"`);
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
        body: formData,
        // Content-Type header is not set here for FormData;
        // the browser will set it correctly with the boundary.
      }
    );
    console.log("[API Quizzes] Quiz creation successful. Response:", response);
    return response;
  } catch (error) {
    console.error("[API Quizzes] Error during quiz creation:", error);
    throw error;
  }
};

export async function updateQuiz(
  quizId: string,
  quizData: QuizDTO
): Promise<QuizDTO> {
  if (!quizId) {
    throw new Error("Quiz ID is required for update.");
  }
  const endpoint = `${API_BASE_URL}/api/quizzes/${quizId}`;
  console.log(`[API Quizzes] Updating quiz ${quizId} at ${endpoint}`);

  const updatePayload: Partial<QuizDTO> = { ...quizData };
  delete updatePayload.uuid;
  delete updatePayload.creator;
  delete updatePayload.creator_username;
  delete updatePayload.created;
  delete updatePayload.modified;

  const options: FetchOptions = {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatePayload),
    includeAuthHeader: true,
  };

  try {
    const updatedQuiz = await fetchWithAuth<QuizDTO>(endpoint, options);
    console.log(`[API Quizzes] Quiz ${quizId} updated successfully`);
    return updatedQuiz;
  } catch (error) {
    console.error(`[API Quizzes] Failed to update quiz ${quizId}:`, error);
    throw error;
  }
}

/**
 * Deletes a quiz by its ID.
 * @param quizId - The ID of the quiz to delete.
 * @returns A promise that resolves when the quiz is successfully deleted.
 * @throws {Error} If the deletion fails or a network error occurs.
 */
export async function deleteQuizById(quizId: string): Promise<void> {
  if (!quizId) {
    throw new Error("Quiz ID is required to delete a quiz.");
  }
  const endpoint = `${API_BASE_URL}/api/quizzes/${quizId}`; // Or use API_ENDPOINTS.QUIZZES.DELETE_BY_ID(quizId)
  console.log(
    `[API Quizzes] Attempting to delete quiz ${quizId} from ${endpoint}`
  );

  const options: FetchOptions = {
    method: "DELETE",
    includeAuthHeader: true, // Deletion requires authentication
  };

  try {
    // fetchWithAuth should handle non-JSON responses (like 204 No Content) gracefully.
    // If it expects JSON by default, we might need to adjust it or handle the response here.
    // Assuming fetchWithAuth handles 204 correctly or we modify it if needed.
    await fetchWithAuth<void>(endpoint, options); // Expecting no content on successful delete
    console.log(`[API Quizzes] Quiz ${quizId} deleted successfully.`);
  } catch (error) {
    // fetchWithAuth should ideally throw an HttpError or similar custom error
    // containing status and potential message from the backend.
    console.error(`[API Quizzes] Failed to delete quiz ${quizId}:`, error);
    throw error; // Re-throw the error to be caught by the calling component
  }
}
