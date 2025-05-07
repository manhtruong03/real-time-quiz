// src/lib/api/client.ts

import { AuthApiError } from "@/src/lib/types/auth";

// Function to get the token - Can be improved later if context isn't available
// For now, directly accessing localStorage is simpler outside components/hooks
const getTokenFromStorage = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken"); // Use the same key as in AuthContext
  }
  return null;
};

// Interface for fetch options, extending standard RequestInit
interface FetchOptions extends RequestInit {
  includeAuthHeader?: boolean; // Flag to control adding the auth header
}

/**
 * A wrapper around fetch to handle common logic like setting headers,
 * adding auth token, and basic error handling for API calls.
 *
 * @param endpoint - The API endpoint (relative or absolute).
 * @param options - Fetch options (method, body, headers, etc.).
 * @returns A promise that resolves with the parsed JSON response.
 * @throws {AuthApiError} If the fetch fails or the response is not ok.
 */
export async function fetchWithAuth<T = any>( // Generic type for response
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    includeAuthHeader = true,
    headers: customHeaders,
    ...fetchOpts
  } = options;

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...customHeaders, // Allow overriding default headers
  };

  // Add Authorization header if required and token exists
  if (includeAuthHeader) {
    const token = getTokenFromStorage();
    if (token) {
      (defaultHeaders as Record<string, string>)[
        "Authorization"
      ] = `Bearer ${token}`;
      console.log(`[fetchWithAuth] Included Bearer token for ${endpoint}`);
    } else {
      console.warn(
        `[fetchWithAuth] Auth header requested for ${endpoint} but no token found.`
      );
      // Optional: You might want to throw an error here or handle it differently
      // depending on whether the call absolutely requires auth.
    }
  }

  const requestOptions: RequestInit = {
    ...fetchOpts, // Spread method, body, etc.
    headers: defaultHeaders,
  };

  console.log(
    `[fetchWithAuth] Making request to ${endpoint}`,
    requestOptions.method || "GET"
  );

  try {
    const response = await fetch(endpoint, requestOptions);

    // Attempt to parse JSON body even for errors, as it might contain details
    let responseBody: any;
    try {
      responseBody = await response.json();
    } catch (e) {
      // If body isn't JSON or is empty
      responseBody = null;
      console.warn(
        `[fetchWithAuth] Could not parse JSON response body for ${endpoint} (Status: ${response.status})`
      );
    }

    if (!response.ok) {
      const errorMessage =
        responseBody?.message ||
        `API request failed with status: ${response.status}`;
      console.error(
        `[API Client] Request failed (${response.status}) to ${endpoint}:`,
        responseBody
      );

      // --- Handle 401 Unauthorized specifically ---
      if (response.status === 401) {
        console.warn(
          `[API Client] Received 401 Unauthorized for ${endpoint}. Potential token expiry.`
        );
        // Attempt to clear token and reload/redirect
        if (typeof window !== "undefined") {
          localStorage.removeItem("authToken");
          // Redirect to login - hard refresh ensures AuthContext re-initializes
          window.location.href = "/login?sessionExpired=true";
        }
      }
      // --- End 401 Handling ---

      throw new AuthApiError(errorMessage, response.status, responseBody);
    }

    console.log(
      `[API Client] Request successful (${response.status}) to ${endpoint}`
    );
    return responseBody as T; // Return the parsed body
  } catch (error: any) {
    console.error(
      `[API Client] Network or other error during fetch to ${endpoint}:`,
      error
    );

    // Re-throw AuthApiError if it's already that type, otherwise wrap
    if (error instanceof AuthApiError) {
      throw error;
    } else {
      throw new AuthApiError(
        error.message || "Network error or failed to fetch",
        0,
        error
      );
    }
  }
}

// Example usage (you would create specific functions like this in other api files):
/*
import { User } from '@/src/lib/types';

export async function getUserProfile(): Promise<User> {
    // Assuming API_BASE_URL is defined elsewhere or passed in
    const endpoint = `${API_BASE_URL}/api/users/me`;
    return fetchWithAuth<User>(endpoint, {
        method: 'GET',
        includeAuthHeader: true // This route requires authentication
    });
}
*/
