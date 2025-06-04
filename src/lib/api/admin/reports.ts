import {
  fetchWithAuth,
  API_ENDPOINTS,
  FetchOptions,
} from "@/src/lib/api/client";
import { Page, PageableParams, MessageResponse } from "@/src/lib/types/api";
import { SessionSummaryDto } from "@/src/lib/types/reports";

/**
 * Fetches a paginated list of all session reports for administrators.
 * Corresponds to the API endpoint: GET /api/admin/reports/sessions
 * @param params - Pagination and sorting parameters.
 * @param options - Optional fetch options.
 * @returns A promise that resolves to a Page of SessionSummaryDto.
 */
export const getAllSessionReportsAdmin = async (
  params: PageableParams,
  options: FetchOptions = {} // Added FetchOptions
): Promise<Page<SessionSummaryDto>> => {
  const queryParams = new URLSearchParams({
    page: params.page?.toString() || "0",
    size: params.size?.toString() || "10",
  });

  if (params.sort) {
    params.sort.forEach((sortParam) => {
      queryParams.append("sort", sortParam);
    });
  } else {
    queryParams.append("sort", "endedAt,desc"); // Default sort
  }

  const endpoint = `${
    API_ENDPOINTS.ADMIN.REPORTS.GET_ALL
  }?${queryParams.toString()}`;

  // Rely on fetchWithAuth to handle .ok check, .json() parsing, and error throwing
  return fetchWithAuth<Page<SessionSummaryDto>>(endpoint, {
    method: "GET", // Explicitly state method for clarity, though GET is default
    ...options,
  });
};

/**
 * Deletes a specific session report for administrators.
 * Corresponds to the API endpoint: DELETE /api/admin/reports/sessions/{sessionId}
 * @param sessionId - The ID of the session report to delete.
 * @param options - Optional fetch options.
 * @returns A promise that resolves to MessageResponse (or void if API returns 204 with no body).
 */
export const deleteSessionReportAdmin = async (
  sessionId: string,
  options: FetchOptions = {} // Added FetchOptions
): Promise<MessageResponse> => {
  // Assuming MessageResponse like in users.ts delete
  const endpoint = `${API_ENDPOINTS.ADMIN.REPORTS.GET_ALL}/${sessionId}`;

  // fetchWithAuth will handle 204 (returning undefined) or parse MessageResponse
  // If your API returns 204 and you expect MessageResponse, this might need adjustment
  // in how fetchWithAuth handles 204 for specific types.
  // For now, assuming if it's not 204, it's a MessageResponse.
  // If it IS 204, fetchWithAuth returns undefined. If MessageResponse is not { message?: string }, this will be a type mismatch.
  // Let's assume for now the API returns a JSON body for DELETE, or fetchWithAuth is adjusted.
  // A common pattern for DELETE is to return void or a simple success message.
  // If your API returns 204 No Content for DELETE, the return type should ideally be Promise<void>.
  // Given users.ts uses MessageResponse, we'll stick to that for now.
  return fetchWithAuth<MessageResponse>(endpoint, {
    method: "DELETE",
    ...options,
  });
};
