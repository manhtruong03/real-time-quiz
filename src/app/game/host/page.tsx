// src/app/game/host/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2, Settings, WifiOff } from "lucide-react"; // Added Settings just in case, though likely unused here directly
import HostView from "@/src/components/game/views/HostView";
import { Button } from "@/src/components/ui/button";
import DevMockControls from "@/src/components/game/DevMockControls";
import mockQuizStructureHost from "@/src/__mocks__/api/quiz_sample_all_types";
import { QuizStructureHost } from "@/src/lib/types"; // Import Sound type
import { useHostGameCoordinator } from "@/src/hooks/useHostGameCoordinator";
import { useHostWebSocket, ConnectionStatus as WebSocketConnectionStatus } from "@/src/hooks/game/useHostWebSocket";
import { GameAssetsProvider, useGameAssets } from '@/src/context/GameAssetsContext';
import { GameSettingsDialog } from "@/src/components/game/settings/GameSettingsDialog";

// Constants
const API_BASE_URL = 'http://localhost:8080/api/session';
const TOPIC_PREFIX = '/topic'; // Keep if needed for WS message sending

// Helper component to access context within the provider scope
const HostPageContent = () => {
  // === State for UI Flow ===
  type PageUiState = 'INITIAL' | 'FETCHING_PIN' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  const [uiState, setUiState] = useState<PageUiState>('INITIAL');
  const [apiError, setApiError] = useState<string | null>(null);
  const [fetchedGamePin, setFetchedGamePin] = useState<string | null>(null);

  // === State for Initial Data Loading ===
  const [quizData, setQuizData] = useState<QuizStructureHost | null>(null);
  const [isQuizLoading, setIsQuizLoading] = useState(true);

  // === State for Settings ===
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | null>(null);
  const [selectedSoundId, setSelectedSoundId] = useState<string | null>(null);

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
    handleWebSocketMessage,
    initializeSession,
    prepareQuestionMessage,
    prepareResultMessage,
    resetGameState,
  } = useHostGameCoordinator(quizData);

  // === WebSocket Hook ===
  const {
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
    sendMessage,
    connectionStatus: wsConnectionStatus,
    error: wsError,
    hostClientId,
  } = useHostWebSocket({
    onMessageReceived: (message) => {
      handleWebSocketMessage(message.body);
    }
  });

  // === Game Assets Context Hook ===
  const { backgrounds, sounds, isLoading: assetsLoading, error: assetsError } = useGameAssets();

  // === Load Mock Quiz Data ===
  useEffect(() => {
    setIsQuizLoading(true);
    const mockData = mockQuizStructureHost as QuizStructureHost;
    setQuizData(mockData);
    setIsQuizLoading(false);
  }, []);

  // === Effect to Set Initial Background and Sound ===
  useEffect(() => {
    if (!assetsLoading && !assetsError) {
      // Set initial background if not already set
      if (selectedBackgroundId === null && backgrounds.length > 0) {
        const firstActiveBg = backgrounds.find(bg => bg.is_active);
        if (firstActiveBg) {
          console.log("[HostPage] Setting initial background:", firstActiveBg.background_id);
          setSelectedBackgroundId(firstActiveBg.background_id);
        }
      }
      // Set initial sound if not already set
      if (selectedSoundId === null && sounds.length > 0) {
        const firstActiveLobbySound = sounds.find(s => s.sound_type === 'LOBBY' && s.is_active);
        if (firstActiveLobbySound) {
          console.log("[HostPage] Setting initial lobby sound:", firstActiveLobbySound.sound_id);
          setSelectedSoundId(firstActiveLobbySound.sound_id);
        }
      }
    }
    // Run when assets load or error state changes
  }, [assetsLoading, assetsError, backgrounds, sounds, selectedBackgroundId, selectedSoundId]);

  // === Sync Page UI State with WebSocket Connection Status ===
  useEffect(() => {
    if (wsConnectionStatus === 'CONNECTING') {
      setUiState('CONNECTING'); setApiError(null);
    } else if (wsConnectionStatus === 'CONNECTED') {
      setUiState('CONNECTED'); setApiError(null);
    } else if (wsConnectionStatus === 'DISCONNECTED') {
      if (uiState !== 'INITIAL' && uiState !== 'ERROR') setUiState('DISCONNECTED');
    } else if (wsConnectionStatus === 'ERROR') {
      setApiError(wsError ?? "Unknown WebSocket error."); setUiState('ERROR');
    }
  }, [wsConnectionStatus, wsError, uiState]);

  // === API Call to Start Game ===
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
      } else {
        throw new Error(data.error || `Failed to create session (Status: ${response.status})`);
      }
    } catch (error: any) {
      console.error("HostPage: Error creating session:", error);
      setApiError(error.message || "Failed to start game."); setUiState('ERROR');
    }
  };

  // === Effect to Send Messages ===
  useEffect(() => {
    if (uiState !== 'CONNECTED' || !liveGameState) return;
    const { status, gamePin, players, hostUserId } = liveGameState;

    if (status === 'QUESTION_SHOW' || status === 'QUESTION_GET_READY') {
      const messageString = prepareQuestionMessage();
      if (messageString && gamePin) {
        sendMessage(`${TOPIC_PREFIX}/player/${gamePin}`, messageString);
      }
    } else if (status === 'QUESTION_RESULT') {
      Object.keys(players).forEach(playerId => {
        if (playerId !== hostUserId) {
          const messageString = prepareResultMessage(playerId);
          if (messageString && gamePin) {
            sendMessage(`${TOPIC_PREFIX}/player/${gamePin}`, messageString);
          }
        }
      });
    } else if (status === 'PODIUM') {
      // TODO: Implement Podium message sending if needed
      console.log("[HostPage Effect] TODO: Send Podium Message");
    }
  }, [liveGameState?.status, liveGameState?.currentQuestionIndex, uiState, sendMessage, prepareQuestionMessage, prepareResultMessage, liveGameState?.gamePin, liveGameState?.players, liveGameState?.hostUserId]);

  // === Cleanup on Unmount ===
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  // --- Action Handlers ---
  const handleResetAndGoToInitial = () => {
    disconnectWebSocket(); resetGameState(); setApiError(null); setFetchedGamePin(null); setUiState('INITIAL');
  };

  const handleOpenSettings = () => { setIsSettingsOpen(true); };

  const handleBackgroundSelect = (backgroundId: string) => {
    console.log("HostPage: Background selected:", backgroundId);
    setSelectedBackgroundId(backgroundId);
    // TODO: Send WebSocket message to players about background change
    // Example payload structure (adjust based on your websocket_message_structure.md):
    // const wsPayload = { type: 'SET_BACKGROUND', id: backgroundId };
    // const messageData = { gameid: liveGameState?.gamePin, type: 'message', id: YOUR_BACKGROUND_CHANGE_ID, content: JSON.stringify(wsPayload), host: 'VuiQuiz.com' };
    // const fullMessage = JSON.stringify([{ channel: `/service/player`, data: messageData }]);
    // if (liveGameState?.gamePin) sendMessage(`${TOPIC_PREFIX}/player/${liveGameState.gamePin}`, fullMessage);
    setIsSettingsOpen(false); // Close dialog after selection
  };

  const handleSoundSelect = (soundId: string) => {
    console.log("HostPage: Sound selected:", soundId);
    setSelectedSoundId(soundId);
    // TODO: Send WebSocket message to players about sound change
    // Similar WS message structure as background change
    setIsSettingsOpen(false); // Close dialog after selection
  };

  // --- Render Functions for UI States ---
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
      {fetchedGamePin && (
        <Button variant="outline" className="mt-2" onClick={() => connectWebSocket(fetchedGamePin, (clientId) => initializeSession(fetchedGamePin, clientId))}>
          Reconnect (Pin: {fetchedGamePin})
        </Button>
      )}
    </div>
  );

  // --- Main Return with Conditional Rendering ---
  const renderPageActualContent = () => { // Renamed from renderPageContent to avoid conflict
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
            accessUrl={"VuiQuiz.com"}
            onTimeUp={handleTimeUp}
            onSkip={handleSkip}
            onNext={handleNext}
            onSettingsClick={handleOpenSettings} // Pass the handler
            selectedBackgroundId={selectedBackgroundId} // Pass selected ID down
            selectedSoundId={selectedSoundId}      // Pass selected ID down
            isLoading={!currentBlock && liveGameState.status !== "LOBBY" && liveGameState.status !== "PODIUM" && liveGameState.status !== "ENDED"}
          />
          {/* Render DevControls only in development */}
          {process.env.NODE_ENV === 'development' && (
            <DevMockControls
              simulateReceiveMessage={(msgBody) => handleWebSocketMessage(msgBody)}
              simulatePlayerAnswer={(msgBody) => handleWebSocketMessage(msgBody)}
              simulateHostReceiveJoin={(msgBody) => handleWebSocketMessage(msgBody)}
              loadMockBlock={() => { console.warn("DevMockControls loadMockBlock ignored - use coordinator"); }}
              setMockResult={() => { console.warn("DevMockControls setMockResult ignored - use coordinator"); }}
            />
          )}
          {/* Render the Settings Dialog */}
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
    // Fallback view
    return renderConnectingView();
  };

  // Return the actual content determined above
  return renderPageActualContent();
};

// Wrap the page component with the context provider
export default function HostPage() {
  return (
    <GameAssetsProvider>
      <HostPageContent />
    </GameAssetsProvider>
  );
}