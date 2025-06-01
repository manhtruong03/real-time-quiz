// src/app/game/host/hooks/useAutoStartManager.ts
import { useState, useEffect, useRef, useCallback } from "react";

const DEFAULT_AUTO_START_SECONDS = 30;

interface UseAutoStartManagerProps {
  // Callback to trigger when the auto-start countdown finishes
  onAutoStartTrigger: () => void;
  // Current status of the game, e.g., "LOBBY", "QUESTION_SHOW", etc.
  // Needed to determine if the auto-start timer should run.
  liveGameStatus: string | null | undefined;
  // Indicates if there are any players in the lobby.
  // Auto-start usually only makes sense if there's at least one player.
  hasPlayers: boolean;
}

export function useAutoStartManager({
  onAutoStartTrigger,
  liveGameStatus,
  hasPlayers,
}: UseAutoStartManagerProps) {
  const [isAutoStartEnabled, setIsAutoStartEnabled] = useState(false);
  const [autoStartTimeSeconds, setAutoStartTimeSeconds] = useState<number>(
    DEFAULT_AUTO_START_SECONDS
  ); // Keep as number, null was causing issues.
  const [autoStartCountdown, setAutoStartCountdown] = useState<number | null>(
    null
  );
  const autoStartIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to manage the auto-start interval
  useEffect(() => {
    // Clear any existing interval first
    if (autoStartIntervalRef.current) {
      clearInterval(autoStartIntervalRef.current);
      autoStartIntervalRef.current = null;
    }

    if (
      isAutoStartEnabled &&
      autoStartTimeSeconds > 0 && // Ensure time is positive
      typeof autoStartCountdown === "number" && // Countdown must be actively set
      liveGameStatus === "LOBBY" && // Only run in LOBBY
      hasPlayers // Only run if there are players
    ) {
      autoStartIntervalRef.current = setInterval(() => {
        setAutoStartCountdown((prevCountdown) => {
          if (prevCountdown === null) {
            // Should not happen if logic is correct
            if (autoStartIntervalRef.current)
              clearInterval(autoStartIntervalRef.current);
            return null;
          }
          if (prevCountdown <= 1) {
            // Trigger and clear
            clearInterval(autoStartIntervalRef.current!);
            autoStartIntervalRef.current = null;
            onAutoStartTrigger();
            return 0; // Or null to signify countdown ended
          }
          return prevCountdown - 1;
        });
      }, 1000);
    } else if (autoStartCountdown !== null) {
      // If conditions are not met (e.g., not in LOBBY, no players, or disabled),
      // ensure countdown is reset if it was active.
      setAutoStartCountdown(null);
    }

    return () => {
      if (autoStartIntervalRef.current) {
        clearInterval(autoStartIntervalRef.current);
      }
    };
  }, [
    isAutoStartEnabled,
    autoStartTimeSeconds,
    autoStartCountdown, // Re-evaluate when countdown itself changes (e.g., manually set)
    liveGameStatus,
    hasPlayers,
    onAutoStartTrigger,
  ]);

  const handleAutoStartToggle = useCallback(
    (enabled: boolean) => {
      setIsAutoStartEnabled(enabled);
      if (!enabled) {
        setAutoStartCountdown(null); // Clear countdown when disabling
        if (autoStartIntervalRef.current) {
          clearInterval(autoStartIntervalRef.current);
          autoStartIntervalRef.current = null;
        }
      } else {
        // If enabling and conditions are met (in LOBBY, has players), start countdown.
        // The useEffect will also pick this up, but setting it here can make it more immediate.
        if (
          liveGameStatus === "LOBBY" &&
          hasPlayers &&
          autoStartTimeSeconds > 0
        ) {
          setAutoStartCountdown(autoStartTimeSeconds);
        } else {
          // If conditions not met, ensure countdown isn't active from a previous state.
          setAutoStartCountdown(null);
        }
      }
    },
    [liveGameStatus, hasPlayers, autoStartTimeSeconds]
  ); // autoStartTimeSeconds needed to set initial countdown

  const handleAutoStartTimeChange = useCallback(
    (seconds: number | null) => {
      const newTime =
        seconds === null || seconds <= 0 ? DEFAULT_AUTO_START_SECONDS : seconds;
      setAutoStartTimeSeconds(newTime);
      if (isAutoStartEnabled) {
        // If auto-start is already enabled, update the countdown to the new time.
        // This also handles the case where seconds becomes null/invalid, resetting to default.
        if (liveGameStatus === "LOBBY" && hasPlayers) {
          setAutoStartCountdown(newTime);
        } else {
          // If not in lobby or no players, just update the setting, don't start countdown.
          // Or, if it was counting, stop it.
          setAutoStartCountdown(null);
        }
        // The useEffect will clear and restart the interval if necessary.
      }
    },
    [isAutoStartEnabled, liveGameStatus, hasPlayers]
  ); // Dependencies needed to correctly restart/clear countdown

  // This effect from page.tsx was to initiate countdown when a player joins and auto-start is enabled.
  // It's now integrated into the main interval useEffect's conditions (hasPlayers)
  // and handleAutoStartToggle when enabling.
  // The onPlayerJoined callback in HostPageContent can also call setAutoStartCountdown if specific conditions are met.
  // For this hook, we ensure that if `hasPlayers` becomes true and `isAutoStartEnabled` is true,
  // and `liveGameStatus` is LOBBY, the main effect kicks in.

  // If `isAutoStartEnabled` is true, and `autoStartCountdown` is null (meaning it's not running),
  // AND we are in the LOBBY with players, then `autoStartCountdown` should be initialized.
  // This covers the case where auto-start is enabled *before* players join or *before* entering lobby.
  useEffect(() => {
    if (
      isAutoStartEnabled &&
      autoStartCountdown === null &&
      liveGameStatus === "LOBBY" &&
      hasPlayers &&
      autoStartTimeSeconds > 0
    ) {
      setAutoStartCountdown(autoStartTimeSeconds);
    }
  }, [
    isAutoStartEnabled,
    autoStartCountdown,
    liveGameStatus,
    hasPlayers,
    autoStartTimeSeconds,
  ]);

  return {
    isAutoStartEnabled,
    autoStartTimeSeconds,
    autoStartCountdown,
    handleAutoStartToggle,
    handleAutoStartTimeChange,
    // Expose setAutoStartCountdown if it needs to be triggered from external events directly (like onPlayerJoined)
    setAutoStartCountdown,
  };
}
