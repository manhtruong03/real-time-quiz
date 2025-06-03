// src/app/game/host/hooks/useHostPageUIStateManager.ts
import { useState, useEffect, useCallback } from "react";
// Ensure this import path is correct based on your project structure
import type { ConnectionStatus as WebSocketConnectionStatus } from "@/src/hooks/game/useHostWebSocket";

export type PageUiState =
  | "INITIAL"
  | "FETCHING_PIN"
  | "CONNECTING"
  | "CONNECTED"
  | "DISCONNECTED"
  | "ERROR";

interface UseHostPageUIStateManagerProps {
  isQuizDataLoading: boolean;
  quizApiError: string | null;
  assetsLoading: boolean;
  assetsError: string | null;
  wsConnectionStatus: WebSocketConnectionStatus;
  wsError: string | null;
  // To allow the hook to directly set uiState to ERROR if quizId is missing
  quizId: string | null;
}

export function useHostPageUIStateManager({
  isQuizDataLoading,
  quizApiError,
  assetsLoading,
  assetsError,
  wsConnectionStatus,
  wsError,
  quizId,
}: UseHostPageUIStateManagerProps) {
  const [uiState, setUiState] = useState<PageUiState>("INITIAL");
  const [pageApiError, setPageApiError] = useState<string | null>(null);
  const [fetchedGamePin, setFetchedGamePin] = useState<string | null>(null);

  // Effect to handle errors that should immediately set UI to ERROR state
  useEffect(() => {
    if (!quizId) {
      setPageApiError("No Quiz ID provided in the URL."); // Consistent with original page.tsx logic
      setUiState("ERROR");
      return;
    }
    if (quizApiError) {
      setPageApiError(quizApiError);
      setUiState("ERROR");
      return;
    }
    if (assetsError) {
      setPageApiError(assetsError);
      setUiState("ERROR");
      return;
    }
    // wsError is handled in the next effect as it depends on wsConnectionStatus
  }, [quizId, quizApiError, assetsError]);

  // Effect to manage UI state transitions based on loading and WebSocket status
  useEffect(() => {
    // If already in an error state from the above effect, don't process further.
    if (uiState === "ERROR") {
      // if quizApiError, assetsError, or no quizId caused the error, pageApiError is already set.
      // If wsError is the cause, set it now.
      if (wsConnectionStatus === "ERROR" && !pageApiError) {
        setPageApiError(wsError ?? "Unknown WebSocket error.");
      }
      return;
    }

    // Original logic from page.tsx for wsConnectionStatus effect:
    if (uiState === "INITIAL" && (isQuizDataLoading || assetsLoading)) {
      // Remain in INITIAL if critical data is loading.
      // The 'INITIAL' state itself implies waiting for user action (handleStartGameClick)
      // or for these loading states to resolve.
      return;
    }

    // Handle WebSocket status transitions
    // This replicates the structure from the original page.tsx's useEffect for wsConnectionStatus
    if (wsConnectionStatus === "CONNECTING") {
      setUiState("CONNECTING");
    } else if (wsConnectionStatus === "CONNECTED") {
      setUiState("CONNECTED");
    } else if (wsConnectionStatus === "DISCONNECTED") {
      // Original check: Prevent flicker if already disconnected or errored (error handled above)
      if (uiState !== "INITIAL" && uiState !== "DISCONNECTED") {
        // uiState !== "ERROR" is implicitly handled by the early return
        setUiState("DISCONNECTED");
      }
    } else if (wsConnectionStatus === "ERROR") {
      setPageApiError(wsError ?? "Unknown WebSocket error.");
      setUiState("ERROR");
    }
    // Note: The original page.tsx did not have an explicit transition for 'IDLE' in this specific effect.
    // Transitions from 'INITIAL' to 'FETCHING_PIN' are driven by user actions (handleStartGameClick).
    // Transitions from 'FETCHING_PIN' to 'CONNECTING' are also action-driven (connectWebSocket call).
  }, [
    uiState, // Include uiState to re-evaluate when it's changed by actions.
    isQuizDataLoading,
    assetsLoading,
    wsConnectionStatus,
    wsError,
    pageApiError, // Include to avoid re-setting wsError if already set by other error
  ]);

  // Wrapped setter for uiState to also clear pageApiError when moving to a non-error state by action.
  const setHostUiState = useCallback((newState: PageUiState) => {
    setUiState(newState);
    if (newState !== "ERROR") {
      // Errors from props (quizApiError, assetsError, wsError) or lack of quizId
      // will be re-asserted by the effects if those conditions still hold.
      // This clearing is for errors set by direct calls to setPageApiError during actions.
      setPageApiError(null);
    }
  }, []);

  // Explicitly set pageApiError for actions that might encounter errors
  // not covered by the prop-driven error effects (e.g., API call failure in handleStartGameClick).
  const setActionPageApiError = useCallback((error: string | null) => {
    setPageApiError(error);
  }, []);

  return {
    uiState,
    setUiState: setHostUiState,
    pageApiError,
    setPageApiError: setActionPageApiError, // Expose the action-specific error setter
    fetchedGamePin,
    setFetchedGamePin,
  };
}
