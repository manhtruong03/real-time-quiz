// src/app/game/host/page.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import HostView from "@/src/components/game/views/HostView";
import DevMockControls from "@/src/components/game/DevMockControls";
import {
  QuizStructureHost,
  LiveGameState,
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
import { HostLobbyView } from "@/src/components/game/host/lobby/HostLobbyView";
import { useToast } from "@/src/components/ui/use-toast";
import { useHostAudioManager } from "@/src/hooks/game/useHostAudioManager";
import { useAuth } from '@/src/context/AuthContext';

import { useHostGameSetup } from "./hooks/useHostGameSetup";
import { useHostPageUIStateManager, PageUiState } from "./hooks/useHostPageUIStateManager";
import { useGameSettingsManager } from "./hooks/useGameSettingsManager";
import { useAutoStartManager } from "./hooks/useAutoStartManager";
import { useSessionFinalizationHandler } from "./hooks/useSessionFinalizationHandler";
import { useHostPageActions } from "./hooks/useHostPageActions";

const TOPIC_PREFIX = "/topic";
const APP_PREFIX = "/app"; // Also used in useHostPageActions

const HostPageContent = () => {
  const searchParams = useSearchParams();
  const quizId = searchParams.get('quizId');

  // --- Instantiate Hooks (Phase 1 and others) ---
  const { quizData, isQuizDataLoading, quizApiError, setQuizApiError: setQuizSetupApiError } = useHostGameSetup(quizId);
  const { backgrounds, sounds, isLoading: assetsLoading, error: assetsError } = useGameAssets();

  const {
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
    sendMessage, // This is stable from useHostWebSocket
    connectionStatus: wsConnectionStatus,
    error: wsError,
    hostClientId,
  } = useHostWebSocket({
    onMessageReceived: (message) => {
      // Ensure coordinatorRef is current or pass coordinator functions directly if they are stable
      if (coordinatorRef.current?.handleWebSocketMessage) {
        coordinatorRef.current.handleWebSocketMessage(message.body as any);
      } else {
        console.warn("[HostPage] Coordinator ref not ready for message handling on receive.");
      }
    },
  });

  const uiManager = useHostPageUIStateManager({
    quizId, isQuizDataLoading, quizApiError, assetsLoading,
    assetsError, wsConnectionStatus, wsError,
  });
  // Destructure ALL needed values from uiManager to ensure they are current
  const { uiState, setUiState, pageApiError, setPageApiError, fetchedGamePin, setFetchedGamePin } = uiManager;

  const { isAuthenticated } = useAuth();
  const { toast } = useToast(); // toast function is stable

  const coordinator = useHostGameCoordinator({
    initialQuizData: quizData,
    onPlayerJoined: (joiningPlayerCid: string) => {
      const currentSelectedBgId = gameSettingsRef.current?.selectedBackgroundId;
      // Use fetchedGamePin directly from uiManager to ensure it's current
      const currentPin = liveGameStateRef.current?.gamePin ?? uiManager.fetchedGamePin;
      if (currentSelectedBgId && currentPin && wsConnectionStatusRef.current === "CONNECTED") {
        const contentPayload = { background: { id: currentSelectedBgId } };
        const contentString = JSON.stringify(contentPayload);
        const privateBgUpdateMessage = {
          channel: `${APP_PREFIX}/controller/${currentPin}`,
          data: { gameid: currentPin, id: 35, type: "message", host: "VuiQuiz.com", content: contentString, cid: joiningPlayerCid },
          ext: { timetrack: Date.now() },
        };
        if (sendMessageRef.current) { // sendMessageRef contains stable sendMessage
          sendMessageRef.current(privateBgUpdateMessage.channel, JSON.stringify([privateBgUpdateMessage]));
        }
      }
      // Auto-start logic on player join (relying on autoStartManager's internal effects based on hasPlayers prop)
      // Or, if explicit trigger is needed and setAutoStartCountdown is stable:
      // if (autoStartManagerRef.current?.isAutoStartEnabled && ... ) {
      //   autoStartManagerRef.current.setAutoStartCountdown?.(...);
      // }
    },
  });
  const coordinatorRef = useRef(coordinator); // Ref for callbacks if coordinator object itself is not stable
  // Ideally, coordinator returns stable functions.

  // Destructure ALL values from coordinator needed by effects or other hooks/components
  const {
    liveGameState, currentBlock, timerKey, currentQuestionAnswerCount, currentTotalPlayers,
    handleNext, // Passed to autoStartManager and HostLobbyView
    handleSkip, // Passed to HostView
    handleTimeUp, // Passed to HostView
    initializeSession, // Passed to useHostPageActions
    prepareQuestionMessage, // Used in message sending effect
    prepareResultMessage,   // Used in message sending effect
    resetGameState,         // Passed to useHostPageActions
    kickPlayerCid,          // Passed to useHostPageActions (as kickPlayerCidFromCoordinator)
  } = coordinator;


  const gameSettings = useGameSettingsManager({
    initialBackgrounds: backgrounds, initialSounds: sounds,
    liveGamePin: liveGameState?.gamePin ?? fetchedGamePin, // Use current fetchedGamePin
    sendMessage: sendMessage, // Pass stable sendMessage
    isWsConnected: wsConnectionStatus === "CONNECTED",
  });
  const {
    isSettingsOpen, selectedBackgroundId, selectedSoundId,
    handleOpenSettings, handleSoundSelect, handleBackgroundSelect,
    // Ensure setIsSettingsOpen is stable from useGameSettingsManager if passed directly
    // For actions hook, it's setIsSettingsOpenFromManager
  } = gameSettings;
  const gameSettingsRef = useRef(gameSettings); // Ref for onPlayerJoined if needed

  const autoStartManager = useAutoStartManager({
    onAutoStartTrigger: handleNext, // Pass stable handleNext from coordinator
    liveGameStatus: liveGameState?.status,
    hasPlayers: liveGameState ? Object.keys(liveGameState.players ?? {}).filter(pId => pId !== liveGameState.hostUserId).length > 0 : false,
  });
  const {
    isAutoStartEnabled, autoStartTimeSeconds, autoStartCountdown,
    handleAutoStartToggle, handleAutoStartTimeChange, setAutoStartCountdown,
  } = autoStartManager;
  const autoStartManagerRef = useRef(autoStartManager);

  useSessionFinalizationHandler({ liveGameState, quizData, isAuthenticated, toast });

  // This ref is critical for the WebSocket message sending effect.
  // It's modified by that effect and reset by handleResetAndGoToInitial (now in useHostPageActions).
  const lastSentQuestionIndexRef = useRef<number | null>(null);

  // --- Instantiate useHostPageActions ---
  const pageActions = useHostPageActions({
    uiState, setUiState, setPageApiError, fetchedGamePin, setFetchedGamePin, // All from uiManager
    isQuizDataLoading, quizData, setQuizSetupApiError, // From useHostGameSetup
    assetsLoading, // From useGameAssets
    connectWebSocket, disconnectWebSocket, sendMessage, wsConnectionStatus, // From useHostWebSocket
    initializeSession, resetGameState, kickPlayerCidFromCoordinator: kickPlayerCid, liveGameState, // From coordinator
    handleAutoStartToggleForActions: handleAutoStartToggle, // from autoStartManager
    handleAutoStartTimeChangeForActions: handleAutoStartTimeChange, // from autoStartManager
    setIsSettingsOpenFromManager: gameSettings.setIsSettingsOpen, // from gameSettings (ensure stable)
    toast,
    lastSentQuestionIndexRef, // Pass the ref
  });
  // Destructure actions for use in JSX
  const {
    handleStartGameClick, handleResetAndGoToInitial, handleReconnect,
    handleToggleFullScreen, handleKickPlayer,
  } = pageActions;

  const [isFullScreen, setIsFullScreen] = useState(false); // This state is for the fullscreen UI toggle
  const { isMuted, toggleMute } = useHostAudioManager({ selectedSoundId });


  // Refs for values that might be needed in callbacks not re-created frequently
  // Ensure these refs are updated if their source values change.
  const liveGameStateRef = useRef<LiveGameState | null>(liveGameState);
  const fetchedGamePinRef = useRef(fetchedGamePin); // Ref for fetchedGamePin
  const wsConnectionStatusRef = useRef(wsConnectionStatus);
  const sendMessageRef = useRef(sendMessage); // Ref for stable sendMessage

  useEffect(() => { liveGameStateRef.current = liveGameState; }, [liveGameState]);
  useEffect(() => { fetchedGamePinRef.current = fetchedGamePin; }, [fetchedGamePin]); // Update ref when fetchedGamePin changes
  useEffect(() => { wsConnectionStatusRef.current = wsConnectionStatus; }, [wsConnectionStatus]);
  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]); // sendMessage is stable
  useEffect(() => { coordinatorRef.current = coordinator; }, [coordinator]); // If coordinator object itself is a dependency
  useEffect(() => { gameSettingsRef.current = gameSettings; }, [gameSettings]);
  useEffect(() => { autoStartManagerRef.current = autoStartManager; }, [autoStartManager]);


  // Effect to trigger auto-start countdown when conditions are met (e.g., player joins)
  // This relies on states from autoStartManager hook.
  useEffect(() => {
    if (liveGameState?.status === "LOBBY" &&
      Object.keys(liveGameState.players ?? {}).filter(pId => pId !== liveGameState.hostUserId).length > 0 &&
      isAutoStartEnabled && // from autoStartManager
      autoStartCountdown === null && // from autoStartManager
      autoStartTimeSeconds > 0) { // from autoStartManager
      setAutoStartCountdown(autoStartTimeSeconds); // Call stable setter from autoStartManager
    }
  }, [
    liveGameState?.players, liveGameState?.status, liveGameState?.hostUserId, // From coordinator
    isAutoStartEnabled, autoStartCountdown, autoStartTimeSeconds, setAutoStartCountdown // From autoStartManager
  ]);

  // CRITICAL EFFECT: Sends WebSocket messages based on liveGameState changes.
  // This MUST use the most current state values.
  useEffect(() => {
    if (!liveGameState) return;
    // Use uiState directly from the uiManager hook's destructured state
    if (uiState !== "CONNECTED" || wsConnectionStatus !== "CONNECTED") return;

    const { status, gamePin, players, hostUserId, currentQuestionIndex } = liveGameState;

    if (status === "QUESTION_SHOW" || status === "QUESTION_GET_READY") {
      if (
        currentBlock && // from coordinator
        currentBlock.questionIndex === currentQuestionIndex &&
        lastSentQuestionIndexRef.current !== currentQuestionIndex
      ) {
        const messageBody = prepareQuestionMessage(); // from coordinator
        if (messageBody && gamePin) {
          const destination = `${TOPIC_PREFIX}/player/${gamePin}`;
          sendMessage(destination, messageBody); // from useHostWebSocket
          lastSentQuestionIndexRef.current = currentQuestionIndex;
        }
      }
    }
    else if (status === "SHOWING_STATS" || status === "PODIUM" || status === "ENDED") {
      const isFinalMessage = status === "PODIUM" || status === "ENDED";
      // Check if we haven't sent messages for this question's results yet, or if it's a final message
      if (lastSentQuestionIndexRef.current === currentQuestionIndex || (isFinalMessage && lastSentQuestionIndexRef.current !== -999)) {
        if (players && Object.keys(players).length > 0 && gamePin) {
          Object.keys(players).forEach((playerId) => {
            if (playerId !== hostUserId) {
              const preparedMsg = prepareResultMessage(playerId); // from coordinator
              if (preparedMsg.messageString && preparedMsg.messageDataId !== null) {
                let destinationChannel: string;
                // Original logic for different channels based on message ID
                if (preparedMsg.messageDataId === 8 || preparedMsg.messageDataId === 13) {
                  destinationChannel = `${APP_PREFIX}/controller/${gamePin}`;
                } else {
                  destinationChannel = `${TOPIC_PREFIX}/player/${gamePin}`;
                }
                sendMessage(destinationChannel, preparedMsg.messageString); // from useHostWebSocket
              } else {
                console.warn(`Could not prepare result/final message for player ${playerId}.`);
              }
            }
          });
        }
        if (!isFinalMessage) {
          // Reset to allow next question's messages. If it was QUESTION_SHOW/GET_READY, it gets set to currentQuestionIndex.
          // If it was already null (e.g. from LOBBY state), it stays null.
          // This ensures that if we were showing stats for Q1 (index 0), lastSentQuestionIndexRef was 0.
          // After sending results for Q1, it should be reset so Q2 (index 1) can be sent.
          lastSentQuestionIndexRef.current = null;
        } else if (isFinalMessage && lastSentQuestionIndexRef.current !== -999) {
          // Mark that final messages (like podium) have been sent.
          lastSentQuestionIndexRef.current = -999;
        }
      }
    }
    else if (status === "LOBBY") {
      // Reset when returning to lobby to allow sending messages for the first question again
      if (lastSentQuestionIndexRef.current !== null) {
        lastSentQuestionIndexRef.current = null;
      }
    }
  }, [
    liveGameState, // Direct from coordinator
    currentBlock,  // Direct from coordinator
    uiState,       // Direct from uiManager
    wsConnectionStatus, // Direct from useHostWebSocket
    sendMessage,        // Stable sendMessage from useHostWebSocket
    prepareQuestionMessage, // Stable function from coordinator
    prepareResultMessage,   // Stable function from coordinator
    // lastSentQuestionIndexRef is a ref, its change doesn't trigger re-run, but its .current is used.
  ]);

  // Effect for WebSocket disconnect on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket(); // from useHostWebSocket (stable)
    };
  }, [disconnectWebSocket]);

  // Effect for fullscreen state
  useEffect(() => {
    const handleFullscreenChangeCb = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChangeCb);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChangeCb);
  }, []); // Empty dependency: runs once on mount, cleans up on unmount


  const renderPageActualContent = () => {
    // Use states directly from their respective hook outputs
    switch (uiState) {
      case "INITIAL":
        return (<InitialHostView onStartGameClick={handleStartGameClick} isQuizLoading={isQuizDataLoading || assetsLoading} isDisabled={isQuizDataLoading || assetsLoading || (!quizData && !isQuizDataLoading) || !!quizApiError} />);
      case "ERROR":
        return <ErrorHostView errorMessage={pageApiError || "An unknown error occurred."} onRetry={handleResetAndGoToInitial} />;
      case "FETCHING_PIN":
        return <ConnectingHostView message="Creating Game Session..." />;
      case "CONNECTING":
        return <ConnectingHostView message={`Connecting WebSocket (Pin: ${fetchedGamePin})...`} />;
      case "DISCONNECTED":
        return <DisconnectedHostView onStartNewGame={handleResetAndGoToInitial} onReconnect={handleReconnect} gamePin={fetchedGamePin} />;
      case "CONNECTED":
        if (assetsLoading && !quizData && !isQuizDataLoading) return <ConnectingHostView message="Loading assets and quiz..." />;
        if (assetsLoading) return <ConnectingHostView message="Loading assets..." />;
        if (isQuizDataLoading) return <ConnectingHostView message="Loading quiz data..." />;
        if (!liveGameState) return <ConnectingHostView message="Initializing game state..." />;
        if (!quizData) {
          setPageApiError("Quiz data is unexpectedly missing after loading."); // Use setter from uiManager
          setUiState("ERROR"); // Use setter from uiManager
          return <ConnectingHostView message="Error: Quiz data missing..." />; // Temp until re-render
        }

        return (
          <>
            {liveGameState.status === "LOBBY" ? (
              <HostLobbyView
                quizTitle={quizData.title} gamePin={liveGameState.gamePin} accessUrl={"VuiQuiz.com"}
                participants={Object.values(liveGameState.players ?? {}).filter(p => p.cid !== liveGameState.hostUserId)}
                selectedBackgroundId={selectedBackgroundId} // From gameSettings
                onStartGame={handleNext} // From coordinator
                onEndGame={handleResetAndGoToInitial} // From pageActions
                onKickPlayer={handleKickPlayer} // From pageActions
                isAutoStartEnabled={isAutoStartEnabled} // From autoStartManager
                onAutoStartToggle={handleAutoStartToggle} // From autoStartManager
                autoStartTimeSeconds={autoStartTimeSeconds} // From autoStartManager
                onAutoStartTimeChange={handleAutoStartTimeChange} // From autoStartManager
                autoStartCountdown={autoStartCountdown} // From autoStartManager
                onSettingsClick={handleOpenSettings} // From gameSettings
                isMuted={isMuted} // Local state via useHostAudioManager
                onToggleMute={toggleMute} // From useHostAudioManager
                isFullScreen={isFullScreen} // Local state
                onToggleFullScreen={handleToggleFullScreen} // From pageActions
              />
            ) : (
              <HostView
                liveGameState={liveGameState} quizData={quizData} currentBlock={currentBlock} timerKey={timerKey}
                currentAnswerCount={currentQuestionAnswerCount} totalPlayers={currentTotalPlayers}
                gamePin={liveGameState.gamePin} accessUrl={"VuiQuiz.com"}
                onTimeUp={handleTimeUp} // From coordinator
                onSkip={handleSkip}     // From coordinator
                onNext={handleNext}     // From coordinator
                isLoading={false}
                selectedSoundId={selectedSoundId} // From gameSettings
                selectedBackgroundId={selectedBackgroundId} // From gameSettings
                onSettingsClick={handleOpenSettings} // From gameSettings
                isMuted={isMuted} // Local state via useHostAudioManager
                onToggleMute={toggleMute} // From useHostAudioManager
              />
            )}
            {process.env.NODE_ENV === "development" && false && (
              <DevMockControls
                simulatePlayerAnswer={(msgBody) => coordinatorRef.current?.handleWebSocketMessage(msgBody as any)}
                simulateHostReceiveJoin={(msgBody) => coordinatorRef.current?.handleWebSocketMessage(msgBody as any)}
                loadMockBlock={() => { console.warn("Loading mock block via DevControls is disabled when using real data.") }}
                setMockResult={() => { console.warn("Setting mock result via DevControls is disabled when using real data.") }}
              />
            )}
            <GameSettingsDialog
              open={isSettingsOpen} // From gameSettings
              onOpenChange={gameSettings.setIsSettingsOpen} // Setter from gameSettings
              selectedBackgroundId={selectedBackgroundId} // From gameSettings
              onBackgroundSelect={handleBackgroundSelect} // From gameSettings
              selectedSoundId={selectedSoundId} // From gameSettings
              onSoundSelect={handleSoundSelect} // From gameSettings
            />
          </>
        );
      default:
        const _exhaustiveCheck: never = uiState;
        return <ErrorHostView errorMessage={`Invalid UI state: ${_exhaustiveCheck}`} onRetry={handleResetAndGoToInitial} />;
    }
  };
  return renderPageActualContent();
};

export default function HostPage() {
  return (
    <Suspense fallback={<ConnectingHostView message="Loading Host Page..." />}>
      <GameAssetsProvider><HostPageContent /></GameAssetsProvider>
    </Suspense>
  );
}