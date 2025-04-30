// src/app/game/host/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2, WifiOff } from "lucide-react";

import HostView from "@/src/components/game/views/HostView";
import { Button } from "@/src/components/ui/button";
import DevMockControls from "@/src/components/game/DevMockControls";
import mockQuizStructureHost from "@/src/__mocks__/api/quiz_sample_all_types";
import { QuizStructureHost } from "@/src/lib/types";
import { useHostGameCoordinator } from "@/src/hooks/useHostGameCoordinator";
// --- NEW Import ---
import { useHostWebSocket, ConnectionStatus as WebSocketConnectionStatus } from "@/src/hooks/game/useHostWebSocket";

// Constants
const API_BASE_URL = 'http://localhost:8080/api/session';
// --- REMOVE WebSocket Constants (managed by hook) ---
// const WEBSOCKET_URL = 'ws://localhost:8080/ws-quiz';
// const APP_PREFIX = '/app';
const TOPIC_PREFIX = '/topic';
// const USER_QUEUE_PREFIX = '/user/queue';

export default function HostPage() {
  // === State for UI Flow ===
  // Combine Page UI state with WebSocket Connection Status
  type PageUiState = 'INITIAL' | 'FETCHING_PIN' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  const [uiState, setUiState] = useState<PageUiState>('INITIAL');
  const [apiError, setApiError] = useState<string | null>(null); // For API/WS errors
  const [fetchedGamePin, setFetchedGamePin] = useState<string | null>(null);

  // === State for Initial Data Loading ===
  const [quizData, setQuizData] = useState<QuizStructureHost | null>(null);
  const [isQuizLoading, setIsQuizLoading] = useState(true);

  // === Load Mock Quiz Data ===
  useEffect(() => {
    // console.log("HostPage: Loading mock quiz structure...");
    setIsQuizLoading(true);
    const mockData = mockQuizStructureHost as QuizStructureHost;
    setQuizData(mockData);
    setIsQuizLoading(false);
    // console.log("HostPage: Mock quiz structure loaded.");
  }, []);

  // === Game Logic Coordinator Hook ===
  const {
    liveGameState,
    currentBlock,
    timerKey,
    currentQuestionAnswerCount,
    currentTotalPlayers,
    handleNext,
    handleSkip,
    handleTimeUp,
    handleWebSocketMessage, // <<< The message handler from the coordinator
    initializeSession, // <<< The session initializer from the coordinator
    prepareQuestionMessage, // <<< Function to get the message string
    prepareResultMessage,   // <<< Function to get the message string
    resetGameState, // <<< Function to reset game state
  } = useHostGameCoordinator(quizData);

  // === NEW: WebSocket Hook ===
  const {
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
    sendMessage,
    connectionStatus: wsConnectionStatus,
    error: wsError,
    hostClientId, // Get client ID from the hook
  } = useHostWebSocket({
    onMessageReceived: (message) => {
      // Pass the raw STOMP message body to the coordinator's handler
      handleWebSocketMessage(message.body);
    }
  });

  // --- Sync Page UI State with WebSocket Connection Status ---
  useEffect(() => {
    // console.log("[HostPage] WS Connection Status Changed:", wsConnectionStatus);
    if (wsConnectionStatus === 'CONNECTING') {
      setUiState('CONNECTING');
      setApiError(null); // Clear previous errors on reconnect attempt
    } else if (wsConnectionStatus === 'CONNECTED') {
      setUiState('CONNECTED');
      setApiError(null); // Clear errors on successful connection
    } else if (wsConnectionStatus === 'DISCONNECTED') {
      // Only transition to DISCONNECTED if not already in INITIAL or ERROR
      // to prevent flicker when starting fresh or after an error.
      if (uiState !== 'INITIAL' && uiState !== 'ERROR') {
        setUiState('DISCONNECTED');
      }
    } else if (wsConnectionStatus === 'ERROR') {
      setApiError(wsError ?? "Unknown WebSocket error.");
      setUiState('ERROR');
    }
  }, [wsConnectionStatus, wsError, uiState]); // Add uiState to dependencies

  // --- API Call to Start Game ---
  const handleStartGameClick = async () => {
    if (!quizData) {
      setApiError("Quiz data not ready.");
      setUiState('ERROR');
      return;
    }
    setUiState('FETCHING_PIN');
    setApiError(null);
    // console.log("HostPage: Requesting game pin...");
    try {
      const response = await fetch(`${API_BASE_URL}/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await response.json();
      if (response.ok && data.gamePin) {
        console.log("HostPage: Game pin received:", data.gamePin);
        setFetchedGamePin(data.gamePin);
        // Connect WS via hook, pass coordinator's initializeSession as callback
        connectWebSocket(data.gamePin, (clientId) => {
          console.log("HostPage: WS Connected successfully via hook callback.");
          initializeSession(data.gamePin, clientId); // Initialize coordinator state
        });
        // uiState will update via useEffect based on wsConnectionStatus
      } else {
        throw new Error(data.error || `Failed to create session (Status: ${response.status})`);
      }
    } catch (error: any) {
      console.error("HostPage: Error creating session:", error);
      setApiError(error.message || "Failed to start game.");
      setUiState('ERROR');
    }
  };

  // --- Effect to Send Messages When State Changes ---
  useEffect(() => {
    if (uiState !== 'CONNECTED' || !liveGameState) return;

    const { status, currentQuestionIndex } = liveGameState;
    // console.log(`[HostPage Effect] Status: ${status}, Index: ${currentQuestionIndex}`);

    if (status === 'QUESTION_SHOW' || status === 'QUESTION_GET_READY') {
      const messageString = prepareQuestionMessage(); // Get message string from coordinator
      if (messageString) {
        // console.log("[HostPage Effect] Sending Question Message:", messageString);
        // Assuming broadcast to players (check destination if needed)
        sendMessage(`${TOPIC_PREFIX}/player/${liveGameState.gamePin}`, messageString);
      } else {
        // console.log("[HostPage Effect] No question message to send.");
      }
    } else if (status === 'QUESTION_RESULT') {
      // Send result to each player
      Object.keys(liveGameState.players).forEach(playerId => {
        if (playerId !== liveGameState.hostUserId) { // Don't send to host
          const messageString = prepareResultMessage(playerId); // Get result message string
          if (messageString) {
            // console.log(`[HostPage Effect] Sending Result Message to ${playerId}:`, messageString);
            // Assuming results are sent to the general player topic or direct?
            // Using player topic for now, adjust if private messages are needed
            sendMessage(`${TOPIC_PREFIX}/player/${liveGameState.gamePin}`, messageString);
            // OR if targeting specific user queue:
            // sendMessage(`${USER_QUEUE_PREFIX}/${playerId}/private`, messageString);
          }
        }
      });
    } else if (status === 'PODIUM') {
      // Similar logic for podium/final results if needed
      console.log("[HostPage Effect] TODO: Send Podium Message");
      // Object.keys(liveGameState.players).forEach(playerId => { ... preparePodiumMessage ... sendMessage ... });
    }

  }, [liveGameState?.status, liveGameState?.currentQuestionIndex, uiState, sendMessage, prepareQuestionMessage, prepareResultMessage, liveGameState?.gamePin, liveGameState?.players, liveGameState?.hostUserId]);


  // --- Cleanup on Unmount ---
  // The useHostWebSocket hook handles its own cleanup.
  // We might need cleanup for the coordinator state if necessary.
  useEffect(() => {
    return () => {
      // console.log("HostPage unmounting. Disconnecting WebSocket.");
      disconnectWebSocket();
      // resetGameState(); // Optionally reset coordinator state on unmount
    };
  }, [disconnectWebSocket]); // Removed resetGameState dependency if not needed on unmount

  // --- Action Handlers (Reset Logic) ---
  const handleResetAndGoToInitial = () => {
    disconnectWebSocket(); // Disconnect WS
    resetGameState();      // Reset coordinator state
    setApiError(null);
    setFetchedGamePin(null);
    setUiState('INITIAL'); // Go back to start screen
  };

  // --- Render Functions for UI States (Simplified) ---
  const renderInitialView = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-6">Start New Quiz Game</h1>
      <p className="text-muted-foreground mb-6">Click the button below to generate a game pin and start hosting.</p>
      <Button size="lg" onClick={handleStartGameClick} disabled={isQuizLoading || uiState !== 'INITIAL'}>
        {isQuizLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {isQuizLoading ? 'Loading Quiz...' : 'Get Game Pin & Start Hosting'}
      </Button>
    </div>
  );

  const renderConnectingView = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground text-center">
        {uiState === 'FETCHING_PIN' ? 'Getting Game Pin...' :
          uiState === 'CONNECTING' ? `Connecting to WebSocket for Game Pin: ${fetchedGamePin}...` :
            'Loading...'
        }
      </p>
    </div>
  );

  const renderErrorView = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <WifiOff className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-xl font-semibold text-destructive mb-2">Failed</h2>
      <p className="text-muted-foreground mb-4">{apiError || "An unknown error occurred."}</p>
      <Button onClick={handleResetAndGoToInitial}>Try Again</Button>
    </div>
  );

  const renderDisconnectedView = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <WifiOff className="h-12 w-12 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold mb-2">Disconnected</h2>
      <p className="text-muted-foreground mb-4">The WebSocket connection was closed.</p>
      <Button onClick={handleResetAndGoToInitial}>Start New Game</Button>
      {/* Optional Reconnect Button */}
      {fetchedGamePin && (
        <Button variant="outline" className="mt-2" onClick={() => connectWebSocket(fetchedGamePin, (clientId) => initializeSession(fetchedGamePin, clientId))}>
          Reconnect (Pin: {fetchedGamePin})
        </Button>
      )}
    </div>
  );

  // --- Main Return with Conditional Rendering ---
  if (uiState === 'INITIAL') return renderInitialView();
  if (uiState === 'FETCHING_PIN' || uiState === 'CONNECTING') return renderConnectingView();
  if (uiState === 'ERROR') return renderErrorView();
  if (uiState === 'DISCONNECTED') return renderDisconnectedView();

  if (uiState === 'CONNECTED' && liveGameState) {
    return (
      <>
        <HostView
          timerKey={timerKey}
          questionData={currentBlock}
          currentAnswerCount={currentQuestionAnswerCount}
          totalPlayers={currentTotalPlayers}
          gamePin={liveGameState.gamePin}
          accessUrl={"VuiQuiz.com"} // Replace with dynamic URL if needed
          onTimeUp={handleTimeUp}
          onSkip={handleSkip}
          onNext={handleNext}
          isLoading={!currentBlock && liveGameState.status !== "LOBBY" && liveGameState.status !== "PODIUM" && liveGameState.status !== "ENDED"}
        />
        {/* Dev Controls use the coordinator's message handler */}
        <DevMockControls
          simulateReceiveMessage={(msgBody) => handleWebSocketMessage(msgBody)} // Pass body string directly
          simulatePlayerAnswer={(msgBody) => handleWebSocketMessage(msgBody)}   // Pass body string directly
          simulateHostReceiveJoin={(msgBody) => handleWebSocketMessage(msgBody)} // Pass body string directly
          // Host override props are less relevant now, handled by coordinator
          loadMockBlock={(block) => { console.warn("DevMockControls loadMockBlock ignored - use coordinator"); }}
          setMockResult={(result) => { console.warn("DevMockControls setMockResult ignored - use coordinator"); }}
        />
      </>
    );
  }

  // Fallback connecting/loading view
  return renderConnectingView();
}