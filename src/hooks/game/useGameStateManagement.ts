// src/hooks/game/useGameStateManagement.ts
import { useState, useCallback, useRef, useEffect } from "react";
import {
  LiveGameState,
  QuizStructureHost,
  LivePlayerState,
} from "@/src/lib/types";

const initialGamePin = "PENDING_PIN"; // Use a distinct initial value
const initialHostId = "PENDING_HOST";

// Helper to create default state - Now internal to this hook
const createInitialGameState = (quizId: string | undefined): LiveGameState => ({
  gamePin: initialGamePin,
  quizId: quizId || "",
  hostUserId: initialHostId,
  status: "LOBBY",
  currentQuestionIndex: -1,
  players: {}, // Player state will be managed externally or passed in
  currentQuestionStartTime: null,
  currentQuestionEndTime: null,
  sessionStartTime: Date.now(),
  allowLateJoin: true,
  powerUpsEnabled: false,
});

export function useGameStateManagement(
  initialQuizData: QuizStructureHost | null
) {
  const [liveGameState, setLiveGameState] = useState<LiveGameState | null>(
    null
  );
  const [timerKey, setTimerKey] = useState<string | number>("initial"); // Timer reset key

  // Initialize or update base game state when quiz data changes
  useEffect(() => {
    if (initialQuizData && !liveGameState) {
      console.log(
        "[GameStateHook] Initializing state with quiz:",
        initialQuizData.uuid
      );
      setLiveGameState(createInitialGameState(initialQuizData.uuid));
    } else if (
      initialQuizData &&
      liveGameState &&
      liveGameState.quizId !== initialQuizData.uuid
    ) {
      console.log("[GameStateHook] Updating quizId:", initialQuizData.uuid);
      // Reset state if quiz ID changes fundamentally? Or just update ID?
      // For now, let's reset to ensure consistency, but this could be adjusted.
      setLiveGameState(createInitialGameState(initialQuizData.uuid));
      setTimerKey("initial"); // Reset timer key as well
    }
  }, [initialQuizData, liveGameState]); // Rerun if quizData or existing state changes

  // Function for Page component to initialize session details (PIN, Host ID)
  const initializeSession = useCallback(
    (pin: string, hostId: string) => {
      console.log(
        `[GameStateHook] InitializeSession called with pin: ${pin}, hostId: ${hostId}`
      );
      if (pin === "RESET" && hostId === "RESET") {
        setLiveGameState(null);
        setTimerKey("initial");
        console.log("[GameStateHook] Session reset");
        return;
      }
      // Ensure state is initialized if it wasn't already by useEffect
      setLiveGameState((prev) => {
        const baseState = prev ?? createInitialGameState(initialQuizData?.uuid);
        return {
          ...baseState,
          gamePin: pin,
          hostUserId: hostId,
          status: "LOBBY", // Ensure status is LOBBY on init
          currentQuestionIndex: -1, // Ensure index is reset
          players: {}, // Clear players on new session init
        };
      });
      setTimerKey("lobby"); // Set timer key for lobby phase
    },
    [initialQuizData]
  ); // Dependency on initialQuizData for createInitialGameState

  // --- State Transition Functions ---

  const advanceToQuestion = useCallback(
    (index: number) => {
      console.log(`[GameStateHook] Advancing to question ${index}`);
      setLiveGameState((prev) => {
        if (
          !prev ||
          !initialQuizData ||
          index < 0 ||
          index >= initialQuizData.questions.length
        ) {
          console.error(
            "[GameStateHook] Cannot advance, invalid state or index",
            { prev, index, quizQuestions: initialQuizData?.questions.length }
          );
          return prev; // Return previous state if invalid
        }
        // console.log(`[GameStateHook] Setting state to QUESTION_SHOW for index ${index}`);
        return {
          ...prev,
          status: "QUESTION_SHOW" as const,
          currentQuestionIndex: index,
          currentQuestionStartTime: Date.now(), // Set start time immediately
          // End time calculation might depend on formatted block, handle in coordinator? Or estimate here?
          // Let's estimate here based on host data, coordinator can refine if needed
          currentQuestionEndTime:
            Date.now() + (initialQuizData.questions[index]?.time ?? 0) + 5000, // Add default getReady time estimate
        };
      });
    },
    [initialQuizData]
  ); // Depends on initialQuizData to check index bounds

  const showResults = useCallback(() => {
    // console.log("[GameStateHook] Setting state to QUESTION_RESULT");
    setLiveGameState((prev) => {
      if (!prev || prev.status !== "QUESTION_SHOW") return prev; // Only transition from Q_SHOW
      return {
        ...prev,
        status: "QUESTION_RESULT" as const,
        currentQuestionEndTime: Date.now(), // Mark end time when results are shown
      };
    });
  }, []);

  const showPodium = useCallback(() => {
    // console.log("[GameStateHook] Setting state to PODIUM");
    setLiveGameState((prev) => {
      if (!prev) return null;
      return { ...prev, status: "PODIUM" as const };
    });
  }, []);

  const endGame = useCallback(() => {
    //  console.log("[GameStateHook] Setting state to ENDED");
    setLiveGameState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: "ENDED" as const,
        currentQuestionEndTime: Date.now(),
      };
    });
  }, []);

  const resetGameState = useCallback(() => {
    //  console.log("[GameStateHook] Resetting state completely");
    setLiveGameState(null);
    setTimerKey("initial");
  }, []);

  // --- Update Timer Key ---
  useEffect(() => {
    setTimerKey(
      liveGameState
        ? liveGameState.currentQuestionIndex >= 0
          ? liveGameState.currentQuestionIndex // Use index during questions/results
          : liveGameState.status // Use status string for LOBBY, PODIUM etc.
        : "initial"
    );
  }, [liveGameState?.currentQuestionIndex, liveGameState?.status]);

  return {
    liveGameState,
    setLiveGameState, // Expose setter for player management hook
    timerKey,
    initializeSession,
    advanceToQuestion,
    showResults,
    showPodium,
    endGame,
    resetGameState,
  };
}
