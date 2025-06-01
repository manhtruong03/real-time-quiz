// src/lib/api/reports.ts
import type {
  Page,
  UserSessionHistoryItemDto,
  PageableObject,
  SortObject,
} from "@/src/lib/types/api"; // Changed Pageable to PageableObject
import { fetchWithAuth, API_BASE_URL, FetchOptions } from "./client";

/**
 * Fetches the current authenticated user's game session history.
 * Corresponds to: GET /api/reports/users/sessions
 * @param params - Pagination and sorting parameters.
 * 'page' corresponds to 'pageNumber' in PageableObject.
 * 'size' corresponds to 'pageSize' in PageableObject.
 * 'sort' is an array of strings like "property,direction" (e.g., "time,desc").
 * @returns A promise that resolves with a paginated list of user session history items.
 */
export async function fetchUserSessionHistory(
  params: {
    page?: number; // API uses 'page'
    size?: number; // API uses 'size'
    sort?: string[]; // API uses 'sort' as string array
  } = { page: 0, size: 10, sort: ["time,desc"] } // Default params
): Promise<Page<UserSessionHistoryItemDto>> {
  const queryParams = new URLSearchParams();
  if (params.page !== undefined) queryParams.set("page", String(params.page));
  if (params.size !== undefined) queryParams.set("size", String(params.size));
  if (params.sort && params.sort.length > 0) {
    params.sort.forEach((s) => queryParams.append("sort", s));
  }

  const endpoint = `${API_BASE_URL}/api/reports/users/sessions?${queryParams.toString()}`;
  console.log(`[API Reports] Fetching user session history from ${endpoint}`);

  const options: FetchOptions = {
    method: "GET",
    includeAuthHeader: true, // Endpoint requires authentication
  };

  return fetchWithAuth<Page<UserSessionHistoryItemDto>>(endpoint, options);
}

// For clarity, if you want to use PageableObject directly and map its properties:
/**
 * Alternative fetchUserSessionHistory using PageableObject more directly.
 * This shows how to map PageableObject fields to the API's expected query params.
 */
export async function fetchUserSessionHistoryWithPageableObject(
  params: PageableObject = {
    pageNumber: 0,
    pageSize: 10,
    sort: [{ property: "time", direction: "DESC" }],
  }
): Promise<Page<UserSessionHistoryItemDto>> {
  const queryParams = new URLSearchParams();
  if (params.pageNumber !== undefined)
    queryParams.set("page", String(params.pageNumber));
  if (params.pageSize !== undefined)
    queryParams.set("size", String(params.pageSize));
  if (params.sort && params.sort.length > 0) {
    params.sort.forEach((s) => {
      if (s.property) {
        queryParams.append(
          "sort",
          `${s.property}${s.direction ? `,${s.direction.toLowerCase()}` : ""}`
        );
      }
    });
  }

  const endpoint = `${API_BASE_URL}/api/reports/users/sessions?${queryParams.toString()}`;
  // ... rest of the function is the same
  const options: FetchOptions = {
    method: "GET",
    includeAuthHeader: true,
  };
  return fetchWithAuth<Page<UserSessionHistoryItemDto>>(endpoint, options);
}
