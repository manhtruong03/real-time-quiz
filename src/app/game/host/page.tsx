// src/app/game/host/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { WifiOff } from "lucide-react"; // Keep WifiOff for Error/Disconnected views
import HostView from "@/src/components/game/views/HostView"; // Keep main HostView
import DevMockControls from "@/src/components/game/DevMockControls";
import mockQuizStructureHost from "@/src/__mocks__/api/quiz_sample_all_types";
// Adjust type import if paths changed
import { QuizStructureHost } from "@/src/lib/types";
import { useHostGameCoordinator } from "@/src/hooks/useHostGameCoordinator";
import { useHostWebSocket, ConnectionStatus as WebSocketConnectionStatus } from "@/src/hooks/game/useHostWebSocket";
import { GameAssetsProvider, useGameAssets } from '@/src/context/GameAssetsContext';
import { GameSettingsDialog } from "@/src/components/game/settings/GameSettingsDialog";

// --- Import NEW UI State Components ---
import { InitialHostView } from '@/src/components/game/host/InitialHostView';
import { ConnectingHostView } from '@/src/components/game/host/ConnectingHostView';
import { ErrorHostView } from '@/src/components/game/host/ErrorHostView';
import { DisconnectedHostView } from '@/src/components/game/host/DisconnectedHostView';
// --- END Import ---


const API_BASE_URL = 'http://localhost:8080/api/session';
const TOPIC_PREFIX = '/topic';

const HostPageContent = () => {
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

  const {
    liveGameState, currentBlock, timerKey, currentQuestionAnswerCount, currentTotalPlayers,
    handleNext, handleSkip, handleTimeUp, handleWebSocketMessage,
    initializeSession, prepareQuestionMessage, prepareResultMessage, resetGameState,
  } = useHostGameCoordinator(quizData);

  const {
    connect: connectWebSocket, disconnect: disconnectWebSocket, sendMessage,
    connectionStatus: wsConnectionStatus, error: wsError, hostClientId,
  } = useHostWebSocket({ onMessageReceived: (message) => handleWebSocketMessage(message.body) });

  const { backgrounds, sounds, isLoading: assetsLoading, error: assetsError } = useGameAssets();

  // === Effects for loading data, setting defaults, syncing UI state (Keep as is) ===
  useEffect(() => {
    /* ... load mock quiz data ... */
    setIsQuizLoading(true);
    const mockData = mockQuizStructureHost as QuizStructureHost;
    setQuizData(mockData);
    setIsQuizLoading(false);
  }, []);

  useEffect(() => {
    /* ... set initial background and sound ... */
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

  useEffect(() => {
    /* ... sync Page UI State with WebSocket Connection Status ... */
    if (wsConnectionStatus === 'CONNECTING') { setUiState('CONNECTING'); setApiError(null); }
    else if (wsConnectionStatus === 'CONNECTED') { setUiState('CONNECTED'); setApiError(null); }
    else if (wsConnectionStatus === 'DISCONNECTED') { if (uiState !== 'INITIAL' && uiState !== 'ERROR') setUiState('DISCONNECTED'); }
    else if (wsConnectionStatus === 'ERROR') { setApiError(wsError ?? "Unknown WebSocket error."); setUiState('ERROR'); }
  }, [wsConnectionStatus, wsError, uiState]);

  useEffect(() => {
    if (!liveGameState) {
      console.log("[HostPage Effect] No live game state yet.");
      return;
    }

    console.log(`[HostPage Effect] Triggered. Status: ${liveGameState.status}, Index: ${liveGameState.currentQuestionIndex}, UI State: ${uiState}, LastSentIndex: ${lastSentQuestionIndexRef.current}`);

    if (uiState !== 'CONNECTED') {
      console.log("[HostPage Effect] Skipping send: UI state is not CONNECTED.");
      return;
    }

    const { status, gamePin, players, hostUserId, currentQuestionIndex } = liveGameState;

    // --- Send QUESTION ---
    if ((status === 'QUESTION_SHOW' || status === 'QUESTION_GET_READY')) {
      // Check if block is ready AND index is NEW
      if (currentBlock && currentBlock.questionIndex === currentQuestionIndex && lastSentQuestionIndexRef.current !== currentQuestionIndex) {
        console.log(`[HostPage Effect] Preparing QUESTION message for index ${currentQuestionIndex} (New Send)...`);
        const messageString = prepareQuestionMessage(); // Uses currentBlock from coordinator
        console.log("[HostPage Effect] Prepared Question Message:", messageString ? messageString.substring(0, 100) + '...' : 'null');
        if (messageString && gamePin) {
          const destination = `${TOPIC_PREFIX}/player/${gamePin}`;
          console.log(`[HostPage Effect] Sending question to ${destination}`);
          sendMessage(destination, messageString);
          // --- UPDATE Last Sent Index ---
          lastSentQuestionIndexRef.current = currentQuestionIndex;
        } else {
          console.warn("[HostPage Effect] Could not send question - missing message string or game pin.", { hasMessage: !!messageString, hasPin: !!gamePin });
        }
      } else if (lastSentQuestionIndexRef.current === currentQuestionIndex) {
        console.log(`[HostPage Effect] Question for index ${currentQuestionIndex} was already sent.`);
      } else {
        console.log(`[HostPage Effect] Waiting for currentBlock for index ${currentQuestionIndex} to be ready.`);
      }
    }
    // --- Send RESULTS ---
    else if (status === 'QUESTION_RESULT') {
      // Reset last sent index REF when showing results, so the *next* question can be sent
      // Do this *before* sending results to avoid race conditions if results trigger next question quickly.
      if (lastSentQuestionIndexRef.current === currentQuestionIndex) {
        console.log(`[HostPage Effect] Resetting lastSentQuestionIndex Ref on showing result for index ${currentQuestionIndex}`);
        lastSentQuestionIndexRef.current = null; // Allow next question to be sent later
      }

      console.log(`[HostPage Effect] Preparing RESULT messages for index ${currentQuestionIndex}...`);
      if (players && Object.keys(players).length > 0) {
        Object.keys(players).forEach(playerId => {
          if (playerId !== hostUserId) {
            const messageString = prepareResultMessage(playerId);
            console.log(`[HostPage Effect] Prepared Result Message for ${playerId}:`, messageString ? messageString.substring(0, 100) + '...' : 'null');
            if (messageString && gamePin) {
              const destination = `${TOPIC_PREFIX}/player/${gamePin}`;
              console.log(`[HostPage Effect] Sending result for ${playerId} to ${destination}`);
              sendMessage(destination, messageString);
            } else {
              console.warn(`[HostPage Effect] Could not send result for ${playerId} - missing message string or game pin.`, { hasMessage: !!messageString, hasPin: !!gamePin });
            }
          }
        });
      } else {
        console.warn("[HostPage Effect] Cannot send results: No players found in state.");
      }
      // Resetting ref moved to happen *before* sending results for the current index.
    }
    // --- Send PODIUM ---
    else if (status === 'PODIUM') {
      console.log("[HostPage Effect] TODO: Send Podium Message");
      lastSentQuestionIndexRef.current = null; // Reset for podium/end
    } else {
      console.log(`[HostPage Effect] Status (${status}) does not trigger specific send logic or question already sent.`);
    }

  }, [
    // ----- Key Dependencies for triggering SEND actions -----
    liveGameState?.status,                // Trigger on game phase change
    liveGameState?.currentQuestionIndex,  // Trigger when the question changes
    currentBlock,                       // Trigger when the formatted block for the current index is ready
    liveGameState?.gamePin,             // Needed for destination topic (should be stable after init)
    // ----- Other necessary dependencies -----
    uiState,                            // Ensure component is in a state where sending is allowed
    // ----- Stable function references from hooks -----
    sendMessage,
    prepareQuestionMessage,
    prepareResultMessage,
    // Avoid liveGameState.players here to prevent re-sends on every answer
    liveGameState?.hostUserId // Needed for filtering in results loop (should be stable)
  ]);

  useEffect(() => { /* ... cleanup on unmount ... */
    return () => { disconnectWebSocket(); };
  }, [disconnectWebSocket]);


  // === Action Handlers (Keep as is, but update retry/reset handler) ===
  const handleStartGameClick = async () => { /* ... API call to start game ... */
    if (!quizData) { setApiError("Quiz data not ready."); setUiState('ERROR'); return; }
    setUiState('FETCHING_PIN'); setApiError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await response.json();
      if (response.ok && data.gamePin) {
        setFetchedGamePin(data.gamePin);
        connectWebSocket(data.gamePin, (clientId) => { initializeSession(data.gamePin, clientId); });
      } else { throw new Error(data.error || `Failed to create session (Status: ${response.status})`); }
    } catch (error: any) {
      console.error("HostPage: Error creating session:", error);
      setApiError(error.message || "Failed to start game."); setUiState('ERROR');
    }
  };

  const handleResetAndGoToInitial = () => {
    disconnectWebSocket();
    resetGameState(); // Resets coordinator state
    // No need to call setLiveGameState here, coordinator handles it
    setApiError(null);
    setFetchedGamePin(null);
    lastSentQuestionIndexRef.current = null; // Reset the ref
    setUiState('INITIAL');
  };

  const handleReconnect = () => {
    if (fetchedGamePin) {
      connectWebSocket(fetchedGamePin, (clientId) => initializeSession(fetchedGamePin, clientId));
    } else {
      handleResetAndGoToInitial(); // Fallback if pin lost
    }
  };


  const handleOpenSettings = () => { setIsSettingsOpen(true); };
  const handleBackgroundSelect = (backgroundId: string) => { /* ... */ setSelectedBackgroundId(backgroundId); setIsSettingsOpen(false); };
  const handleSoundSelect = (soundId: string) => { /* ... */ setSelectedSoundId(soundId); setIsSettingsOpen(false); };

  // --- Refactored Rendering Logic ---
  const renderPageActualContent = () => {
    switch (uiState) {
      case 'INITIAL':
        return <InitialHostView
          onStartGameClick={handleStartGameClick}
          isQuizLoading={isQuizLoading}
          isDisabled={uiState !== 'INITIAL'} // Pass disabled state
        />;
      case 'FETCHING_PIN':
        return <ConnectingHostView message="Getting Game Pin..." />;
      case 'CONNECTING':
        return <ConnectingHostView message={`Connecting to WebSocket for Game Pin: ${fetchedGamePin}...`} />;
      case 'ERROR':
        return <ErrorHostView errorMessage={apiError} onRetry={handleResetAndGoToInitial} />;
      case 'DISCONNECTED':
        return <DisconnectedHostView onStartNewGame={handleResetAndGoToInitial} onReconnect={handleReconnect} gamePin={fetchedGamePin} />;
      case 'CONNECTED':
        if (liveGameState) {
          return (
            <>
              <HostView
                timerKey={timerKey}
                questionData={currentBlock}
                currentAnswerCount={currentQuestionAnswerCount}
                totalPlayers={currentTotalPlayers}
                gamePin={liveGameState.gamePin}
                accessUrl={"VuiQuiz.com"} // Replace with dynamic if needed
                onTimeUp={handleTimeUp}
                onSkip={handleSkip}
                onNext={handleNext}
                onSettingsClick={handleOpenSettings}
                selectedBackgroundId={selectedBackgroundId}
                selectedSoundId={selectedSoundId}
                isLoading={!currentBlock && liveGameState.status !== "LOBBY" && liveGameState.status !== "PODIUM" && liveGameState.status !== "ENDED"}
              />
              {process.env.NODE_ENV === 'development' && (
                <DevMockControls
                  // Pass the actual message handler from the coordinator
                  simulateReceiveMessage={(msgBody) => handleWebSocketMessage(msgBody)}
                  simulatePlayerAnswer={(msgBody) => handleWebSocketMessage(msgBody)}
                  simulateHostReceiveJoin={(msgBody) => handleWebSocketMessage(msgBody)}
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
        // Fallback if connected but gameState is somehow null
        return <ConnectingHostView message="Loading game state..." />;
      default:
        return <ErrorHostView errorMessage="Invalid UI state." onRetry={handleResetAndGoToInitial} />;
    }
  };

  return renderPageActualContent();
}; // End of HostPageContent

// Wrap the page component with the context provider (Remains the same)
export default function HostPage() {
  return (
    <GameAssetsProvider>
      <HostPageContent />
    </GameAssetsProvider>
  );
}