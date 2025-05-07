// src/app/game/host/page.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { WifiOff, Loader2 } from "lucide-react";

// --- Import API function ---
import { fetchQuizDetails } from "@/src/lib/api/quizzes";

// --- Other imports remain the same ---
import HostView from "@/src/components/game/views/HostView";
import DevMockControls from "@/src/components/game/DevMockControls"; // Removed MockWebSocketMessage import if unused here
import {
  QuizStructureHost,
  LiveGameState,
} from "@/src/lib/types"; // Removed unused types like LivePlayerState, GameBlock if only used in HostView/Coordinator
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
import { InitialHostView } from "@/src/components/game/host/InitialHostView"; // Keep InitialHostView
import { ConnectingHostView } from "@/src/components/game/host/ConnectingHostView";
import { ErrorHostView } from "@/src/components/game/host/ErrorHostView";
import { DisconnectedHostView } from "@/src/components/game/host/DisconnectedHostView";
import { HostLobbyView } from "@/src/components/game/host/lobby/HostLobbyView";
import { useToast } from "@/src/components/ui/use-toast";
import { useHostAudioManager } from "@/src/hooks/game/useHostAudioManager";

// Constants remain the same
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/session";
const TOPIC_PREFIX = "/topic";
const DEFAULT_AUTO_START_SECONDS = 30;

// --- HostPageContent Component ---
const HostPageContent = () => {
  const searchParams = useSearchParams();
  const quizId = searchParams.get('quizId');

  // --- State Variables ---
  // Keep original PageUiState
  type PageUiState =
    | "INITIAL"
    | "FETCHING_PIN"
    | "CONNECTING"
    | "CONNECTED"
    | "DISCONNECTED"
    | "ERROR";
  const [uiState, setUiState] = useState<PageUiState>("INITIAL"); // Start in INITIAL state
  const [apiError, setApiError] = useState<string | null>(null);
  const [fetchedGamePin, setFetchedGamePin] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<QuizStructureHost | null>(null);
  const [isQuizDataLoading, setIsQuizDataLoading] = useState(true); // NEW: Loading state for quiz data fetch
  // Other states remain the same
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | null>(null);
  const [selectedSoundId, setSelectedSoundId] = useState<string | null>(null);
  const lastSentQuestionIndexRef = useRef<number | null>(null);
  const [isAutoStartEnabled, setIsAutoStartEnabled] = useState(false);
  const [autoStartTimeSeconds, setAutoStartTimeSeconds] = useState<number | null>(DEFAULT_AUTO_START_SECONDS);
  const [autoStartCountdown, setAutoStartCountdown] = useState<number | null>(null);
  const autoStartIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { toast } = useToast();

  // --- Hooks ---
  const {
    backgrounds,
    sounds,
    isLoading: assetsLoading, // Keep asset loading separate
    error: assetsError,
  } = useGameAssets();
  const { isMuted, toggleMute } = useHostAudioManager({ selectedSoundId });
  // WebSocket and Coordinator Hooks (remain the same)
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
        console.warn("[HostPage] Coordinator ref not ready for message handling.");
      }
    },
  });

  const handlePlayerJoined = useCallback(/* ... (same as before) ... */
    (joiningPlayerCid: string) => {
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
      // Auto-Start Logic
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
  } = coordinator;
  useEffect(() => {
    liveGameStateRef.current = liveGameState;
  }, [liveGameState]);


  // --- Effect to load quiz data based on quizId ---
  useEffect(() => {
    if (!quizId) {
      setApiError("No Quiz ID provided in the URL.");
      setUiState("ERROR"); // Transition to error state if no ID
      setIsQuizDataLoading(false); // Stop loading
      return;
    }

    let isMounted = true;
    setIsQuizDataLoading(true); // Start loading quiz data
    setApiError(null);

    fetchQuizDetails(quizId)
      .then((fetchedQuiz) => {
        if (isMounted) {
          console.log("[HostPage] Quiz data fetched:", fetchedQuiz.title);
          // Map/Cast DTO if needed
          setQuizData(fetchedQuiz as unknown as QuizStructureHost);
          setIsQuizDataLoading(false); // Finish loading quiz data
          // DO NOT trigger game start here, wait for user interaction via InitialHostView
        }
      })
      .catch((error: any) => {
        console.error("[HostPage] Error fetching quiz data:", error);
        if (isMounted) {
          setApiError(error.message || "Failed to load quiz data.");
          setUiState("ERROR"); // Transition to error state
          setIsQuizDataLoading(false); // Stop loading even on error
        }
      });

    return () => {
      isMounted = false;
    };
  }, [quizId]); // Depend only on quizId

  // --- Other Effects (assets, WS status, message sending, countdown, cleanup) ---
  // These remain largely unchanged from the previous version.
  useEffect(() => { /* ... Asset loading effect ... */
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
  useEffect(() => { /* ... WS Status effect ... */
    // Only update UI state based on WS connection *after* the initial state
    if (uiState === 'INITIAL' && isQuizDataLoading) return; // Don't react to WS while loading quiz

    if (wsConnectionStatus === "CONNECTING") setUiState("CONNECTING");
    else if (wsConnectionStatus === "CONNECTED") setUiState("CONNECTED");
    else if (wsConnectionStatus === "DISCONNECTED") {
      // Prevent reverting to DISCONNECTED if we are in INITIAL or ERROR already
      if (uiState !== "INITIAL" && uiState !== "ERROR") {
        setUiState("DISCONNECTED");
      }
    } else if (wsConnectionStatus === "ERROR") {
      setApiError(wsError ?? "Unknown WebSocket error.");
      setUiState("ERROR");
    }
  }, [wsConnectionStatus, wsError, uiState, isQuizDataLoading]); // Add isQuizDataLoading dependency
  useEffect(() => { /* ... Send Question/Result effect ... */
    if (!liveGameState) return;
    // Send messages only when CONNECTED state is reached (implies WS is ready)
    if (uiState !== "CONNECTED" || wsConnectionStatus !== "CONNECTED") return;

    const { status, gamePin, players, hostUserId, currentQuestionIndex } =
      liveGameState;

    // Send QUESTION
    if (status === "QUESTION_SHOW" || status === "QUESTION_GET_READY") {
      if (
        currentBlock &&
        currentBlock.questionIndex === currentQuestionIndex &&
        lastSentQuestionIndexRef.current !== currentQuestionIndex
      ) {
        const messageString = prepareQuestionMessage();
        if (messageString && gamePin) {
          const destination = `${TOPIC_PREFIX}/player/${gamePin}`;
          sendMessage(destination, messageString);
          lastSentQuestionIndexRef.current = currentQuestionIndex;
        } else {
          console.warn("Could not send question - missing message string or game pin.");
        }
      }
    }
    // Send RESULTS
    else if (status === "SHOWING_STATS") {
      if (lastSentQuestionIndexRef.current === currentQuestionIndex) {
        if (players && Object.keys(players).length > 0 && gamePin) {
          Object.keys(players).forEach((playerId) => {
            if (playerId !== hostUserId) {
              const messageString = prepareResultMessage(playerId);
              if (messageString) {
                const destination = `${TOPIC_PREFIX}/player/${gamePin}`;
                sendMessage(destination, messageString);
              } else {
                console.warn(`Could not prepare result for ${playerId}.`);
              }
            }
          });
        } else {
          console.warn("Cannot send results: No players or game pin.");
        }
        lastSentQuestionIndexRef.current = null;
      }
    }
    // Send PODIUM
    else if (status === "PODIUM") {
      console.log("TODO: Send Podium Message");
      lastSentQuestionIndexRef.current = null;
    }
    // Clear ref if returning to lobby
    else if (status === "LOBBY") {
      if (lastSentQuestionIndexRef.current !== null) {
        lastSentQuestionIndexRef.current = null;
      }
    }
  }, [
    liveGameState,
    currentBlock,
    uiState, // Depend on main UI state
    wsConnectionStatus,
    sendMessage,
    prepareQuestionMessage,
    prepareResultMessage,
  ]);
  useEffect(() => { /* ... Auto-Start Countdown effect ... */
    // (Logic remains the same)
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
            if (autoStartIntervalRef.current) clearInterval(autoStartIntervalRef.current);
            autoStartIntervalRef.current = null;
            return null;
          }
          if (prevCountdown <= 1) {
            clearInterval(autoStartIntervalRef.current!);
            autoStartIntervalRef.current = null;
            handleNext(); // Start game
            return 0;
          }
          return prevCountdown - 1;
        });
      }, 1000);
    } else if (autoStartCountdown !== null) {
      setAutoStartCountdown(null);
    }
    return () => {
      if (autoStartIntervalRef.current) clearInterval(autoStartIntervalRef.current);
    };
  }, [isAutoStartEnabled, autoStartTimeSeconds, autoStartCountdown, liveGameState?.status, handleNext]);
  useEffect(() => { /* ... WebSocket cleanup effect ... */
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);
  useEffect(() => { /* ... Fullscreen effect ... */
    const handleFullscreenChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // === Action Handlers ===
  // This is triggered by the button in InitialHostView *after* quiz data is loaded
  const handleStartGameClick = async () => {
    // Add guard: Only proceed if in INITIAL state and quiz data is loaded
    if (uiState !== 'INITIAL' || isQuizDataLoading || !quizData) {
      console.warn(`[HostPage] Start Game clicked in invalid state: uiState=${uiState}, isQuizLoading=${isQuizDataLoading}`);
      return;
    }

    console.log("[HostPage] Start Game button clicked, initiating session creation...");
    setUiState("FETCHING_PIN");
    setApiError(null);
    try {
      // Call backend to create session (remains the same)
      const response = await fetch(`${API_BASE_URL}/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await response.json();
      if (response.ok && data.gamePin) {
        setFetchedGamePin(data.gamePin);
        console.log(`[HostPage] PIN fetched: ${data.gamePin}. Connecting WebSocket...`);
        connectWebSocket(data.gamePin, (clientId) => {
          initializeSession(data.gamePin, clientId); // Initialize coordinator state
        });
        // uiState will be updated by the wsConnectionStatus effect
      } else {
        throw new Error(data.error || `Failed to create session (Status: ${response.status})`);
      }
    } catch (error: any) {
      console.error("[HostPage] Error creating session:", error);
      setApiError(error.message || "Failed to start game session.");
      setUiState('ERROR');
    }
  };


  const handleResetAndGoToInitial = () => { /* ... (same as before, ensures quizData is reset) ... */
    disconnectWebSocket();
    resetGameState();
    setApiError(null);
    setFetchedGamePin(null);
    lastSentQuestionIndexRef.current = null;
    setQuizData(null); // Reset quiz data
    setIsQuizDataLoading(true); // Reset quiz loading state
    setSelectedBackgroundId(null);
    setSelectedSoundId(null);
    setIsSettingsOpen(false);
    setIsAutoStartEnabled(false);
    setAutoStartTimeSeconds(DEFAULT_AUTO_START_SECONDS);
    setAutoStartCountdown(null);
    if (autoStartIntervalRef.current) clearInterval(autoStartIntervalRef.current);
    autoStartIntervalRef.current = null;
    setUiState("INITIAL");
    // Reload or redirect logic might be better here depending on UX
    // For now, just resets state, assuming page might reload with new quizId
    window.location.reload(); // Or router.push('/select-quiz');
  };
  const handleReconnect = () => { /* ... (same as before) ... */
    if (fetchedGamePin) {
      // Assume quizData is still loaded if reconnecting to the same pin
      connectWebSocket(fetchedGamePin, (clientId) => {
        initializeSession(fetchedGamePin, clientId);
        setIsAutoStartEnabled(false);
        setAutoStartTimeSeconds(DEFAULT_AUTO_START_SECONDS);
        setAutoStartCountdown(null);
      });
    } else {
      handleResetAndGoToInitial(); // Fallback if pin is lost
    }
  };
  // Other handlers (handleOpenSettings, sound/bg select, auto-start, fullscreen, kick) remain the same
  const handleOpenSettings = () => setIsSettingsOpen(true);
  const handleSoundSelect = (soundId: string) => { setSelectedSoundId(soundId); setIsSettingsOpen(false); };
  const handleBackgroundSelect = (backgroundId: string) => {
    setSelectedBackgroundId(backgroundId);
    setIsSettingsOpen(false);
    const currentPin = liveGameState?.gamePin ?? fetchedGamePin;
    if (currentPin && wsConnectionStatus === "CONNECTED") {
      const contentPayload = { background: { id: backgroundId } };
      const contentString = JSON.stringify(contentPayload);
      const wsMessageEnvelope = {
        channel: `${TOPIC_PREFIX}/player/${currentPin}`,
        clientId: null,
        data: { gameid: currentPin, id: 35, type: "message", host: "VuiQuiz.com", content: contentString },
        ext: { timetrack: Date.now() },
      };
      sendMessage(wsMessageEnvelope.channel, JSON.stringify([wsMessageEnvelope]));
    }
  };
  const handleAutoStartToggle = (enabled: boolean) => {
    setIsAutoStartEnabled(enabled);
    if (!enabled) {
      setAutoStartCountdown(null);
      if (autoStartIntervalRef.current) clearInterval(autoStartIntervalRef.current);
      autoStartIntervalRef.current = null;
    } else if (autoStartTimeSeconds !== null && liveGameStateRef.current?.status === 'LOBBY' && Object.keys(liveGameStateRef.current.players).length > 0) {
      setAutoStartCountdown(autoStartTimeSeconds);
    }
  };
  const handleAutoStartTimeChange = (seconds: number | null) => {
    setAutoStartTimeSeconds(seconds);
    if (isAutoStartEnabled && seconds !== null) {
      setAutoStartCountdown(seconds);
      if (autoStartIntervalRef.current) clearInterval(autoStartIntervalRef.current);
      autoStartIntervalRef.current = null; // Let useEffect handle interval start
    } else if (seconds === null) {
      setAutoStartCountdown(null);
      if (autoStartIntervalRef.current) clearInterval(autoStartIntervalRef.current);
      autoStartIntervalRef.current = null;
    }
  };
  const handleToggleFullScreen = () => {
    if (!document.fullscreenEnabled) {
      toast({ variant: "destructive", title: "Error", description: "Fullscreen not supported." }); return;
    }
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => toast({ variant: "destructive", title: "Error", description: "Could not enter fullscreen." }));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };
  const handleKickPlayer = (playerIdToKick: string) => { console.warn(`Kick player ${playerIdToKick} - Not implemented`); };


  // --- Rendering Logic ---
  const renderPageActualContent = () => {
    // Handle missing quizId before rendering content
    if (!quizId && uiState !== 'ERROR') { // Check if we aren't already in an error state from missing ID
      return <ErrorHostView errorMessage="No Quiz ID specified in URL." onRetry={() => window.location.reload()} />;
    }

    switch (uiState) {
      case "INITIAL":
        // Show InitialHostView, disable button while loading quiz data or assets
        return (
          <InitialHostView
            onStartGameClick={handleStartGameClick}
            isQuizLoading={isQuizDataLoading || assetsLoading} // Disable if either is loading
            isDisabled={isQuizDataLoading || assetsLoading || !quizData} // Ensure quizData is loaded too
          />
        );
      case "FETCHING_PIN":
        return <ConnectingHostView message="Creating Game Session..." />;
      case "CONNECTING":
        return <ConnectingHostView message={`Connecting WebSocket (Pin: ${fetchedGamePin})...`} />;
      case "ERROR":
        return <ErrorHostView errorMessage={apiError || assetsError || "An unknown error occurred."} onRetry={handleResetAndGoToInitial} />;
      case "DISCONNECTED":
        return <DisconnectedHostView onStartNewGame={handleResetAndGoToInitial} onReconnect={handleReconnect} gamePin={fetchedGamePin} />;

      case "CONNECTED":
        // Loading states for assets/coordinator initialization
        if (assetsLoading) return <ConnectingHostView message="Loading assets..." />;
        if (assetsError) return <ErrorHostView errorMessage={assetsError} onRetry={handleResetAndGoToInitial} />;
        if (!liveGameState) return <ConnectingHostView message="Initializing game state..." />;

        // Render Lobby or Game View based on coordinator state
        return (
          <>
            {liveGameState.status === "LOBBY" ? (
              <HostLobbyView
                quizTitle={quizData?.title ?? "Quiz"} // Use fetched quiz data
                gamePin={liveGameState.gamePin}
                accessUrl={"VuiQuiz.com"}
                participants={Object.values(liveGameState.players ?? {})}
                selectedBackgroundId={selectedBackgroundId}
                onStartGame={handleNext}
                onEndGame={handleResetAndGoToInitial}
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
              <HostView
                liveGameState={liveGameState}
                quizData={quizData}
                currentBlock={currentBlock}
                timerKey={timerKey}
                currentAnswerCount={currentQuestionAnswerCount}
                totalPlayers={currentTotalPlayers}
                gamePin={liveGameState.gamePin}
                accessUrl={"VuiQuiz.com"}
                onTimeUp={handleTimeUp}
                onSkip={handleSkip}
                onNext={handleNext}
                isLoading={false} // Main loading handled by state machine
                selectedSoundId={selectedSoundId}
                selectedBackgroundId={selectedBackgroundId}
                onSettingsClick={handleOpenSettings}
                isMuted={isMuted}
                onToggleMute={toggleMute}
              />
            )}

            {/* Dev Controls and Settings Dialog (remain the same) */}
            {process.env.NODE_ENV === "development" && false && (
              <DevMockControls
                simulatePlayerAnswer={(msgBody) => coordinatorRef.current?.handleWebSocketMessage(msgBody)}
                simulateHostReceiveJoin={(msgBody) => coordinatorRef.current?.handleWebSocketMessage(msgBody)}
                loadMockBlock={() => { console.warn("Loading mock block via DevControls is disabled when using real data.") }}
                setMockResult={() => { console.warn("Setting mock result via DevControls is disabled when using real data.") }}
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

      default:
        // Fallback for any unexpected state
        return <ErrorHostView errorMessage={`Invalid UI state: ${uiState}`} onRetry={handleResetAndGoToInitial} />;
    }
  };

  // Add initial check for quizId before rendering HostPageContent
  if (!quizId && uiState !== "ERROR") {
    return <ErrorHostView errorMessage="No Quiz ID specified in URL." onRetry={() => window.location.reload()} />;
  }

  return renderPageActualContent();
};


// Wrap with Suspense for useSearchParams
export default function HostPage() {
  return (
    <Suspense fallback={<ConnectingHostView message="Loading Host Page..." />}>
      <GameAssetsProvider>
        <HostPageContent />
      </GameAssetsProvider>
    </Suspense>
  );
}