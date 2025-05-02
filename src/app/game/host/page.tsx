// src/app/game/host/page.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { WifiOff } from "lucide-react";
import HostView from "@/src/components/game/views/HostView";
import DevMockControls, { MockWebSocketMessage } from "@/src/components/game/DevMockControls"; // Keep for Dev Mode
import mockQuizStructureHost from "@/src/__mocks__/api/quiz_sample_all_types";
import { QuizStructureHost, LiveGameState } from "@/src/lib/types"; // Added LiveGameState
import { useHostGameCoordinator } from "@/src/hooks/useHostGameCoordinator";
import { useHostWebSocket, ConnectionStatus as WebSocketConnectionStatus } from "@/src/hooks/game/useHostWebSocket";
import { GameAssetsProvider, useGameAssets } from '@/src/context/GameAssetsContext';
import { GameSettingsDialog } from "@/src/components/game/settings/GameSettingsDialog";
import { InitialHostView } from '@/src/components/game/host/InitialHostView';
import { ConnectingHostView } from '@/src/components/game/host/ConnectingHostView';
import { ErrorHostView } from '@/src/components/game/host/ErrorHostView';
import { DisconnectedHostView } from '@/src/components/game/host/DisconnectedHostView';

// Constants
const API_BASE_URL = 'http://localhost:8080/api/session';
const TOPIC_PREFIX = '/topic'; // Ensure this matches your WebSocket configuration

// Main Page Component Structure
const HostPageContent = () => {
  // --- State Variables ---
  type PageUiState = 'INITIAL' | 'FETCHING_PIN' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  const [uiState, setUiState] = useState<PageUiState>('INITIAL');
  const [apiError, setApiError] = useState<string | null>(null);
  const [fetchedGamePin, setFetchedGamePin] = useState<string | null>(null); // Store pin from API
  const [quizData, setQuizData] = useState<QuizStructureHost | null>(null);
  const [isQuizLoading, setIsQuizLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | null>(null);
  const [selectedSoundId, setSelectedSoundId] = useState<string | null>(null);
  const lastSentQuestionIndexRef = useRef<number | null>(null); // Track sent questions

  // --- Asset Loading Hook ---
  const { backgrounds, sounds, isLoading: assetsLoading, error: assetsError } = useGameAssets();

  // --- Ref for live game state (needed for callbacks) ---
  const liveGameStateRef = useRef<LiveGameState | null>(null);


  // --- WebSocket Hook ---
  // We need sendMessage to be available for join/settings handlers
  const {
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
    sendMessage, // Get sendMessage function
    connectionStatus: wsConnectionStatus,
    error: wsError,
    hostClientId,
  } = useHostWebSocket({
    // onMessageReceived will be handled by the coordinator's function
    // This ensures incoming messages are processed correctly by the game logic hooks
    onMessageReceived: (message) => {
      // Use the coordinator's message handler via ref to avoid stale closures
      if (coordinatorRef.current?.handleWebSocketMessage) {
        coordinatorRef.current.handleWebSocketMessage(message.body);
      } else {
        console.warn("[HostPage] Coordinator ref not ready for message handling.");
      }
    }
  });

  // --- Handler for Player Join Notification (from Coordinator) ---
  const handlePlayerJoined = useCallback((joiningPlayerCid: string) => {
    console.log(`[HostPage] handlePlayerJoined called for CID: ${joiningPlayerCid}`);
    // Check if we have a background selected and are connected
    const currentSelectedBgId = selectedBackgroundId; // Use state value directly
    const currentPin = liveGameStateRef.current?.gamePin ?? fetchedGamePin; // Get current pin from ref or state

    if (currentSelectedBgId && currentPin && wsConnectionStatus === 'CONNECTED') {
      console.log(`[HostPage] Sending background ${currentSelectedBgId} to new player ${joiningPlayerCid}`);
      // Prepare the targeted background message payload
      const contentPayload = { background: { id: currentSelectedBgId } };
      const contentString = JSON.stringify(contentPayload);

      const wsMessageEnvelope = {
        channel: `${TOPIC_PREFIX}/player/${currentPin}`, // Send to player topic (server routes based on data.cid)
        clientId: null, // Host is sending
        data: {
          gameid: currentPin,
          id: 35, // Background Change ID
          type: "message",
          host: "VuiQuiz.com",
          content: contentString,
          cid: joiningPlayerCid, // <<< Target the specific joining player
        },
        ext: { timetrack: Date.now() },
      };
      const messageToSend = JSON.stringify([wsMessageEnvelope]);

      // Use the sendMessage function obtained from useHostWebSocket
      sendMessage(wsMessageEnvelope.channel, messageToSend);
    } else {
      console.warn("[HostPage] Cannot send background sync to new player.", { currentSelectedBgId, currentPin, wsConnectionStatus });
    }
  }, [selectedBackgroundId, wsConnectionStatus, fetchedGamePin, sendMessage]); // Dependencies


  // --- Game Coordinator Hook ---
  // Pass the onPlayerJoined handler here
  const coordinator = useHostGameCoordinator({ // Assign to variable
    initialQuizData: quizData,
    onPlayerJoined: handlePlayerJoined, // Pass the callback
  });

  // Use a ref to hold the coordinator instance to ensure the WS callback uses the latest version
  const coordinatorRef = useRef(coordinator);
  useEffect(() => {
    coordinatorRef.current = coordinator;
  }, [coordinator]);

  // Destructure properties AFTER coordinator is initialized
  const {
    liveGameState, currentBlock, timerKey, currentQuestionAnswerCount, currentTotalPlayers,
    handleNext, handleSkip, handleTimeUp,
    // handleWebSocketMessage is now internal to coordinator, exposed via ref if needed but used via WS hook setup
    initializeSession, prepareQuestionMessage, prepareResultMessage, resetGameState,
  } = coordinator;


  // Update the liveGameStateRef whenever liveGameState changes
  useEffect(() => {
    liveGameStateRef.current = liveGameState;
  }, [liveGameState]);


  // --- Effects ---

  // Effect to load initial quiz data (keep as is)
  useEffect(() => {
    setIsQuizLoading(true);
    const mockData = mockQuizStructureHost as QuizStructureHost;
    setQuizData(mockData);
    setIsQuizLoading(false);
  }, []);

  // Effect to set initial background/sound based on loaded assets (keep as is)
  useEffect(() => {
    if (!assetsLoading && !assetsError) {
      if (selectedBackgroundId === null && backgrounds.length > 0) {
        const firstActiveBg = backgrounds.find(bg => bg.is_active);
        if (firstActiveBg) {
          console.log("[HostPage] Setting initial background:", firstActiveBg.background_id);
          setSelectedBackgroundId(firstActiveBg.background_id);
        }
      }
      if (selectedSoundId === null && sounds.length > 0) {
        const firstActiveLobbySound = sounds.find(s => s.sound_type === 'LOBBY' && s.is_active);
        if (firstActiveLobbySound) {
          console.log("[HostPage] Setting initial lobby sound:", firstActiveLobbySound.sound_id);
          setSelectedSoundId(firstActiveLobbySound.sound_id);
        }
      }
    }
  }, [assetsLoading, assetsError, backgrounds, sounds, selectedBackgroundId, selectedSoundId]);

  // Effect to sync Page UI state with WebSocket connection status (keep as is)
  useEffect(() => {
    if (wsConnectionStatus === 'CONNECTING') { setUiState('CONNECTING'); setApiError(null); }
    else if (wsConnectionStatus === 'CONNECTED') { setUiState('CONNECTED'); setApiError(null); }
    else if (wsConnectionStatus === 'DISCONNECTED') { if (uiState !== 'INITIAL' && uiState !== 'ERROR') setUiState('DISCONNECTED'); }
    else if (wsConnectionStatus === 'ERROR') { setApiError(wsError ?? "Unknown WebSocket error."); setUiState('ERROR'); }
  }, [wsConnectionStatus, wsError, uiState]);

  // Effect for sending Question/Result messages (keep as is, relies on coordinator logic)
  useEffect(() => {
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
        } else { console.warn("[HostPage Effect] Could not send question - missing message string or game pin.", { hasMessage: !!messageString, hasPin: !!gamePin }); }
      }
      // ... other checks ...
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
    // ... other statuses ...
  }, [
    liveGameState?.status, liveGameState?.currentQuestionIndex, currentBlock,
    liveGameState?.gamePin, uiState, sendMessage, prepareQuestionMessage,
    prepareResultMessage, liveGameState?.hostUserId
  ]);

  // Effect for WebSocket cleanup on unmount (keep as is)
  useEffect(() => {
    return () => { disconnectWebSocket(); };
  }, [disconnectWebSocket]);

  // === Action Handlers ===

  // Start Game: Fetch PIN, Connect WS, Initialize Coordinator State
  const handleStartGameClick = async () => {
    if (!quizData) { setApiError("Quiz data not ready."); setUiState('ERROR'); return; }
    setUiState('FETCHING_PIN'); setApiError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await response.json();
      if (response.ok && data.gamePin) {
        setFetchedGamePin(data.gamePin);
        // Connect WS, then initialize coordinator state on success
        connectWebSocket(data.gamePin, (clientId) => {
          initializeSession(data.gamePin, clientId); // Pass PIN and host ID to coordinator
        });
      } else { throw new Error(data.error || `Failed to create session (Status: ${response.status})`); }
    } catch (error: any) {
      console.error("HostPage: Error creating session:", error);
      setApiError(error.message || "Failed to start game."); setUiState('ERROR');
    }
  };

  // Reset UI and Game State
  const handleResetAndGoToInitial = () => {
    disconnectWebSocket();
    resetGameState(); // Resets coordinator state
    setApiError(null);
    setFetchedGamePin(null);
    lastSentQuestionIndexRef.current = null;
    setSelectedBackgroundId(null); // Also reset selected background
    setSelectedSoundId(null);      // Also reset selected sound
    setIsSettingsOpen(false);
    setUiState('INITIAL');
  };

  // Attempt Reconnect
  const handleReconnect = () => {
    if (fetchedGamePin) {
      // Reconnect WS, then re-initialize coordinator state on success
      connectWebSocket(fetchedGamePin, (clientId) => {
        initializeSession(fetchedGamePin, clientId);
      });
    } else {
      handleResetAndGoToInitial(); // Fallback if pin lost
    }
  };

  // Open Settings Dialog
  const handleOpenSettings = () => { setIsSettingsOpen(true); };

  // Handle Sound Selection (Closes dialog)
  const handleSoundSelect = (soundId: string) => {
    setSelectedSoundId(soundId);
    setIsSettingsOpen(false);
  };

  // Handle Background Selection (Updates state, closes dialog, BROADCASTS change)
  const handleBackgroundSelect = (backgroundId: string) => {
    console.log("[HostPage] Background selected via Settings:", backgroundId);
    setSelectedBackgroundId(backgroundId); // Update local state for host view
    setIsSettingsOpen(false); // Close the dialog

    const currentPin = liveGameState?.gamePin ?? fetchedGamePin; // Use live state pin if available

    // Check if we can send the broadcast message
    if (currentPin && wsConnectionStatus === 'CONNECTED') {
      const contentPayload = { background: { id: backgroundId } };
      const contentString = JSON.stringify(contentPayload);
      const wsMessageEnvelope = {
        channel: `${TOPIC_PREFIX}/player/${currentPin}`,
        clientId: null,
        data: {
          gameid: currentPin,
          id: 35, // Background Change ID
          type: "message",
          host: "VuiQuiz.com",
          content: contentString,
          // No 'cid' for broadcast
        },
        ext: { timetrack: Date.now() },
      };
      const messageToSend = JSON.stringify([wsMessageEnvelope]);
      console.log(`[HostPage] BROADCASTING background update to ${wsMessageEnvelope.channel}:`, messageToSend);
      sendMessage(wsMessageEnvelope.channel, messageToSend); // Broadcast
    } else {
      console.warn("[HostPage] Cannot broadcast background update - not connected or no game pin.", { currentPin, wsStatus: wsConnectionStatus });
    }
  };


  // --- Rendering Logic ---
  const renderPageActualContent = () => {
    switch (uiState) {
      case 'INITIAL':
        return <InitialHostView onStartGameClick={handleStartGameClick} isQuizLoading={isQuizLoading || assetsLoading} isDisabled={uiState !== 'INITIAL'} />;
      case 'FETCHING_PIN':
        return <ConnectingHostView message="Getting Game Pin..." />;
      case 'CONNECTING':
        return <ConnectingHostView message={`Connecting to WebSocket for Game Pin: ${fetchedGamePin}...`} />;
      case 'ERROR':
        return <ErrorHostView errorMessage={apiError || assetsError} onRetry={handleResetAndGoToInitial} />; // Show asset error too
      case 'DISCONNECTED':
        return <DisconnectedHostView onStartNewGame={handleResetAndGoToInitial} onReconnect={handleReconnect} gamePin={fetchedGamePin} />;
      case 'CONNECTED':
        if (assetsLoading) return <ConnectingHostView message="Loading assets..." />; // Show asset loading state
        if (assetsError) return <ErrorHostView errorMessage={assetsError} onRetry={handleResetAndGoToInitial} />; // Show asset error state
        if (liveGameState) { // Ensure game state is initialized after connection and asset load
          return (
            <>
              <HostView
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
                // Show loading overlay within HostView if block isn't ready for current phase
                isLoading={!currentBlock && liveGameState.status !== "LOBBY" && liveGameState.status !== "PODIUM" && liveGameState.status !== "ENDED"}
              />
              {process.env.NODE_ENV === 'development' && (
                <DevMockControls
                  // Pass the coordinator's handler for simulation purposes if needed
                  // simulateReceiveMessage={(msgBody) => coordinatorRef.current?.handleWebSocketMessage(msgBody)} // Example
                  simulatePlayerAnswer={(msgBody) => coordinatorRef.current?.handleWebSocketMessage(msgBody)}
                  simulateHostReceiveJoin={(msgBody) => coordinatorRef.current?.handleWebSocketMessage(msgBody)}
                  loadMockBlock={() => { console.warn("DevMockControls loadMockBlock ignored - use coordinator"); }}
                  setMockResult={() => { console.warn("DevMockControls setMockResult ignored - use coordinator"); }}
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
        }
        // Fallback if connected but gameState is somehow null after assets load
        return <ConnectingHostView message="Initializing game state..." />;
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