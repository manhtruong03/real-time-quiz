// src/app/game/host/page.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { WifiOff } from "lucide-react";
// --- Import the main HostView ---
import HostView from "@/src/components/game/views/HostView";
import DevMockControls, {
  MockWebSocketMessage,
} from "@/src/components/game/DevMockControls";
import mockFullQuizData from "@/src/__mocks__/api/quiz_sample_all_types"; // Keep for initial load
import {
  QuizStructureHost,
  LiveGameState,
  LivePlayerState,
  GameBlock,
} from "@/src/lib/types";
import { useHostGameCoordinator } from "@/src/hooks/useHostGameCoordinator";
import {
  useHostWebSocket,
  ConnectionStatus as WebSocketConnectionStatus,
} from "@/src/hooks/game/useHostWebSocket";
import {
  GameAssetsProvider,
  useGameAssets,
} from "@/src/context/GameAssetsContext";
import { GameSettingsDialog } from "@/src/components/game/settings/GameSettingsDialog";
import { InitialHostView } from "@/src/components/game/host/InitialHostView";
import { ConnectingHostView } from "@/src/components/game/host/ConnectingHostView";
import { ErrorHostView } from "@/src/components/game/host/ErrorHostView";
import { DisconnectedHostView } from "@/src/components/game/host/DisconnectedHostView";
import { HostLobbyView } from "@/src/components/game/host/lobby/HostLobbyView"; // Keep LobbyView
import { useToast } from "@/src/components/ui/use-toast";
import { useHostAudioManager } from "@/src/hooks/game/useHostAudioManager";
// --- Remove temporary imports ---
// import { HostAnswerStatsView } from '@/src/components/game/host/views/HostAnswerStatsView';
// import mockCurrentBlockDetail from '@/src/__mocks__/websockets/question_...';

// Constants
const API_BASE_URL = "http://localhost:8080/api/session";
const TOPIC_PREFIX = "/topic";
const DEFAULT_AUTO_START_SECONDS = 30;

// Main Page Component Structure
const HostPageContent = () => {
  // --- State Variables (Unchanged) ---
  type PageUiState =
    | "INITIAL"
    | "FETCHING_PIN"
    | "CONNECTING"
    | "CONNECTED"
    | "DISCONNECTED"
    | "ERROR";
  const [uiState, setUiState] = useState<PageUiState>("INITIAL");
  const [apiError, setApiError] = useState<string | null>(null);
  const [fetchedGamePin, setFetchedGamePin] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<QuizStructureHost | null>(null);
  const [isQuizLoading, setIsQuizLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<
    string | null
  >(null);
  const [selectedSoundId, setSelectedSoundId] = useState<string | null>(null);
  const lastSentQuestionIndexRef = useRef<number | null>(null);
  const [isAutoStartEnabled, setIsAutoStartEnabled] = useState(false);
  const [autoStartTimeSeconds, setAutoStartTimeSeconds] = useState<
    number | null
  >(DEFAULT_AUTO_START_SECONDS);
  const [autoStartCountdown, setAutoStartCountdown] = useState<number | null>(
    null
  );
  const autoStartIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { toast } = useToast();

  // --- Hooks (Unchanged) ---
  const {
    backgrounds,
    sounds,
    isLoading: assetsLoading,
    error: assetsError,
  } = useGameAssets();
  const { isMuted, toggleMute } = useHostAudioManager({ selectedSoundId });
  const liveGameStateRef = useRef<LiveGameState | null>(null);

  const {
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
    sendMessage,
    connectionStatus: wsConnectionStatus,
    error: wsError,
    hostClientId,
  } = useHostWebSocket({
    onMessageReceived: (message) => {
      if (coordinatorRef.current?.handleWebSocketMessage) {
        coordinatorRef.current.handleWebSocketMessage(message.body);
      } else {
        console.warn(
          "[HostPage] Coordinator ref not ready for message handling."
        );
      }
    },
  });

  const handlePlayerJoined = useCallback(
    (joiningPlayerCid: string) => {
      // ... (same logic as before) ...
      const currentSelectedBgId = selectedBackgroundId;
      const currentPin = liveGameStateRef.current?.gamePin ?? fetchedGamePin;
      if (
        currentSelectedBgId &&
        currentPin &&
        wsConnectionStatus === "CONNECTED"
      ) {
        const contentPayload = { background: { id: currentSelectedBgId } };
        const contentString = JSON.stringify(contentPayload);
        const wsMessageEnvelope = {
          channel: `${TOPIC_PREFIX}/player/${currentPin}`,
          clientId: null,
          data: {
            gameid: currentPin,
            id: 35,
            type: "message",
            host: "VuiQuiz.com",
            content: contentString,
            cid: joiningPlayerCid,
          },
          ext: { timetrack: Date.now() },
        };
        const messageToSend = JSON.stringify([wsMessageEnvelope]);
        sendMessage(wsMessageEnvelope.channel, messageToSend);
      }
      // --- Auto-Start Logic ---
      if (
        isAutoStartEnabled &&
        autoStartTimeSeconds !== null &&
        liveGameStateRef.current &&
        Object.keys(liveGameStateRef.current.players).length > 0 &&
        autoStartCountdown === null &&
        autoStartIntervalRef.current === null
      ) {
        setAutoStartCountdown(autoStartTimeSeconds);
      }
    },
    [
      selectedBackgroundId,
      wsConnectionStatus,
      fetchedGamePin,
      sendMessage,
      isAutoStartEnabled,
      autoStartTimeSeconds,
      autoStartCountdown,
    ]
  );

  const coordinator = useHostGameCoordinator({
    initialQuizData: quizData,
    onPlayerJoined: handlePlayerJoined,
  });
  const coordinatorRef = useRef(coordinator);
  useEffect(() => {
    coordinatorRef.current = coordinator;
  }, [coordinator]);
  const {
    liveGameState,
    currentBlock,
    timerKey,
    currentQuestionAnswerCount,
    currentTotalPlayers,
    handleNext,
    handleSkip,
    handleTimeUp,
    initializeSession,
    prepareQuestionMessage,
    prepareResultMessage,
    resetGameState,
  } = coordinator; // quizData is now part of coordinator return if needed, or use the one in page state
  useEffect(() => {
    liveGameStateRef.current = liveGameState;
  }, [liveGameState]);

  // Effect to load initial quiz data (unchanged)
  useEffect(() => {
    setIsQuizLoading(true);
    const mockData = mockFullQuizData as QuizStructureHost;
    setQuizData(mockData); // Use the state variable 'quizData'
    setIsQuizLoading(false);
  }, []);

  // Effect to set initial background/sound (unchanged)
  useEffect(() => {
    if (!assetsLoading && !assetsError) {
      if (selectedBackgroundId === null && backgrounds.length > 0) {
        const firstActiveBg = backgrounds.find((bg) => bg.is_active);
        if (firstActiveBg) setSelectedBackgroundId(firstActiveBg.background_id);
      }
      if (selectedSoundId === null && sounds.length > 0) {
        const firstActiveLobbySound = sounds.find(
          (s) => s.sound_type === "LOBBY" && s.is_active
        );
        if (firstActiveLobbySound)
          setSelectedSoundId(firstActiveLobbySound.sound_id);
      }
    }
  }, [
    assetsLoading,
    assetsError,
    backgrounds,
    sounds,
    selectedBackgroundId,
    selectedSoundId,
  ]);

  // Effect to sync Page UI state with WebSocket connection status (unchanged)
  useEffect(() => {
    if (wsConnectionStatus === "CONNECTING") setUiState("CONNECTING");
    else if (wsConnectionStatus === "CONNECTED") setUiState("CONNECTED");
    else if (wsConnectionStatus === "DISCONNECTED") {
      if (uiState !== "INITIAL" && uiState !== "ERROR")
        setUiState("DISCONNECTED");
    } else if (wsConnectionStatus === "ERROR") {
      setApiError(wsError ?? "Unknown WebSocket error.");
      setUiState("ERROR");
    }
  }, [wsConnectionStatus, wsError, uiState]);

  // Effect for sending Question/Result messages (KEEP THIS ACTIVE)
  useEffect(() => {
    if (!liveGameState) return;
    if (uiState !== "CONNECTED" || wsConnectionStatus !== "CONNECTED") return; // Ensure WS is connected too

    const { status, gamePin, players, hostUserId, currentQuestionIndex } =
      liveGameState;

    // --- Send QUESTION ---
    if (status === "QUESTION_SHOW" || status === "QUESTION_GET_READY") {
      // Send only if the index just changed
      if (
        currentBlock &&
        currentBlock.questionIndex === currentQuestionIndex &&
        lastSentQuestionIndexRef.current !== currentQuestionIndex
      ) {
        const messageString = prepareQuestionMessage(); // Uses coordinator's currentBlock
        if (messageString && gamePin) {
          const destination = `${TOPIC_PREFIX}/player/${gamePin}`;
          console.log(
            `[HostPage Effect] Sending question ${currentQuestionIndex} to ${destination}`
          );
          sendMessage(destination, messageString);
          lastSentQuestionIndexRef.current = currentQuestionIndex; // Mark as sent
        } else {
          console.warn(
            "[HostPage Effect] Could not send question - missing message string or game pin."
          );
        }
      }
    }
    // --- Send RESULTS (after stats calculation) ---
    else if (status === "SHOWING_STATS") {
      // Send results when showing stats
      // Ensure we send results only once per question transition to stats
      if (lastSentQuestionIndexRef.current === currentQuestionIndex) {
        console.log(
          `[HostPage Effect] Preparing results for Q ${currentQuestionIndex}`
        );
        if (players && Object.keys(players).length > 0 && gamePin) {
          Object.keys(players).forEach((playerId) => {
            // Avoid sending result to host if host is listed as player (shouldn't happen often)
            if (playerId !== hostUserId) {
              const messageString = prepareResultMessage(playerId);
              if (messageString) {
                const destination = `${TOPIC_PREFIX}/player/${gamePin}`; // Broadcast or target? Protocol doc says /service/player often used
                // console.log(`[HostPage Effect] Sending result to ${playerId} via ${destination}`);
                sendMessage(destination, messageString);
              } else {
                console.warn(
                  `[HostPage Effect] Could not prepare result for ${playerId}.`
                );
              }
            }
          });
        } else {
          console.warn(
            "[HostPage Effect] Cannot send results: No players found or no game pin."
          );
        }
        // Mark results as sent for this question index by clearing the ref
        lastSentQuestionIndexRef.current = null;
      }
    }
    // --- Send PODIUM ---
    else if (status === "PODIUM") {
      // TODO: Implement sending podium/final result message (e.g., data.id = 13)
      console.log("[HostPage Effect] TODO: Send Podium Message");
      lastSentQuestionIndexRef.current = null; // Clear ref
    }
    // Clear ref if returning to lobby unexpectedly
    else if (status === "LOBBY") {
      if (lastSentQuestionIndexRef.current !== null) {
        lastSentQuestionIndexRef.current = null;
      }
    }
  }, [
    liveGameState, // React to any game state change
    currentBlock, // React to currentBlock changes
    uiState,
    wsConnectionStatus, // Ensure connected
    sendMessage,
    prepareQuestionMessage,
    prepareResultMessage, // Use coordinator functions
  ]);

  // Effect for Auto-Start Countdown (unchanged)
  useEffect(() => {
    // ... (same logic) ...
    if (autoStartIntervalRef.current) {
      clearInterval(autoStartIntervalRef.current);
      autoStartIntervalRef.current = null;
    }
    if (
      isAutoStartEnabled &&
      autoStartTimeSeconds !== null &&
      typeof autoStartCountdown === "number" &&
      liveGameState?.status === "LOBBY"
    ) {
      autoStartIntervalRef.current = setInterval(() => {
        setAutoStartCountdown((prevCountdown) => {
          if (prevCountdown === null) {
            if (autoStartIntervalRef.current)
              clearInterval(autoStartIntervalRef.current);
            autoStartIntervalRef.current = null;
            return null;
          }
          if (prevCountdown <= 1) {
            clearInterval(autoStartIntervalRef.current!);
            autoStartIntervalRef.current = null;
            handleNext();
            return 0;
          }
          return prevCountdown - 1;
        });
      }, 1000);
    } else if (autoStartCountdown !== null) {
      setAutoStartCountdown(null);
    }
    return () => {
      if (autoStartIntervalRef.current) {
        clearInterval(autoStartIntervalRef.current);
        autoStartIntervalRef.current = null;
      }
    };
  }, [
    isAutoStartEnabled,
    autoStartTimeSeconds,
    autoStartCountdown,
    liveGameState?.status,
    handleNext,
  ]);

  // Effect for WebSocket cleanup on unmount (unchanged)
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  // Effect for Fullscreen (unchanged)
  useEffect(() => {
    // ... (same logic) ...
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // === Action Handlers (unchanged) ===
  const handleStartGameClick = async () => {
    /* ... same logic ... */
    if (!quizData) {
      setApiError("Quiz data not ready.");
      setUiState("ERROR");
      return;
    }
    setUiState("FETCHING_PIN");
    setApiError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await response.json();
      if (response.ok && data.gamePin) {
        setFetchedGamePin(data.gamePin);
        connectWebSocket(data.gamePin, (clientId) => {
          initializeSession(data.gamePin, clientId);
        });
      } else { throw new Error(data.error || `Failed to create session (Status: ${response.status})`); }
    } catch (error: any) {
      console.error("HostPage: Error creating session:", error);
      setApiError(error.message || "Failed to start game."); setUiState('ERROR');
    }
  };
  const handleResetAndGoToInitial = () => {
    /* ... same logic ... */
    disconnectWebSocket();
    resetGameState();
    setApiError(null);
    setFetchedGamePin(null);
    lastSentQuestionIndexRef.current = null;
    setSelectedBackgroundId(null);
    setSelectedSoundId(null);
    setIsSettingsOpen(false);
    setIsAutoStartEnabled(false);
    setAutoStartTimeSeconds(DEFAULT_AUTO_START_SECONDS);
    setAutoStartCountdown(null);
    if (autoStartIntervalRef.current)
      clearInterval(autoStartIntervalRef.current);
    autoStartIntervalRef.current = null;
    setUiState("INITIAL");
  };
  const handleReconnect = () => {
    /* ... same logic ... */
    if (fetchedGamePin) {
      connectWebSocket(fetchedGamePin, (clientId) => {
        initializeSession(fetchedGamePin, clientId);
        setIsAutoStartEnabled(false);
        setAutoStartTimeSeconds(DEFAULT_AUTO_START_SECONDS);
        setAutoStartCountdown(null);
      });
    } else {
      handleResetAndGoToInitial();
    }
  };
  const handleOpenSettings = () => setIsSettingsOpen(true);
  const handleSoundSelect = (soundId: string) => {
    /* ... same logic ... */ setSelectedSoundId(soundId);
    setIsSettingsOpen(false);
  };
  const handleBackgroundSelect = (backgroundId: string) => {
    /* ... same logic ... */
    setSelectedBackgroundId(backgroundId);
    setIsSettingsOpen(false);
    const currentPin = liveGameState?.gamePin ?? fetchedGamePin;
    if (currentPin && wsConnectionStatus === "CONNECTED") {
      const contentPayload = { background: { id: backgroundId } };
      const contentString = JSON.stringify(contentPayload);
      const wsMessageEnvelope = {
        channel: `${TOPIC_PREFIX}/player/${currentPin}`,
        clientId: null,
        data: {
          gameid: currentPin,
          id: 35,
          type: "message",
          host: "VuiQuiz.com",
          content: contentString,
        },
        ext: { timetrack: Date.now() },
      };
      const messageToSend = JSON.stringify([wsMessageEnvelope]);
      sendMessage(wsMessageEnvelope.channel, messageToSend);
    }
  };
  const handleAutoStartToggle = (enabled: boolean) => {
    /* ... same logic ... */
    setIsAutoStartEnabled(enabled);
    if (!enabled) {
      setAutoStartCountdown(null);
      if (autoStartIntervalRef.current)
        clearInterval(autoStartIntervalRef.current);
      autoStartIntervalRef.current = null;
    } else if (
      autoStartTimeSeconds !== null &&
      liveGameStateRef.current &&
      Object.keys(liveGameStateRef.current.players).length > 0
    ) {
      setAutoStartCountdown(autoStartTimeSeconds);
    }
  };
  const handleAutoStartTimeChange = (seconds: number | null) => {
    /* ... same logic ... */
    setAutoStartTimeSeconds(seconds);
    if (isAutoStartEnabled && seconds !== null) {
      setAutoStartCountdown(seconds);
    } else if (seconds === null) {
      setAutoStartCountdown(null);
      if (autoStartIntervalRef.current)
        clearInterval(autoStartIntervalRef.current);
      autoStartIntervalRef.current = null;
    }
  };
  const handleToggleFullScreen = () => {
    /* ... same logic ... */
    if (!document.fullscreenEnabled) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Fullscreen is not supported.",
      });
      return;
    }
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not enter fullscreen.",
        });
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  const handleKickPlayer = (playerIdToKick: string) => {
    /* TODO */
  };

  // --- Rendering Logic ---
  const renderPageActualContent = () => {
    switch (uiState) {
      // Cases INITIAL, FETCHING_PIN, CONNECTING, ERROR, DISCONNECTED (unchanged)
      case "INITIAL":
        return (
          <InitialHostView
            onStartGameClick={handleStartGameClick}
            isQuizLoading={isQuizLoading || assetsLoading}
            isDisabled={uiState !== "INITIAL"}
          />
        );
      case "FETCHING_PIN":
        return <ConnectingHostView message="Getting Game Pin..." />;
      case "CONNECTING":
        return (
          <ConnectingHostView
            message={`Connecting to WebSocket for Game Pin: ${fetchedGamePin}...`}
          />
        );
      case "ERROR":
        return (
          <ErrorHostView
            errorMessage={apiError || assetsError}
            onRetry={handleResetAndGoToInitial}
          />
        );
      case "DISCONNECTED":
        return (
          <DisconnectedHostView
            onStartNewGame={handleResetAndGoToInitial}
            onReconnect={handleReconnect}
            gamePin={fetchedGamePin}
          />
        );

      // --- UPDATED 'CONNECTED' CASE ---
      case "CONNECTED":
        // Show loading if assets or the base quiz structure are still loading
        if (assetsLoading || isQuizLoading)
          return <ConnectingHostView message="Loading assets..." />;
        // Show error if assets failed
        if (assetsError)
          return (
            <ErrorHostView
              errorMessage={assetsError}
              onRetry={handleResetAndGoToInitial}
            />
          );
        // Show error if coordinator doesn't have game state yet (should be brief)
        if (!liveGameState)
          return <ConnectingHostView message="Initializing game state..." />;

        // Render Lobby or the main HostView based on game status
        return (
          <>
            {liveGameState.status === "LOBBY" ? (
              <HostLobbyView
                quizTitle={quizData?.title ?? "Quiz"} // Use quizData from page state
                gamePin={liveGameState.gamePin}
                accessUrl={"VuiQuiz.com"}
                participants={Object.values(liveGameState.players ?? {})}
                selectedBackgroundId={selectedBackgroundId}
                onStartGame={handleNext} // Use coordinator's handler
                onEndGame={handleResetAndGoToInitial} // Use page's handler
                onKickPlayer={handleKickPlayer}
                isAutoStartEnabled={isAutoStartEnabled}
                onAutoStartToggle={handleAutoStartToggle}
                autoStartTimeSeconds={autoStartTimeSeconds}
                onAutoStartTimeChange={handleAutoStartTimeChange}
                autoStartCountdown={autoStartCountdown}
                onSettingsClick={handleOpenSettings}
                isMuted={isMuted}
                onToggleMute={toggleMute}
                isFullScreen={isFullScreen}
                onToggleFullScreen={handleToggleFullScreen}
              />
            ) : (
              // For all other in-game states, render HostView
              <HostView
                liveGameState={liveGameState} // Pass the whole game state
                quizData={quizData} // Pass the base quiz structure
                currentBlock={currentBlock} // Pass the formatted block from coordinator
                timerKey={timerKey} // Pass timer key from coordinator
                currentAnswerCount={currentQuestionAnswerCount} // Pass calculated count
                totalPlayers={currentTotalPlayers} // Pass calculated total
                gamePin={liveGameState.gamePin} // Pass pin
                accessUrl={"VuiQuiz.com"} // Pass access URL
                onTimeUp={handleTimeUp} // Pass coordinator handler
                onSkip={handleSkip} // Pass coordinator handler
                onNext={handleNext} // Pass coordinator handler
                // isLoading prop for HostView might not be needed if handled above
                selectedSoundId={selectedSoundId}
                selectedBackgroundId={selectedBackgroundId}
                onSettingsClick={handleOpenSettings}
                isMuted={isMuted}
                onToggleMute={toggleMute}
              />
            )}

            {/* Keep DevControls and SettingsDialog available outside the conditional rendering */}
            {process.env.NODE_ENV === "development" && (
              <DevMockControls
                simulatePlayerAnswer={(msgBody) =>
                  coordinatorRef.current?.handleWebSocketMessage(msgBody)
                }
                simulateHostReceiveJoin={(msgBody) =>
                  coordinatorRef.current?.handleWebSocketMessage(msgBody)
                }
                loadMockBlock={() => {
                  console.warn(
                    "loadMockBlock via DevControls might conflict with coordinator state."
                  );
                }}
                setMockResult={() => {
                  console.warn(
                    "setMockResult via DevControls might conflict with coordinator state."
                  );
                }}
              />
            )}
            <GameSettingsDialog
              open={isSettingsOpen}
              onOpenChange={setIsSettingsOpen}
              selectedBackgroundId={selectedBackgroundId}
              onBackgroundSelect={handleBackgroundSelect}
              selectedSoundId={selectedSoundId}
              onSoundSelect={handleSoundSelect}
            />
          </>
        );
      // --- END UPDATED 'CONNECTED' CASE ---

      default:
        return (
          <ErrorHostView
            errorMessage="Invalid UI state."
            onRetry={handleResetAndGoToInitial}
          />
        );
    }
  };

  return renderPageActualContent();
};

// Default Export with Provider (unchanged)
export default function HostPage() {
  return (
    <GameAssetsProvider>
      <HostPageContent />
    </GameAssetsProvider>
  );
}
