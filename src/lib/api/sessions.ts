// src/lib/api/sessions.ts
import type { SessionFinalizationDto } from "@/src/lib/dto/session-finalization.dto";
import { fetchWithAuth, FetchOptions } from "./client"; // Using existing client
import type { AuthApiError } from "@/src/lib/types/auth"; // For error handling consistency

// Ensure API_BASE_URL is consistent with other API files (e.g., auth.ts, quizzes.ts)
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

/**
 * Saves the finalized game session results to the backend.
 * @param payload - The SessionFinalizationDto containing all session data.
 * @returns A promise that resolves with the backend's response (e.g., a confirmation message or the saved session ID).
 * @throws {AuthApiError} If the request fails or the backend returns an error.
 */
export async function saveSessionResults(
  payload: SessionFinalizationDto
): Promise<any> {
  // *** Replace with the actual backend endpoint ***
  const endpoint = `${API_BASE_URL}/api/sessions/finalize-game-results`;
  // Alternative if gamePin is part of the path:
  // const endpoint = `${API_BASE_URL}/api/game-sessions/${payload.gamePin}/results`;

  console.log(
    `[API Sessions] Saving session results to ${endpoint} for gamePin: ${payload.gamePin}`
  );

  const options: FetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    includeAuthHeader: true, // This action requires authentication
  };

  try {
    // Assuming the backend returns a simple success message or the ID of the saved session record.
    // Adjust <any> to a more specific DTO if the backend response structure is known.
    const responseData = await fetchWithAuth<any>(endpoint, options);
    console.log(
      `[API Sessions] Session results saved successfully for gamePin: ${payload.gamePin}. Response:`,
      responseData
    );
    return responseData;
  } catch (error) {
    // fetchWithAuth already logs the error and throws AuthApiError.
    // We can re-throw it to be handled by the calling component (e.g., to show a toast).
    console.error(
      `[API Sessions] Failed to save session results for gamePin: ${payload.gamePin}:`,
      error
    );
    throw error; // Re-throw the AuthApiError or a new one if needed
  }
}
