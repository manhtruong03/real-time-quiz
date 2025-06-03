# Frontend Authentication System Documentation

**Version:** 1.0
**Date:** 2025-05-08

## 1. Overview

This document describes the implementation of user registration and login functionality within the Vui Quiz frontend application. It covers the key components, state management, API interactions, and routing involved.

**Core Technologies Used:**

- **Framework:** Next.js (App Router)
- **UI Library:** React
- **State Management:** React Context API (`src/context/AuthContext.tsx`)
- **Form Handling:** React Hook Form (`react-hook-form`)
- **Schema Validation:** Zod (`zod`)
- **API Communication:** Native `Workspace` API (via helpers in `src/lib/api/`)
- **Token Storage:** Browser `localStorage`
- **Backend API:** Spring Boot backend (assumed running on `http://localhost:8080`) providing endpoints defined in `docs/openapi.json`.

## 2. Key Components & Files

- **`/src/app/login/page.tsx`**: Login page UI and form handling logic.
- **`/src/app/signup/page.tsx`**: Registration page UI and form handling logic.
- **`/src/app/profile/page.tsx`**: Example of a page protected by authentication.
- **`/src/context/AuthContext.tsx`**: Manages global authentication state (user info, token, login status) and provides `login`/`logout` functions. Initializes state from `localStorage`.
- **`/src/lib/api/auth.ts`**: Contains functions (`loginUser`, `registerUser`) to interact with the backend's `/api/auth/signin` and `/api/auth/signup` endpoints.
- **`/src/lib/api/client.ts`**: Contains the `WorkspaceWithAuth` helper function which automatically adds the `Authorization: Bearer <token>` header to authenticated API requests and handles basic 401 responses.
- **`/src/lib/schemas/auth.schema.ts`**: Defines Zod schemas (`LoginSchema`, `SignupSchema`) for validating login and registration form data.
- **`/src/lib/types/auth.ts`**: Defines TypeScript interfaces for API request/response bodies (`LoginRequest`, `SignupRequest`, `JwtResponse`, `MessageResponse`) and the `User` object stored in context.
- **`/src/components/auth/ProtectedRoute.tsx`**: Client component wrapper that prevents access to its children if the user is not authenticated, redirecting to `/login`.
- **`/src/components/layout/AppHeader.tsx`**: Reusable header component that displays conditional navigation (Login/Signup vs Profile/Logout) based on authentication state from `AuthContext`.

## 3. Authentication Flow

### 3.1. Registration (`/signup`)

1.  User navigates to `/signup`.
2.  The `SignupPage` component renders a form managed by `react-hook-form`.
3.  User fills in username, password (and optional email).
4.  Input validation is performed client-side using the `SignupSchema` (Zod).
5.  On submit, the `handleSignup` function is called with validated data.
6.  `handleSignup` calls the `registerUser` function from `src/lib/api/auth.ts`.
7.  `registerUser` makes a `POST` request to `/api/auth/signup`.
8.  On success (e.g., 200 OK from backend with `MessageResponse`), a success toast is shown, and the user is redirected to `/login`.
9.  On failure (e.g., 400 Bad Request for existing username/email), an error toast is shown, and the error message is displayed on the form.

### 3.2. Login (`/login`)

1.  User navigates to `/login`.
2.  `LoginPage` checks `AuthContext`. If already authenticated (and not loading), redirects to `/profile`.
3.  If not authenticated, the login form (managed by `react-hook-form`) is rendered.
4.  User fills in username and password.
5.  Input validation is performed client-side using the `LoginSchema` (Zod).
6.  On submit, `handleLogin` is called with validated data.
7.  `handleLogin` calls `loginUser` from `src/lib/api/auth.ts`.
8.  `loginUser` makes a `POST` request to `/api/auth/signin`.
9.  On success (e.g., 200 OK with `JwtResponse`), `handleLogin` calls the `login` function from `AuthContext`.
10. The `AuthContext` `login` function:
    - Stores the received JWT in `localStorage` under the key `authToken`.
    - Updates the context state (`isAuthenticated: true`, `user: {...}`, `token: '...'`).
11. A success toast is shown.
12. The user is redirected to `/profile` (or the intended authenticated page).
13. On failure (e.g., 401 Unauthorized), an error toast is shown, and the error message is displayed.

### 3.3. Session Persistence & Initialization

1.  When the application loads (`AuthProvider` mounts), a `useEffect` hook runs.
2.  It attempts to retrieve the token from `localStorage` (`authToken`).
3.  If a token is found:
    - It's decoded client-side using `jwt-decode` to check the expiration (`exp` claim).
    - If expired, the token is removed from storage, and the state remains logged-out.
    - If not expired (client-side check), the context state is updated with the token, user details (parsed from the token), and `isAuthenticated: true`. `isLoading` becomes `false`.
    - **(Improvement Needed):** Currently relies only on client-side check. Ideally, should call a backend `/validate` endpoint here to confirm token validity and get fresh user data before setting `isAuthenticated: true`.
4.  If no token is found, the state remains logged-out, and `isLoading` becomes `false`.

### 3.4. Logout

1.  User clicks the "Logout" button (e.g., in `AppHeader`).
2.  The `handleLogout` function calls the `logout` function from `AuthContext`.
3.  The `AuthContext` `logout` function:
    - Removes the token from `localStorage`.
    - Resets the context state (`isAuthenticated: false`, `user: null`, `token: null`).
4.  The user is typically redirected to `/login` or the home page.

### 3.5. Protected Routes

1.  Pages requiring authentication (e.g., `/profile`) are wrapped with the `<ProtectedRoute>` component.
2.  `ProtectedRoute` uses the `useAuth` hook to check `isAuthenticated` and `isLoading`.
3.  If `isLoading` is true, it shows a loading indicator.
4.  If `isLoading` is false and `isAuthenticated` is false, it redirects the user to `/login`.
5.  If `isLoading` is false and `isAuthenticated` is true, it renders the wrapped page content (`children`).

### 3.6. Authenticated API Calls

1.  The `src/lib/api/client.ts` file provides a `WorkspaceWithAuth` function.
2.  Functions making calls to protected backend endpoints should use `WorkspaceWithAuth`.
3.  `WorkspaceWithAuth` automatically retrieves the token from `localStorage` and adds the `Authorization: Bearer <token>` header.
4.  It includes basic handling for `401 Unauthorized` responses, attempting to clear the stored token and force a reload/redirect to login.

## 4. Future Considerations & Potential Improvements

- **Backend Token Validation:** Implement a dedicated backend endpoint (e.g., `/api/auth/validate` or `/api/users/me`) that validates the token signature and expiry server-side. Call this endpoint from `AuthProvider` on initial load when a token is found in storage.
- **Refresh Tokens:** Implement a refresh token strategy for more secure and longer-lasting sessions, avoiding the need to store the main JWT for extended periods in `localStorage`.
- **HttpOnly Cookies:** For enhanced security against XSS attacks, consider storing the token in an `HttpOnly` cookie managed by the backend, rather than `localStorage`. This requires backend changes to set/read the cookie.
- **Social Logins:** Add options for "Login with Google/GitHub" etc.
- **Password Reset:** Implement a "Forgot Password" flow.
- **Error Handling:** Enhance API error handling in `WorkspaceWithAuth` and display more specific error messages to the user.
- **Loading States:** Implement more granular loading states within components while authentication checks or API calls are in progress.
