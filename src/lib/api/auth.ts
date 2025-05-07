// src/lib/api/auth.ts

import type {
  LoginRequest,
  SignupRequest,
  JwtResponse,
  MessageResponse,
  AuthApiError, // Import error type
} from "@/src/lib/types/auth";

// Define the base URL for your backend API
// Ensure this matches where your Spring Boot backend is running
const API_BASE_URL = "http://localhost:8080"; // Adjust if needed

/**
 * Sends a login request to the backend.
 * @param credentials - The user's login credentials.
 * @returns A promise that resolves with the JWT response on success.
 * @throws {AuthApiError} If the login fails or a network error occurs.
 */
export async function loginUser(
  credentials: LoginRequest
): Promise<JwtResponse> {
  const endpoint = `${API_BASE_URL}/api/auth/signin`;
  console.log(
    `[API Auth] Attempting login to ${endpoint} for user: ${credentials.username}`
  );

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const responseBody = await response.json();

    if (!response.ok) {
      // Use status code from response, default message if none in body
      const errorMessage =
        responseBody?.message || `Login failed with status: ${response.status}`;
      console.error(
        `[API Auth] Login failed (${response.status}):`,
        responseBody
      );
      throw new Error(errorMessage); // Throw a generic error for now
      // Consider throwing a custom AuthApiError later:
      // throw new AuthApiError(errorMessage, response.status, responseBody);
    }

    console.log("[API Auth] Login successful:", responseBody);
    return responseBody as JwtResponse; // Assume successful response matches JwtResponse
  } catch (error: any) {
    console.error("[API Auth] Network or other error during login:", error);
    // Re-throw a generic error or handle specific network errors
    throw new Error(`Login failed: ${error.message || "Network error"}`);
    // Consider throwing a custom AuthApiError later:
    // throw new AuthApiError(error.message || 'Network error', 0, error);
  }
}

/**
 * Sends a registration request to the backend.
 * @param details - The user's registration details.
 * @returns A promise that resolves with the message response on success.
 * @throws {AuthApiError} If registration fails or a network error occurs.
 */
export async function registerUser(
  details: SignupRequest
): Promise<MessageResponse> {
  const endpoint = `${API_BASE_URL}/api/auth/signup`;
  console.log(
    `[API Auth] Attempting registration to ${endpoint} for user: ${details.username}`
  );

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(details),
    });

    const responseBody = await response.json();

    if (!response.ok) {
      const errorMessage =
        responseBody?.message ||
        `Registration failed with status: ${response.status}`;
      console.error(
        `[API Auth] Registration failed (${response.status}):`,
        responseBody
      );
      throw new Error(errorMessage);
      // Consider throwing a custom AuthApiError later:
      // throw new AuthApiError(errorMessage, response.status, responseBody);
    }

    console.log("[API Auth] Registration successful:", responseBody);
    return responseBody as MessageResponse; // Assume successful response matches MessageResponse
  } catch (error: any) {
    console.error(
      "[API Auth] Network or other error during registration:",
      error
    );
    throw new Error(`Registration failed: ${error.message || "Network error"}`);
    // Consider throwing a custom AuthApiError later:
    // throw new AuthApiError(error.message || 'Network error', 0, error);
  }
}
