// src/lib/api/admin.ts

import { fetchWithAuth, API_BASE_URL } from "./client";
import { Page, PageableParams, UserAccountAdminViewDTO } from "../types/api";

/**
 * Fetches a paginated list of user accounts for the admin panel.
 *
 * @param pageable Parameters for pagination and sorting.
 * @returns A promise that resolves to a Page object containing UserAccountAdminViewDTO.
 * @throws An error if the API call fails.
 */
export async function fetchAdminUsers(
  pageable: PageableParams
): Promise<Page<UserAccountAdminViewDTO>> {
  const params = new URLSearchParams();

  // Append page and size parameters if they exist
  if (pageable.page !== undefined) {
    params.append("page", pageable.page.toString());
  }
  if (pageable.size !== undefined) {
    params.append("size", pageable.size.toString());
  }

  // Append sort parameters if they exist
  if (pageable.sort && pageable.sort.length > 0) {
    pageable.sort.forEach((s) => params.append("sort", s));
  }

  const queryString = params.toString();
  const apiPath = `${API_BASE_URL}/api/admin/users${
    queryString ? `?${queryString}` : ""
  }`;

  try {
    // fetchWithAuth already handles response.ok check and JSON parsing,
    // it directly returns the parsed data or throws an HttpError.
    const responseData: Page<UserAccountAdminViewDTO> = await fetchWithAuth(
      apiPath,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return responseData;
  } catch (error: any) {
    console.error("Error fetching admin users:", error);
    throw error; // Re-throw the error for handling in the calling component/hook
  }
}
