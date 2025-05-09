// src/hooks/game/useGameStateManagement.ts
import { useState, useCallback, useRef, useEffect } from "react";
import {
  LiveGameState,
  QuizStructureHost,
  // LivePlayerState, // Not directly used in createInitialGameState signature
  QuestionAnswerStats,
  PlayerScoreRankSnapshot,
} from "@/src/lib/types";

const initialGamePin = "PENDING_PIN";
const initialHostId = "PENDING_HOST";

const createInitialGameState = (quizId: string | undefined): LiveGameState => ({
  gamePin: initialGamePin,
  quizId: quizId || "",
  hostUserId: initialHostId,
  status: "LOBBY",
  currentQuestionIndex: -1,
  players: {},
  currentQuestionStartTime: null,
  currentQuestionEndTime: null,
  sessionStartTime: Date.now(),
  allowLateJoin: true,
  powerUpsEnabled: false,
  currentQuestionStats: null,
  previousPlayerStateForScoreboard: null, // Initialize as null
});

export function useGameStateManagement(
  initialQuizData: QuizStructureHost | null
) {
  const [liveGameState, setLiveGameState] = useState<LiveGameState | null>(
    null
  );
  const [timerKey, setTimerKey] = useState<string | number>("initial");

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
      setLiveGameState(createInitialGameState(initialQuizData.uuid));
      setTimerKey("initial");
    }
  }, [initialQuizData, liveGameState]);

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
      setLiveGameState((prev) => {
        // When initializing a new session, previousPlayerState should be null
        const baseState = createInitialGameState(initialQuizData?.uuid);
        return {
          ...baseState,
          gamePin: pin,
          hostUserId: hostId,
          status: "LOBBY",
          // players: {}, // Already handled by createInitialGameState
          // currentQuestionIndex: -1, // Already handled
          previousPlayerStateForScoreboard: null, // Already handled
        };
      });
      setTimerKey("lobby");
    },
    [initialQuizData] // initialQuizData is used in createInitialGameState
  );

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
          return prev;
        }

        // Capture the current state of players to serve as the "previous" state
        // for the question we are NOW advancing to.
        const snapshotForUpcomingQuestion: Record<
          string,
          PlayerScoreRankSnapshot
        > = {};
        // Only capture if not coming from LOBBY (no scores/ranks yet)
        // or if there are players to snapshot.
        if (prev.status !== "LOBBY" && Object.keys(prev.players).length > 0) {
          Object.entries(prev.players).forEach(([cid, p]) => {
            snapshotForUpcomingQuestion[cid] = {
              score: p.totalScore,
              rank: p.rank,
            };
          });
          console.log(
            `[GameStateHook - advanceToQuestion ${index}] Captured previousPlayerStateForScoreboard:`,
            JSON.stringify(snapshotForUpcomingQuestion, null, 2)
          );
        } else if (prev.status === "LOBBY") {
          console.log(
            `[GameStateHook - advanceToQuestion ${index}] Coming from LOBBY, previousPlayerStateForScoreboard remains null.`
          );
        }

        return {
          ...prev,
          status: "QUESTION_SHOW",
          currentQuestionIndex: index,
          currentQuestionStartTime: Date.now(),
          currentQuestionEndTime: null,
          currentQuestionStats: null,
          // This field now correctly stores the state *before* the current question (index) is answered.
          previousPlayerStateForScoreboard:
            Object.keys(snapshotForUpcomingQuestion).length > 0
              ? snapshotForUpcomingQuestion
              : null,
        };
      });
    },
    [initialQuizData]
  );

  const transitionToStatsView = useCallback(
    (calculatedStats: QuestionAnswerStats | null) => {
      console.log("[GameStateHook] Transitioning state to SHOWING_STATS");
      setLiveGameState((prev) => {
        if (
          !prev ||
          (prev.status !== "QUESTION_SHOW" &&
            prev.status !== "QUESTION_GET_READY")
        ) {
          console.warn(
            `[GameStateHook] Attempted to transition to SHOWING_STATS from invalid state: ${prev?.status}`
          );
          return prev;
        }

        // At this point, prev.players ALREADY reflects the scores/ranks
        // AFTER the question (prev.currentQuestionIndex) just finished.
        // The prev.previousPlayerStateForScoreboard holds the state captured by advanceToQuestion,
        // which is the state BEFORE the question just finished. This is correct for scoreboard animations.

        console.log(
          "[GameStateHook - transitionToStatsView] Current players (for display on stats/scoreboard):",
          JSON.stringify(prev.players, null, 2)
        );
        console.log(
          "[GameStateHook - transitionToStatsView] Previous player state (for animation 'from' values):",
          JSON.stringify(prev.previousPlayerStateForScoreboard, null, 2)
        );

        return {
          ...prev,
          status: "SHOWING_STATS",
          currentQuestionEndTime: Date.now(),
          currentQuestionStats: calculatedStats,
          // previousPlayerStateForScoreboard is NOT changed here. It was set by advanceToQuestion.
        };
      });
    },
    []
  );

  const transitionToShowingScoreboard = useCallback(() => {
    console.log("[GameStateHook] Transitioning state to SHOWING_SCOREBOARD");
    setLiveGameState((prev) => {
      if (!prev || prev.status !== "SHOWING_STATS") {
        console.warn(
          `[GameStateHook] Attempted to transition to SHOWING_SCOREBOARD from invalid state: ${prev?.status}`
        );
        return prev;
      }
      // No change to previousPlayerStateForScoreboard, it's carried over from the SHOWING_STATS state.
      // It should hold the state from *before* the last question's results were calculated.
      // And prev.players holds the state *after* the last question's results. This is the desired setup.
      return {
        ...prev,
        status: "SHOWING_SCOREBOARD",
      };
    });
  }, []);

  const showPodium = useCallback(() => {
    console.log("[GameStateHook] Setting state to PODIUM");
    setLiveGameState((prev) => {
      if (!prev) return null;
      // For the podium, previousPlayerStateForScoreboard should reflect the final state before showing the podium.
      // It might be the same state that was used for the last scoreboard.
      const finalSnapshot: Record<string, PlayerScoreRankSnapshot> = {};
      Object.entries(prev.players).forEach(([cid, p]) => {
        finalSnapshot[cid] = {
          score: p.totalScore,
          rank: p.rank,
        };
      });
      return {
        ...prev,
        status: "PODIUM",
        previousPlayerStateForScoreboard: finalSnapshot, // Or could just use prev.players directly in PodiumView
      };
    });
  }, []);

  const endGame = useCallback(() => {
    console.log("[GameStateHook] Setting state to ENDED");
    setLiveGameState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: "ENDED",
        currentQuestionEndTime: Date.now(),
      };
    });
  }, []);

  const resetGameState = useCallback(() => {
    console.log("[GameStateHook] Resetting state completely");
    setLiveGameState(null); // This will trigger the useEffect to re-create with initialQuizData if available
    setTimerKey("initial");
  }, []);

  useEffect(() => {
    setTimerKey(
      liveGameState
        ? liveGameState.currentQuestionIndex >= 0
          ? liveGameState.currentQuestionIndex
          : liveGameState.status
        : "initial"
    );
  }, [liveGameState?.currentQuestionIndex, liveGameState?.status]);

  return {
    liveGameState,
    setLiveGameState,
    timerKey,
    initializeSession,
    advanceToQuestion,
    transitionToStatsView,
    transitionToShowingScoreboard,
    showPodium,
    endGame,
    resetGameState,
  };
}
