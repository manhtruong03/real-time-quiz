// src/app/game/host/hooks/useHostPageActions.ts
import { useCallback } from "react";
import type { LiveGameState, QuizStructureHost } from "@/src/lib/types";
import type { PageUiState } from "./useHostPageUIStateManager";
import type { ConnectionStatus as WebSocketConnectionStatus } from "@/src/hooks/game/useHostWebSocket";

// Assuming these types are correctly defined based on our previous discussion for toast
import type {
  ToastActionElement as ActualToastActionElement,
  ToastProps as ActualToastProps,
} from "@/src/components/ui/toast";

type ToasterToastForHook = ActualToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ActualToastActionElement;
};
type ToastFunctionArgs = Omit<ToasterToastForHook, "id">;
type ToastFunction = (props: ToastFunctionArgs) => {
  id: string;
  dismiss: () => void;
  update: (props: ToasterToastForHook) => void;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/session";
const APP_PREFIX = "/app";

interface UseHostPageActionsProps {
  // From useHostPageUIStateManager
  uiState: PageUiState;
  setUiState: (state: PageUiState) => void;
  setPageApiError: (error: string | null) => void;
  fetchedGamePin: string | null;
  setFetchedGamePin: (pin: string | null) => void;

  // From useHostGameSetup
  isQuizDataLoading: boolean;
  quizData: QuizStructureHost | null;
  setQuizSetupApiError: (error: string | null) => void;

  // From useGameAssets
  assetsLoading: boolean;

  // From useHostWebSocket
  connectWebSocket: (
    pin: string,
    onConnected?: (hostClientId: string) => void
  ) => void;
  disconnectWebSocket: () => void;
  sendMessage: (destination: string, body: string) => void;
  wsConnectionStatus: WebSocketConnectionStatus;

  // From useHostGameCoordinator
  initializeSession: (gamePin: string, hostClientId: string) => void;
  resetGameState: () => void;
  kickPlayerCidFromCoordinator: (playerId: string) => void;
  executeKickPlayerFromCoordinator: (playerId: string) => void;
  liveGameState: LiveGameState | null; // Crucial for actions like kickPlayer

  // From useAutoStartManager
  handleAutoStartToggleForActions: (enabled: boolean) => void; // Renamed for clarity
  handleAutoStartTimeChangeForActions: (seconds: number | null) => void; // Renamed for clarity

  // From useGameSettingsManager
  setIsSettingsOpenFromManager: (isOpen: boolean) => void;

  // Direct from page context/refs
  toast: ToastFunction;
  lastSentQuestionIndexRef: React.MutableRefObject<number | null>;
}

export function useHostPageActions({
  uiState,
  setUiState,
  setPageApiError,
  fetchedGamePin,
  setFetchedGamePin,
  isQuizDataLoading,
  quizData,
  setQuizSetupApiError,
  assetsLoading,
  connectWebSocket,
  disconnectWebSocket,
  sendMessage,
  wsConnectionStatus,
  initializeSession,
  resetGameState,
  kickPlayerCidFromCoordinator,

  executeKickPlayerFromCoordinator,
  liveGameState,
  handleAutoStartToggleForActions,
  handleAutoStartTimeChangeForActions,
  setIsSettingsOpenFromManager,
  toast,
  lastSentQuestionIndexRef,
}: UseHostPageActionsProps) {
  const handleStartGameClick = useCallback(async () => {
    if (
      uiState !== "INITIAL" ||
      isQuizDataLoading ||
      assetsLoading ||
      !quizData
    ) {
      return;
    }
    setUiState("FETCHING_PIN");
    try {
      const response = await fetch(`${API_BASE_URL}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (response.ok && data.gamePin) {
        setFetchedGamePin(data.gamePin);
        connectWebSocket(data.gamePin, (clientId) => {
          initializeSession(data.gamePin, clientId);
        });
      } else {
        throw new Error(
          data.error || `Failed to create session (Status: ${response.status})`
        );
      }
    } catch (error: any) {
      setPageApiError(error.message || "Failed to start game session.");
      setUiState("ERROR");
    }
  }, [
    uiState,
    isQuizDataLoading,
    assetsLoading,
    quizData, // States for condition
    setUiState,
    setFetchedGamePin,
    connectWebSocket,
    initializeSession,
    setPageApiError, // Actions to call
  ]);

  const handleResetAndGoToInitial = useCallback(() => {
    disconnectWebSocket();
    resetGameState();
    setFetchedGamePin(null);
    if (lastSentQuestionIndexRef) {
      lastSentQuestionIndexRef.current = null;
    }
    setQuizSetupApiError(null); // From useHostGameSetup
    setIsSettingsOpenFromManager(false); // From useGameSettingsManager
    handleAutoStartToggleForActions(false); // From useAutoStartManager
    handleAutoStartTimeChangeForActions(null); // From useAutoStartManager (resets to default)
    setUiState("INITIAL");
    window.location.reload(); // As per original behavior
  }, [
    disconnectWebSocket,
    resetGameState,
    setFetchedGamePin,
    lastSentQuestionIndexRef,
    setQuizSetupApiError,
    setIsSettingsOpenFromManager,
    handleAutoStartToggleForActions,
    handleAutoStartTimeChangeForActions,
    setUiState,
  ]);

  const handleReconnect = useCallback(() => {
    if (fetchedGamePin) {
      setUiState("CONNECTING");
      connectWebSocket(fetchedGamePin, (clientId) => {
        initializeSession(fetchedGamePin, clientId);
        handleAutoStartToggleForActions(false);
        handleAutoStartTimeChangeForActions(null);
      });
    } else {
      handleResetAndGoToInitial(); // Fallback to full reset
    }
  }, [
    fetchedGamePin,
    setUiState,
    connectWebSocket,
    initializeSession,
    handleAutoStartToggleForActions,
    handleAutoStartTimeChangeForActions,
    handleResetAndGoToInitial,
  ]);

  const handleToggleFullScreen = useCallback(() => {
    if (!document.fullscreenEnabled) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Fullscreen not supported.",
      });
      return;
    }
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) =>
        toast({
          variant: "destructive",
          title: "Error",
          description: `Could not enter fullscreen: ${err.message}`,
        })
      );
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [toast]);

  const handleKickPlayer = useCallback(
    (playerId: string) => {
      if (!liveGameState || !liveGameState.players[playerId]) {
        console.warn(
          `[HostPageActions] Player ${playerId} not found for kicking.`
        );
        toast({
          title: "Error",
          description: "Could not kick player: Player not found.",
          variant: "destructive",
        });
        return;
      }

      console.log(
        `[HostPageActions] handleKickPlayer called for player: ${playerId}`
      );
      // Call the function passed from the coordinator
      executeKickPlayerFromCoordinator(playerId);

      // Optionally, provide feedback to the host via toast
      // This toast confirms the action was initiated; actual state update happens in coordinator
      toast({
        title: "Player Kicked",
        description: `Player ${
          liveGameState.players[playerId]?.nickname || playerId
        } has been marked for kicking.`,
      });
    },
    [executeKickPlayerFromCoordinator, liveGameState, toast]
  );

  return {
    handleStartGameClick,
    handleResetAndGoToInitial,
    handleReconnect,
    handleToggleFullScreen,
    handleKickPlayer,
  };
}
