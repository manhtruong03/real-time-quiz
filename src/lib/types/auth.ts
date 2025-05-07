// src/lib/types/auth.ts

// Based on relevant fields from JwtResponse for frontend use
export interface User {
  id: string; // User UUID
  username: string;
  email: string;
  roles: string[];
}

// --- Existing types remain ---
export interface LoginRequest {
  // Keep
  username: string;
  password: string;
}
export interface SignupRequest {
  // Keep
  username: string;
  email?: string;
  password: string;
}
export interface JwtResponse {
  // Keep
  token: string;
  type: string;
  id: string; // User UUID
  username: string;
  email: string;
  roles: string[];
}
export interface MessageResponse {
  // Keep
  message: string;
}
export class AuthApiError extends Error {
  // Keep
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
    this.details = details;
  }
}
