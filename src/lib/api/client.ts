// src/lib/api/client.ts

import { AuthApiError } from "@/src/lib/types/auth";

// Function to get the token
const getTokenFromStorage = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken");
  }
  return null;
};

// API Endpoints (ensure these are defined as in your project)
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export const API_ENDPOINTS = {
  AUTH: {
    SIGN_IN: `${API_BASE_URL}/api/auth/signin`,
    SIGN_UP: `${API_BASE_URL}/api/auth/signup`,
  },
  QUIZZES: {
    CREATE: `${API_BASE_URL}/api/quizzes`,
    GET_BY_ID: (quizId: string) => `${API_BASE_URL}/api/quizzes/${quizId}`,
    GET_MY_QUIZZES: `${API_BASE_URL}/api/quizzes/my-quizzes`,
    GET_PUBLIC_QUIZZES: `${API_BASE_URL}/api/quizzes/public`,
    DELETE_BY_ID: (quizId: string) => `${API_BASE_URL}/api/quizzes/${quizId}`,
  },
  SESSIONS: {
    CREATE: `${API_BASE_URL}/api/session/create`,
    JOIN: (gamePin: string) => `${API_BASE_URL}/api/session/join/${gamePin}`,
    FINALIZE: `${API_BASE_URL}/api/session/finalize`,
  },
  ASSETS: {
    AVATARS: `${API_BASE_URL}/api/assets/avatars`,
    BACKGROUNDS: `${API_BASE_URL}/api/assets/backgrounds`,
    SOUNDS: `${API_BASE_URL}/api/assets/sounds`,
    POWERUPS: `${API_BASE_URL}/api/assets/powerups`,
  },
};

// Custom Error class for HTTP errors
class HttpError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "HttpError";
  }
}

// Interface for fetch options, extending standard RequestInit
export interface FetchOptions extends RequestInit {
  body?: any;
  includeAuthHeader?: boolean;
}

export async function fetchWithAuth<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    includeAuthHeader = true,
    headers: customHeaders,
    ...fetchOpts
  } = options;

  // Ensure headersInit is treated as a Record<string, string> for easier manipulation
  const headersInit: Record<string, string> = {};

  // Copy custom headers first
  if (customHeaders) {
    if (Array.isArray(customHeaders)) {
      customHeaders.forEach(([key, value]) => {
        headersInit[key] = value;
      });
    } else if (customHeaders instanceof Headers) {
      customHeaders.forEach((value, key) => {
        headersInit[key] = value;
      });
    } else {
      // It's a Record<string, string>
      for (const key in customHeaders) {
        if (Object.prototype.hasOwnProperty.call(customHeaders, key)) {
          headersInit[key] = (customHeaders as Record<string, string>)[key];
        }
      }
    }
  }

  let bodyToProcess: BodyInit | null | undefined = fetchOpts.body;

  if (includeAuthHeader) {
    const token = getTokenFromStorage();
    if (token) {
      headersInit["Authorization"] = `Bearer ${token}`;
      console.log(`[fetchWithAuth] Included Bearer token for ${endpoint}`);
    } else {
      if (
        endpoint !== API_ENDPOINTS.AUTH.SIGN_IN &&
        endpoint !== API_ENDPOINTS.AUTH.SIGN_UP
      ) {
        console.warn(
          `[fetchWithAuth] Auth header requested for ${endpoint} but no token found.`
        );
      }
    }
  }

  if (bodyToProcess instanceof FormData) {
    console.log(
      `[fetchWithAuth] Request body is FormData for URL: ${endpoint}. Content-Type will be set by browser.`
    );
    if (!headersInit["Accept"]) {
      // Keep if server usually responds with JSON
      headersInit["Accept"] = "application/json";
    }
    // Content-Type is deliberately not set for FormData
  } else if (bodyToProcess !== undefined && bodyToProcess !== null) {
    if (!headersInit["Content-Type"]) {
      headersInit["Content-Type"] = "application/json";
    }
    if (!headersInit["Accept"]) {
      headersInit["Accept"] = "application/json";
    }
    bodyToProcess = JSON.stringify(bodyToProcess);
    console.log(
      `[fetchWithAuth] Request body is JSON for URL: ${endpoint}. Content-Type: ${headersInit["Content-Type"]}`
    );
  } else {
    bodyToProcess = null;
    if (
      !headersInit["Accept"] &&
      (fetchOpts.method === "GET" || !fetchOpts.method)
    ) {
      headersInit["Accept"] = "application/json";
    }
  }

  const requestOptions: RequestInit = {
    ...fetchOpts,
    headers: headersInit, // Use the modified headersInit
    body: bodyToProcess,
  };

  console.log(
    `[fetchWithAuth] Making request to ${endpoint}`,
    requestOptions.method || "GET"
  );

  try {
    const response = await fetch(endpoint, requestOptions);

    let errorResponseBody: any;
    const responseContentTypeForError = response.headers.get("content-type");
    if (
      responseContentTypeForError &&
      responseContentTypeForError.includes("application/json")
    ) {
      try {
        errorResponseBody = await response.clone().json();
      } catch (e) {
        errorResponseBody = await response.clone().text();
        console.warn(
          `[fetchWithAuth] Could not parse error JSON response body for ${endpoint} (Status: ${response.status}), used text instead.`
        );
      }
    } else {
      errorResponseBody = await response.clone().text();
    }

    if (!response.ok) {
      const errorMessage =
        (typeof errorResponseBody === "object" && errorResponseBody?.message) ||
        (typeof errorResponseBody === "string" && errorResponseBody) ||
        `API request failed with status: ${response.status}`;
      console.error(
        `[fetchWithAuth] Request failed (${response.status}) to ${endpoint}:`,
        errorResponseBody
      );

      if (response.status === 401) {
        console.warn(
          `[fetchWithAuth] Received 401 Unauthorized for ${endpoint}. Potential token expiry.`
        );
        if (typeof window !== "undefined") {
          localStorage.removeItem("authToken");
          window.location.href = "/login?sessionExpired=true";
        }
      }
      throw new HttpError(response.status, errorMessage, errorResponseBody);
    }

    console.log(
      `[fetchWithAuth] Request successful (${response.status}) to ${endpoint}`
    );

    const successResponseContentType = response.headers.get("content-type");
    if (response.status === 204 || !successResponseContentType) {
      return {} as T;
    }
    if (successResponseContentType.includes("application/json")) {
      return response.json() as Promise<T>;
    }
    return (await response.text()) as unknown as T;
  } catch (error: any) {
    console.error(
      `[fetchWithAuth] Network or other error during fetch to ${endpoint}:`,
      error
    );
    if (error instanceof HttpError) {
      throw error;
    } else {
      throw new HttpError(
        0,
        error.message || "Network error or failed to fetch",
        error
      );
    }
  }
}
