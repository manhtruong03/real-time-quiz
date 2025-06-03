// Path: @/src/lib/api/reports.ts
// Corrected to properly use fetchWithAuth which handles JSON parsing and errors.

import { fetchWithAuth } from "@/src/lib/api/client"; //
import type {
  Page,
  UserSessionHistoryItemDto,
  PageableParams,
} from "@/src/lib/types/api"; //
import type {
  SessionSummaryDto,
  PlayerReportItemDto,
  QuestionReportItemDto,
} from "@/src/lib/types/reports"; //
import { API_BASE_URL } from "./client";

const REPORTS_BASE_URL = `${API_BASE_URL}/api/reports`;

/**
 * Fetches the current authenticated user's game session history.
 * Corresponds to the API endpoint: GET /api/reports/users/sessions
 * @param pageable - Pagination and sorting parameters.
 * @returns A promise that resolves to a Page of UserSessionHistoryItemDto.
 * @throws {ApiError} If the request fails or returns a non-ok status (handled by fetchWithAuth).
 */
export const fetchUserSessionHistory = async (
  pageable: PageableParams
): Promise<Page<UserSessionHistoryItemDto>> => {
  const queryParams = new URLSearchParams();
  if (pageable.page !== undefined)
    queryParams.append("page", pageable.page.toString());
  if (pageable.size !== undefined)
    queryParams.append("size", pageable.size.toString());
  if (pageable.sort && pageable.sort.length > 0) {
    pageable.sort.forEach((sortOption) =>
      queryParams.append("sort", sortOption)
    );
  }

  // Directly return the promise from fetchWithAuth, as it handles JSON parsing and errors.
  return fetchWithAuth<Page<UserSessionHistoryItemDto>>(
    `${REPORTS_BASE_URL}/users/sessions?${queryParams.toString()}`,
    { method: "GET" } // Explicit method is good practice
  );
};

/**
 * Fetches the summary report for a specific game session.
 * Corresponds to the API endpoint: GET /api/reports/sessions/{sessionId}/summary
 * @param sessionId - The UUID of the game session.
 * @returns A promise that resolves to a SessionSummaryDto.
 * @throws {ApiError} If the request fails or returns a non-ok status (handled by fetchWithAuth).
 */
export const getSessionSummary = async (
  sessionId: string
): Promise<SessionSummaryDto> => {
  // Directly return the promise from fetchWithAuth.
  return fetchWithAuth<SessionSummaryDto>(
    `${REPORTS_BASE_URL}/sessions/${sessionId}/summary`,
    { method: "GET" }
  );
};

/**
 * Fetches a paginated list of player reports for a specific game session.
 * Corresponds to the API endpoint: GET /api/reports/sessions/{sessionId}/players
 * @param sessionId - The UUID of the game session.
 * @param pageable - Pagination and sorting parameters.
 * @returns A promise that resolves to a Page of PlayerReportItemDto.
 * @throws {ApiError} If the request fails or returns a non-ok status (handled by fetchWithAuth).
 */
export const getSessionPlayersReport = async (
  sessionId: string,
  pageable: PageableParams
): Promise<Page<PlayerReportItemDto>> => {
  const queryParams = new URLSearchParams();
  if (pageable.page !== undefined) {
    queryParams.append("page", pageable.page.toString());
  }
  if (pageable.size !== undefined) {
    queryParams.append("size", pageable.size.toString());
  }
  if (pageable.sort && pageable.sort.length > 0) {
    pageable.sort.forEach((sortOption) => {
      queryParams.append("sort", sortOption);
    });
  }

  // Directly return the promise from fetchWithAuth.
  return fetchWithAuth<Page<PlayerReportItemDto>>(
    `${REPORTS_BASE_URL}/sessions/${sessionId}/players?${queryParams.toString()}`,
    { method: "GET" }
  );
};

// --- START: New function for Question Reports ---

/**
 * Fetches the detailed questions report for a specific quiz session.
 * Corresponds to API: GET /api/reports/sessions/{sessionId}/questions
 * @param sessionId - The ID of the quiz session.
 * @param params - Pageable parameters (page, size, sort).
 * @returns A promise that resolves to a paginated list of question report items.
 */
export const getSessionQuestionsReport = async (
  sessionId: string,
  params?: PageableParams // Optional params
): Promise<Page<QuestionReportItemDto>> => {
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) {
    queryParams.append("page", String(params.page));
  }
  if (params?.size !== undefined) {
    queryParams.append("size", String(params.size));
  }
  // Default sort by slideIndex if not provided, or handle multiple sort params
  if (params?.sort && params.sort.length > 0) {
    params.sort.forEach((sortOption) => queryParams.append("sort", sortOption));
  } else {
    queryParams.append("sort", "slideIndex,asc"); // Default sort
  }

  const queryString = queryParams.toString();
  const url = `${REPORTS_BASE_URL}/sessions/${sessionId}/questions${
    queryString ? `?${queryString}` : ""
  }`;

  return fetchWithAuth<Page<QuestionReportItemDto>>(url, {
    method: "GET",
  });
};
