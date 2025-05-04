// src/app/game/host/page.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { WifiOff } from "lucide-react";
import HostView from "@/src/components/game/views/HostView";
import DevMockControls, { MockWebSocketMessage } from "@/src/components/game/DevMockControls";
import mockQuizStructureHost from "@/src/__mocks__/api/quiz_sample_all_types";
import { QuizStructureHost, LiveGameState, LivePlayerState } from "@/src/lib/types";
import { useHostGameCoordinator } from "@/src/hooks/useHostGameCoordinator";
import { useHostWebSocket, ConnectionStatus as WebSocketConnectionStatus } from "@/src/hooks/game/useHostWebSocket";
import { GameAssetsProvider, useGameAssets } from '@/src/context/GameAssetsContext';
import { GameSettingsDialog } from "@/src/components/game/settings/GameSettingsDialog";
import { InitialHostView } from '@/src/components/game/host/InitialHostView';
import { ConnectingHostView } from '@/src/components/game/host/ConnectingHostView';
import { ErrorHostView } from '@/src/components/game/host/ErrorHostView';
import { DisconnectedHostView } from '@/src/components/game/host/DisconnectedHostView';
import { HostLobbyView } from '@/src/components/game/host/lobby/HostLobbyView';
import { useToast } from "@/src/components/ui/use-toast"; // Import useToast
import { useHostAudioManager } from '@/src/hooks/game/useHostAudioManager';

// Constants
const API_BASE_URL = 'http://localhost:8080/api/session';
const TOPIC_PREFIX = '/topic';
const DEFAULT_AUTO_START_SECONDS = 30; // Default countdown time

// Main Page Component Structure
const HostPageContent = () => {
  // --- State Variables ---
  type PageUiState = 'INITIAL' | 'FETCHING_PIN' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  const [uiState, setUiState] = useState<PageUiState>('INITIAL');
  const [apiError, setApiError] = useState<string | null>(null);
  const [fetchedGamePin, setFetchedGamePin] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<QuizStructureHost | null>(null);
  const [isQuizLoading, setIsQuizLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | null>(null);
  const [selectedSoundId, setSelectedSoundId] = useState<string | null>(null);
  const lastSentQuestionIndexRef = useRef<number | null>(null);

  // --- NEW: Auto-Start State ---
  const [isAutoStartEnabled, setIsAutoStartEnabled] = useState(false);
  const [autoStartTimeSeconds, setAutoStartTimeSeconds] = useState<number | null>(DEFAULT_AUTO_START_SECONDS);
  const [autoStartCountdown, setAutoStartCountdown] = useState<number | null>(null);
  const autoStartIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // --- NEW: UI State ---
  const [isFullScreen, setIsFullScreen] = useState(false);
  // Note: isMuted state is now managed by useHostAudioManager
  const { toast } = useToast(); // For feedback

  // --- Hooks ---

  const { backgrounds, sounds, isLoading: assetsLoading, error: assetsError } = useGameAssets();

  // Instantiate Audio Manager HERE
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
        console.warn("[HostPage] Coordinator ref not ready for message handling.");
      }
    }
  });

  const handlePlayerJoined = useCallback((joiningPlayerCid: string) => {
    // ... (keep existing handlePlayerJoined logic) ...
    const currentSelectedBgId = selectedBackgroundId;
    const currentPin = liveGameStateRef.current?.gamePin ?? fetchedGamePin;

    if (currentSelectedBgId && currentPin && wsConnectionStatus === 'CONNECTED') {
      // Prepare the targeted background message payload
      const contentPayload = { background: { id: currentSelectedBgId } };
      const contentString = JSON.stringify(contentPayload);
      const wsMessageEnvelope = {
        channel: `${TOPIC_PREFIX}/player/${currentPin}`,
        clientId: null,
        data: { gameid: currentPin, id: 35, type: "message", host: "VuiQuiz.com", content: contentString, cid: joiningPlayerCid },
        ext: { timetrack: Date.now() },
      };
      const messageToSend = JSON.stringify([wsMessageEnvelope]);
      sendMessage(wsMessageEnvelope.channel, messageToSend);
    } else {
      console.warn("[HostPage] Cannot send background sync to new player.", { currentSelectedBgId, currentPin, wsConnectionStatus });
    }

    // --- Auto-Start Logic on Player Join ---
    // Start countdown if auto-start is enabled, a time is set, and at least one player is present
    if (isAutoStartEnabled &&
      autoStartTimeSeconds !== null &&
      liveGameStateRef.current &&
      Object.keys(liveGameStateRef.current.players).length > 0 && // Check if *anyone* is in (including the new one)
      autoStartCountdown === null && // Only start if not already counting
      autoStartIntervalRef.current === null
    ) {
      console.log(`[AutoStart] First player joined with auto-start enabled (${autoStartTimeSeconds}s). Starting countdown.`);
      setAutoStartCountdown(autoStartTimeSeconds);
    }
    // --- End Auto-Start Logic ---

  }, [selectedBackgroundId, wsConnectionStatus, fetchedGamePin, sendMessage, isAutoStartEnabled, autoStartTimeSeconds, autoStartCountdown]); // Add auto-start deps


  const coordinator = useHostGameCoordinator({
    initialQuizData: quizData,
    onPlayerJoined: handlePlayerJoined,
  });
  const coordinatorRef = useRef(coordinator);
  useEffect(() => {
    coordinatorRef.current = coordinator;
  }, [coordinator]);

  const {
    liveGameState, currentBlock, timerKey, currentQuestionAnswerCount, currentTotalPlayers,
    handleNext, handleSkip, handleTimeUp,
    initializeSession, prepareQuestionMessage, prepareResultMessage, resetGameState,
  } = coordinator;

  useEffect(() => {
    liveGameStateRef.current = liveGameState;
  }, [liveGameState]);

  // Effect to load initial quiz data
  useEffect(() => {
    setIsQuizLoading(true);
    const mockData = mockQuizStructureHost as QuizStructureHost;
    setQuizData(mockData);
    setIsQuizLoading(false);
  }, []);

  // Effect to set initial background/sound
  useEffect(() => {
    if (!assetsLoading && !assetsError) {
      if (selectedBackgroundId === null && backgrounds.length > 0) {
        const firstActiveBg = backgrounds.find(bg => bg.is_active);
        if (firstActiveBg) setSelectedBackgroundId(firstActiveBg.background_id);
      }
      if (selectedSoundId === null && sounds.length > 0) {
        const firstActiveLobbySound = sounds.find(s => s.sound_type === 'LOBBY' && s.is_active);
        if (firstActiveLobbySound) setSelectedSoundId(firstActiveLobbySound.sound_id);
      }
    }
  }, [assetsLoading, assetsError, backgrounds, sounds, selectedBackgroundId, selectedSoundId]);

  // Effect to sync Page UI state with WebSocket connection status
  useEffect(() => {
    // ... (keep existing effect logic) ...
    if (wsConnectionStatus === 'CONNECTING') { setUiState('CONNECTING'); setApiError(null); }
    else if (wsConnectionStatus === 'CONNECTED') { setUiState('CONNECTED'); setApiError(null); }
    else if (wsConnectionStatus === 'DISCONNECTED') { if (uiState !== 'INITIAL' && uiState !== 'ERROR') setUiState('DISCONNECTED'); }
    else if (wsConnectionStatus === 'ERROR') { setApiError(wsError ?? "Unknown WebSocket error."); setUiState('ERROR'); }
  }, [wsConnectionStatus, wsError, uiState]);

  // Effect for sending Question/Result messages
  useEffect(() => {
    // ... (keep existing effect logic) ...
    if (!liveGameState) { return; }
    if (uiState !== 'CONNECTED') { return; }
    const { status, gamePin, players, hostUserId, currentQuestionIndex } = liveGameState;

    // --- Send QUESTION ---
    if ((status === 'QUESTION_SHOW' || status === 'QUESTION_GET_READY')) {
      if (currentBlock && currentBlock.questionIndex === currentQuestionIndex && lastSentQuestionIndexRef.current !== currentQuestionIndex) {
        const messageString = prepareQuestionMessage();
        if (messageString && gamePin) {
          const destination = `${TOPIC_PREFIX}/player/${gamePin}`;
          sendMessage(destination, messageString);
          lastSentQuestionIndexRef.current = currentQuestionIndex;
        } else { console.warn("[HostPage Effect] Could not send question - missing message string or game pin."); }
      }
    }
    // --- Send RESULTS ---
    else if (status === 'QUESTION_RESULT') {
      if (lastSentQuestionIndexRef.current === currentQuestionIndex) {
        lastSentQuestionIndexRef.current = null;
      }
      if (players && Object.keys(players).length > 0 && gamePin) {
        Object.keys(players).forEach(playerId => {
          if (playerId !== hostUserId) {
            const messageString = prepareResultMessage(playerId);
            if (messageString) {
              const destination = `${TOPIC_PREFIX}/player/${gamePin}`;
              sendMessage(destination, messageString);
            } else { console.warn(`[HostPage Effect] Could not prepare result for ${playerId}.`); }
          }
        });
      } else { console.warn("[HostPage Effect] Cannot send results: No players found or no game pin."); }
    }
    // --- Send PODIUM ---
    else if (status === 'PODIUM') {
      console.log("[HostPage Effect] TODO: Send Podium Message");
      lastSentQuestionIndexRef.current = null;
    }
    // Clear ref if returning to lobby
    else if (status === 'LOBBY') {
      if (lastSentQuestionIndexRef.current !== null) {
        lastSentQuestionIndexRef.current = null;
      }
    }
  }, [
    liveGameState?.status, liveGameState?.currentQuestionIndex, currentBlock,
    liveGameState?.gamePin, uiState, sendMessage, prepareQuestionMessage,
    prepareResultMessage, liveGameState?.hostUserId
  ]);

  // --- NEW: Auto-Start Countdown Effect ---
  useEffect(() => {
    // Clear any existing interval if dependencies change
    if (autoStartIntervalRef.current) {
      clearInterval(autoStartIntervalRef.current);
      autoStartIntervalRef.current = null;
    }

    // Start new interval ONLY if:
    // 1. Auto-start is enabled
    // 2. A countdown duration is set
    // 3. A countdown is currently active (autoStartCountdown is a number)
    // 4. We are actually in the LOBBY state
    if (
      isAutoStartEnabled &&
      autoStartTimeSeconds !== null &&
      typeof autoStartCountdown === 'number' &&
      liveGameState?.status === 'LOBBY'
    ) {
      console.log(`[AutoStart] Interval started. Countdown: ${autoStartCountdown}`);
      autoStartIntervalRef.current = setInterval(() => {
        setAutoStartCountdown((prevCountdown) => {
          if (prevCountdown === null) { // Should not happen based on entry condition, but safe check
            if (autoStartIntervalRef.current) clearInterval(autoStartIntervalRef.current);
            autoStartIntervalRef.current = null;
            return null;
          }
          if (prevCountdown <= 1) {
            clearInterval(autoStartIntervalRef.current!);
            autoStartIntervalRef.current = null;
            console.log("[AutoStart] Countdown finished, starting game...");
            handleNext(); // Trigger game start using the existing coordinator function
            return 0; // Show 0 briefly
          }
          return prevCountdown - 1;
        });
      }, 1000); // Update every second
    } else if (autoStartCountdown !== null) {
      // If conditions are no longer met (e.g., auto-start disabled), reset countdown display
      console.log("[AutoStart] Conditions no longer met, resetting countdown display.");
      setAutoStartCountdown(null);
    }

    // Cleanup function
    return () => {
      if (autoStartIntervalRef.current) {
        // console.log("[AutoStart] Cleaning up interval.");
        clearInterval(autoStartIntervalRef.current);
        autoStartIntervalRef.current = null;
      }
    };
  }, [isAutoStartEnabled, autoStartTimeSeconds, autoStartCountdown, liveGameState?.status, handleNext]); // Add handleNext dependency
  // --- End Auto-Start Countdown Effect ---


  // Effect for WebSocket cleanup on unmount
  useEffect(() => {
    return () => { disconnectWebSocket(); };
  }, [disconnectWebSocket]);

  // --- NEW: Fullscreen Effect ---
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // === Action Handlers ===

  const handleStartGameClick = async () => {
    if (!quizData) { setApiError("Quiz data not ready."); setUiState('ERROR'); return; }
    setUiState('FETCHING_PIN'); setApiError(null);
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
    disconnectWebSocket();
    resetGameState();
    setApiError(null);
    setFetchedGamePin(null);
    lastSentQuestionIndexRef.current = null;
    setSelectedBackgroundId(null);
    setSelectedSoundId(null);
    setIsSettingsOpen(false);
    // Reset auto-start state
    setIsAutoStartEnabled(false);
    setAutoStartTimeSeconds(DEFAULT_AUTO_START_SECONDS);
    setAutoStartCountdown(null);
    if (autoStartIntervalRef.current) clearInterval(autoStartIntervalRef.current);
    autoStartIntervalRef.current = null;
    // --- End Reset ---
    setUiState('INITIAL');
  };

  const handleReconnect = () => {
    if (fetchedGamePin) {
      connectWebSocket(fetchedGamePin, (clientId) => {
        initializeSession(fetchedGamePin, clientId);
        // Re-apply auto-start if it was enabled? Or require manual toggle?
        // Let's reset it on reconnect for simplicity for now.
        setIsAutoStartEnabled(false);
        setAutoStartTimeSeconds(DEFAULT_AUTO_START_SECONDS);
        setAutoStartCountdown(null);
      });
    } else {
      handleResetAndGoToInitial();
    }
  };

  const handleOpenSettings = () => {
    console.log("[HostPageContent] handleOpenSettings triggered!"); // <-- ADD LOG
    setIsSettingsOpen(true);
  };

  const handleSoundSelect = (soundId: string) => { setSelectedSoundId(soundId); setIsSettingsOpen(false); };
  const handleBackgroundSelect = (backgroundId: string) => {
    // ... (keep existing background select logic) ...
    setSelectedBackgroundId(backgroundId);
    setIsSettingsOpen(false);
    const currentPin = liveGameState?.gamePin ?? fetchedGamePin;
    if (currentPin && wsConnectionStatus === 'CONNECTED') {
      const contentPayload = { background: { id: backgroundId } };
      const contentString = JSON.stringify(contentPayload);
      const wsMessageEnvelope = {
        channel: `${TOPIC_PREFIX}/player/${currentPin}`,
        clientId: null,
        data: { gameid: currentPin, id: 35, type: "message", host: "VuiQuiz.com", content: contentString },
        ext: { timetrack: Date.now() },
      };
      const messageToSend = JSON.stringify([wsMessageEnvelope]);
      sendMessage(wsMessageEnvelope.channel, messageToSend);
    } else {
      console.warn("[HostPage] Cannot broadcast background update - not connected or no game pin.");
    }
  };

  // --- NEW: Auto-Start Handlers ---
  const handleAutoStartToggle = (enabled: boolean) => {
    console.log("[AutoStart] Toggled:", enabled);
    setIsAutoStartEnabled(enabled);
    if (enabled) {
      // If enabling and a time is set, start countdown (if players exist)
      if (autoStartTimeSeconds !== null &&
        liveGameStateRef.current &&
        Object.keys(liveGameStateRef.current.players).length > 0 &&
        autoStartCountdown === null && // Only start if not already counting
        autoStartIntervalRef.current === null
      ) {
        console.log(`[AutoStart] Countdown starting on toggle (${autoStartTimeSeconds}s).`);
        setAutoStartCountdown(autoStartTimeSeconds);
      } else if (autoStartTimeSeconds === null) {
        // If enabling but no time selected, maybe default it?
        setAutoStartTimeSeconds(DEFAULT_AUTO_START_SECONDS);
        // Countdown will start if players join or already exist
      }
    } else {
      // If disabling, clear countdown
      console.log("[AutoStart] Countdown cleared on toggle.");
      setAutoStartCountdown(null);
      if (autoStartIntervalRef.current) {
        clearInterval(autoStartIntervalRef.current);
        autoStartIntervalRef.current = null;
      }
    }
  };

  const handleAutoStartTimeChange = (seconds: number | null) => {
    console.log("[AutoStart] Time changed to:", seconds);
    setAutoStartTimeSeconds(seconds);
    // If auto-start is already enabled and a new valid time is set, reset/restart countdown
    if (isAutoStartEnabled && seconds !== null) {
      console.log("[AutoStart] Restarting countdown with new time:", seconds);
      setAutoStartCountdown(seconds); // This will trigger the useEffect to restart interval
    } else if (seconds === null) {
      // If time is cleared while enabled, stop countdown
      setAutoStartCountdown(null);
      if (autoStartIntervalRef.current) {
        clearInterval(autoStartIntervalRef.current);
        autoStartIntervalRef.current = null;
      }
    }
  };
  // --- End Auto-Start Handlers ---

  // --- NEW: Fullscreen Handler ---
  const handleToggleFullScreen = () => {
    if (!document.fullscreenEnabled) {
      console.warn("Fullscreen not supported by this browser.");
      toast({ variant: "destructive", title: "Error", description: "Fullscreen is not supported." });
      return;
    }
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        toast({ variant: "destructive", title: "Error", description: "Could not enter fullscreen." });
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    // State is updated via the event listener in useEffect
  };

  // --- NEW: Kick Player Handler ---
  const handleKickPlayer = (playerIdToKick: string) => {

  };
  // --- End Kick Player Handler ---

  // --- Rendering Logic ---
  const renderPageActualContent = () => {
    switch (uiState) {
      // ... (cases INITIAL, FETCHING_PIN, CONNECTING, ERROR, DISCONNECTED remain the same) ...
      case 'INITIAL': return <InitialHostView onStartGameClick={handleStartGameClick} isQuizLoading={isQuizLoading || assetsLoading} isDisabled={uiState !== 'INITIAL'} />;
      case 'FETCHING_PIN': return <ConnectingHostView message="Getting Game Pin..." />;
      case 'CONNECTING': return <ConnectingHostView message={`Connecting to WebSocket for Game Pin: ${fetchedGamePin}...`} />;
      case 'ERROR': return <ErrorHostView errorMessage={apiError || assetsError} onRetry={handleResetAndGoToInitial} />;
      case 'DISCONNECTED': return <DisconnectedHostView onStartNewGame={handleResetAndGoToInitial} onReconnect={handleReconnect} gamePin={fetchedGamePin} />;

      case 'CONNECTED':
        if (assetsLoading) return <ConnectingHostView message="Loading assets..." />;
        if (assetsError) return <ErrorHostView errorMessage={assetsError} onRetry={handleResetAndGoToInitial} />;

        // --- RENDER DIALOG OUTSIDE THE IF/ELSE ---
        // Ensure the dialog is always available to be opened when connected
        const renderDialog = () => (
          <GameSettingsDialog
            open={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
            selectedBackgroundId={selectedBackgroundId}
            onBackgroundSelect={handleBackgroundSelect}
            selectedSoundId={selectedSoundId}
            onSoundSelect={handleSoundSelect} // [cite: 2385]
          />
        );
        // --- END DIALOG RENDER ---

        if (liveGameState) {
          if (liveGameState.status === 'LOBBY') {
            const participantsArray = Object.values(liveGameState.players ?? {});
            return (
              <>
                <HostLobbyView
                  quizTitle={quizData?.title ?? 'Quiz'}
                  gamePin={liveGameState.gamePin}
                  accessUrl={"VuiQuiz.com"}
                  participants={participantsArray}
                  selectedBackgroundId={selectedBackgroundId}
                  onStartGame={handleNext}
                  onEndGame={handleResetAndGoToInitial}
                  onKickPlayer={handleKickPlayer}
                  isAutoStartEnabled={isAutoStartEnabled}
                  onAutoStartToggle={handleAutoStartToggle}
                  autoStartTimeSeconds={autoStartTimeSeconds}
                  onAutoStartTimeChange={handleAutoStartTimeChange}
                  autoStartCountdown={autoStartCountdown}
                  // Pass the settings handler
                  onSettingsClick={handleOpenSettings}
                  // Mute/Fullscreen now passed from HostPage state
                  isMuted={isMuted}
                  onToggleMute={toggleMute}
                  isFullScreen={isFullScreen}
                  onToggleFullScreen={handleToggleFullScreen}
                // NOTE: Removed isMuted/onToggleMute as they are handled by settings dialog now
                />
                {renderDialog()}
              </>
            );
          }

          // --- Existing logic for other game states ---
          const shouldBeShowingQuestionOrResult =
            liveGameState.status === 'QUESTION_GET_READY' ||
            liveGameState.status === 'QUESTION_SHOW' ||
            liveGameState.status === 'QUESTION_RESULT';
          const showLoadingOverlay = shouldBeShowingQuestionOrResult && !currentBlock;

          return (
            <>
              <HostView
                // ... other props
                timerKey={timerKey}
                questionData={currentBlock}
                currentAnswerCount={currentQuestionAnswerCount}
                totalPlayers={currentTotalPlayers}
                gamePin={liveGameState.gamePin}
                accessUrl={"VuiQuiz.com"}
                onTimeUp={handleTimeUp}
                onSkip={handleSkip}
                onNext={handleNext}
                onSettingsClick={handleOpenSettings}
                selectedBackgroundId={selectedBackgroundId}
                selectedSoundId={selectedSoundId}
                isMuted={isMuted}
                onToggleMute={toggleMute}
                isLoading={showLoadingOverlay}
              />
              {process.env.NODE_ENV === 'development' && (
                <DevMockControls
                  simulatePlayerAnswer={(msgBody) => coordinatorRef.current?.handleWebSocketMessage(msgBody)}
                  simulateHostReceiveJoin={(msgBody) => coordinatorRef.current?.handleWebSocketMessage(msgBody)}
                  loadMockBlock={() => { /* ... */ }}
                  setMockResult={() => { /* ... */ }}
                />
              )}
              <GameSettingsDialog
                // ... other props
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                selectedBackgroundId={selectedBackgroundId}
                onBackgroundSelect={handleBackgroundSelect}
                selectedSoundId={selectedSoundId}
                onSoundSelect={handleSoundSelect}
              />
              {/* {renderDialog()} */}
            </>
          );
        }
        return <>
          <ConnectingHostView message="Initializing game state..." />;
          {renderDialog()}
        </>
      default:
        return <ErrorHostView errorMessage="Invalid UI state." onRetry={handleResetAndGoToInitial} />;
    }
  };

  return renderPageActualContent();
};

// --- Default Export with Provider ---
export default function HostPage() {
  return (
    <GameAssetsProvider>
      <HostPageContent />
    </GameAssetsProvider>
  );
}