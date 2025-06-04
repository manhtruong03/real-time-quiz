// src/app/game/host/page.tsx
"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";

import HostView from "@/src/components/game/views/HostView";
import DevMockControls from "@/src/components/game/DevMockControls";
import { QuizStructureHost, LiveGameState } from "@/src/lib/types";
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
import { useToast } from "@/src/hooks/use-toast";
import { useHostAudioManager } from "@/src/hooks/game/useHostAudioManager";
import { useAuth } from "@/src/context/AuthContext";

import { useHostGameSetup } from "./hooks/useHostGameSetup";
import {
  useHostPageUIStateManager,
  PageUiState,
} from "./hooks/useHostPageUIStateManager";
import { useGameSettingsManager } from "./hooks/useGameSettingsManager";
import { useAutoStartManager } from "./hooks/useAutoStartManager";
import { useSessionFinalizationHandler } from "./hooks/useSessionFinalizationHandler";
import { useHostPageActions } from "./hooks/useHostPageActions";
import { useHostMessageSender } from "./hooks/useHostMessageSender"; // Import new hook

const TOPIC_PREFIX = "/topic";
const APP_PREFIX = "/app";

const HostPageContent = () => {
  const searchParams = useSearchParams();
  const quizId = searchParams.get("quizId");

  const {
    quizData,
    isQuizDataLoading,
    quizApiError,
    setQuizApiError: setQuizSetupApiError,
  } = useHostGameSetup(quizId);
  const {
    backgrounds,
    sounds,
    isLoading: assetsLoading,
    error: assetsError,
  } = useGameAssets();

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
        coordinatorRef.current.handleWebSocketMessage(message.body as any);
      } else {
        console.warn(
          "[HostPage] Coordinator ref not ready for message handling on receive."
        );
      }
    },
  });

  const uiManager = useHostPageUIStateManager({
    quizId,
    isQuizDataLoading,
    quizApiError,
    assetsLoading,
    assetsError,
    wsConnectionStatus,
    wsError,
  });
  const {
    uiState,
    setUiState,
    pageApiError,
    setPageApiError,
    fetchedGamePin,
    setFetchedGamePin,
  } = uiManager;

  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const coordinator = useHostGameCoordinator({
    initialQuizData: quizData,
    onPlayerJoined: (joiningPlayerCid: string) => {
      const currentSelectedBgId = gameSettingsRef.current?.selectedBackgroundId;
      const currentPin =
        liveGameStateRef.current?.gamePin ?? uiManager.fetchedGamePin;
      if (
        currentSelectedBgId &&
        currentPin &&
        wsConnectionStatusRef.current === "CONNECTED"
      ) {
        const contentPayload = { background: { id: currentSelectedBgId } };
        const contentString = JSON.stringify(contentPayload);
        const privateBgUpdateMessage = {
          channel: `${APP_PREFIX}/controller/${currentPin}`,
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
        if (sendMessageRef.current) {
          sendMessageRef.current(
            privateBgUpdateMessage.channel,
            JSON.stringify([privateBgUpdateMessage])
          );
        }
      }
    },
  });
  const coordinatorRef = useRef(coordinator);

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
    kickPlayerCid,
    executeKickPlayer,
  } = coordinator;

  const gameSettings = useGameSettingsManager({
    initialBackgrounds: backgrounds,
    initialSounds: sounds,
    liveGamePin: liveGameState?.gamePin ?? fetchedGamePin,
    sendMessage: sendMessage,
    isWsConnected: wsConnectionStatus === "CONNECTED",
  });
  const {
    isSettingsOpen,
    selectedBackgroundId,
    selectedSoundId,
    handleOpenSettings,
    handleSoundSelect,
    handleBackgroundSelect,
  } = gameSettings;
  const gameSettingsRef = useRef(gameSettings);

  const autoStartManager = useAutoStartManager({
    onAutoStartTrigger: handleNext,
    liveGameStatus: liveGameState?.status,
    hasPlayers: liveGameState
      ? Object.keys(liveGameState.players ?? {}).filter(
        (pId) => pId !== liveGameState.hostUserId
      ).length > 0
      : false,
  });
  const {
    isAutoStartEnabled,
    autoStartTimeSeconds,
    autoStartCountdown,
    handleAutoStartToggle,
    handleAutoStartTimeChange,
    setAutoStartCountdown,
  } = autoStartManager;
  const autoStartManagerRef = useRef(autoStartManager);

  useSessionFinalizationHandler({
    liveGameState,
    quizData,
    isAuthenticated,
    toast,
  });

  const lastSentQuestionIndexRef = useRef<number | null>(null);

  const pageActions = useHostPageActions({
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
    kickPlayerCidFromCoordinator: kickPlayerCid,
    executeKickPlayerFromCoordinator: executeKickPlayer,
    liveGameState,
    handleAutoStartToggleForActions: handleAutoStartToggle,
    handleAutoStartTimeChangeForActions: handleAutoStartTimeChange,
    setIsSettingsOpenFromManager: gameSettings.setIsSettingsOpen,
    toast,
    lastSentQuestionIndexRef,
  });
  const {
    handleStartGameClick,
    handleResetAndGoToInitial,
    handleReconnect,
    handleToggleFullScreen,
    handleKickPlayer,
  } = pageActions;

  const [isFullScreen, setIsFullScreen] = useState(false);
  const { isMuted, toggleMute } = useHostAudioManager({ selectedSoundId });

  const liveGameStateRef = useRef<LiveGameState | null>(liveGameState);
  const fetchedGamePinRef = useRef(fetchedGamePin);
  const wsConnectionStatusRef = useRef(wsConnectionStatus);
  const sendMessageRef = useRef(sendMessage);

  useEffect(() => {
    liveGameStateRef.current = liveGameState;
  }, [liveGameState]);
  useEffect(() => {
    fetchedGamePinRef.current = fetchedGamePin;
  }, [fetchedGamePin]);
  useEffect(() => {
    wsConnectionStatusRef.current = wsConnectionStatus;
  }, [wsConnectionStatus]);
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);
  useEffect(() => {
    coordinatorRef.current = coordinator;
  }, [coordinator]);
  useEffect(() => {
    gameSettingsRef.current = gameSettings;
  }, [gameSettings]);
  useEffect(() => {
    autoStartManagerRef.current = autoStartManager;
  }, [autoStartManager]);

  // Use the new hook for sending messages
  useHostMessageSender({
    liveGameState,
    currentBlock,
    uiState,
    wsConnectionStatus,
    sendMessage,
    prepareQuestionMessage,
    prepareResultMessage,
    lastSentQuestionIndexRef,
    appPrefix: APP_PREFIX,
    topicPrefix: TOPIC_PREFIX,
  });

  // Effect for fullscreen state
  useEffect(() => {
    const handleFullscreenChangeCb = () =>
      setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChangeCb);
    return () =>
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChangeCb
      );
  }, []);

  const renderPageActualContent = () => {
    switch (uiState) {
      case "INITIAL":
        return (
          <InitialHostView
            onStartGameClick={handleStartGameClick}
            isQuizLoading={isQuizDataLoading || assetsLoading}
            isDisabled={
              isQuizDataLoading ||
              assetsLoading ||
              (!quizData && !isQuizDataLoading) ||
              !!quizApiError
            }
          />
        );
      case "ERROR":
        return (
          <ErrorHostView
            errorMessage={pageApiError || "An unknown error occurred."}
            onRetry={handleResetAndGoToInitial}
          />
        );
      case "FETCHING_PIN":
        return <ConnectingHostView message="Creating Game Session..." />;
      case "CONNECTING":
        return (
          <ConnectingHostView
            message={`Connecting WebSocket (Pin: ${fetchedGamePin})...`}
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
      case "CONNECTED":
        if (assetsLoading && !quizData && !isQuizDataLoading)
          return <ConnectingHostView message="Loading assets and quiz..." />;
        if (assetsLoading)
          return <ConnectingHostView message="Loading assets..." />;
        if (isQuizDataLoading)
          return <ConnectingHostView message="Loading quiz data..." />;
        if (!liveGameState)
          return <ConnectingHostView message="Initializing game state..." />;
        if (!quizData) {
          setPageApiError("Quiz data is unexpectedly missing after loading.");
          setUiState("ERROR");
          return <ConnectingHostView message="Error: Quiz data missing..." />;
        }

        return (
          <>
            {liveGameState.status === "LOBBY" ? (
              <HostLobbyView
                quizTitle={quizData.title}
                gamePin={liveGameState.gamePin}
                accessUrl={"VuiQuiz.com"}
                participants={Object.values(liveGameState.players ?? {}).filter(
                  (p) => p.cid !== liveGameState.hostUserId
                )}
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
                isLoading={false}
                selectedSoundId={selectedSoundId}
                selectedBackgroundId={selectedBackgroundId}
                onSettingsClick={handleOpenSettings}
                isMuted={isMuted}
                onToggleMute={toggleMute}
              />
            )}
            {process.env.NODE_ENV === "development" && false && (
              <DevMockControls
                simulatePlayerAnswer={(msgBody) =>
                  coordinatorRef.current?.handleWebSocketMessage(msgBody as any)
                }
                simulateHostReceiveJoin={(msgBody) =>
                  coordinatorRef.current?.handleWebSocketMessage(msgBody as any)
                }
                loadMockBlock={() => {
                  console.warn(
                    "Loading mock block via DevControls is disabled when using real data."
                  );
                }}
                setMockResult={() => {
                  console.warn(
                    "Setting mock result via DevControls is disabled when using real data."
                  );
                }}
              />
            )}
            <GameSettingsDialog
              open={isSettingsOpen}
              onOpenChange={gameSettings.setIsSettingsOpen}
              selectedBackgroundId={selectedBackgroundId}
              onBackgroundSelect={handleBackgroundSelect}
              selectedSoundId={selectedSoundId}
              onSoundSelect={handleSoundSelect}
            />
          </>
        );
      default:
        const _exhaustiveCheck: never = uiState;
        return (
          <ErrorHostView
            errorMessage={`Invalid UI state: ${_exhaustiveCheck}`}
            onRetry={handleResetAndGoToInitial}
          />
        );
    }
  };
  return renderPageActualContent();
};

export default function HostPage() {
  return (
    <Suspense fallback={<ConnectingHostView message="Loading Host Page..." />}>
      <GameAssetsProvider>
        <HostPageContent />
      </GameAssetsProvider>
    </Suspense>
  );
}
