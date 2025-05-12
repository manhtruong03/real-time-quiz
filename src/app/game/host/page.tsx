// src/app/game/host/page.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { WifiOff, Loader2 } from "lucide-react";

import { fetchQuizDetails } from "@/src/lib/api/quizzes";
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
import { transformLiveStateToFinalizationDto } from '@/src/lib/game-utils/session-transformer';
import { saveSessionResults } from '@/src/lib/api/sessions';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/session";
const TOPIC_PREFIX = "/topic";
const APP_PREFIX = "/app"; // Added for private messages
const DEFAULT_AUTO_START_SECONDS = 30;

const HostPageContent = () => {
  const searchParams = useSearchParams();
  const quizId = searchParams.get('quizId');

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
  const [isQuizDataLoading, setIsQuizDataLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | null>(null);
  const [selectedSoundId, setSelectedSoundId] = useState<string | null>(null);
  const lastSentQuestionIndexRef = useRef<number | null>(null);
  const [isAutoStartEnabled, setIsAutoStartEnabled] = useState(false);
  const [autoStartTimeSeconds, setAutoStartTimeSeconds] = useState<number | null>(DEFAULT_AUTO_START_SECONDS);
  const [autoStartCountdown, setAutoStartCountdown] = useState<number | null>(null);
  const autoStartIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isFinalizingSession, setIsFinalizingSession] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const {
    backgrounds,
    sounds,
    isLoading: assetsLoading,
    error: assetsError,
  } = useGameAssets();
  const { isMuted, toggleMute } = useHostAudioManager({ selectedSoundId });

  const liveGameStateRef = useRef<LiveGameState | null>(null);

  const coordinator = useHostGameCoordinator({
    initialQuizData: quizData,
    onPlayerJoined: (joiningPlayerCid: string) => {
      const currentSelectedBgId = selectedBackgroundIdRef.current; // Use ref here
      const currentPin = liveGameStateRef.current?.gamePin ?? fetchedGamePinRef.current; // Use ref here
      if (
        currentSelectedBgId &&
        currentPin &&
        wsConnectionStatusRef.current === "CONNECTED" // Use ref here
      ) {
        const contentPayload = { background: { id: currentSelectedBgId } };
        const contentString = JSON.stringify(contentPayload);
        // For individual background updates upon join, this should go to the specific player.
        // However, background changes are often broadcast. If it needs to be private for late joiners:
        const privateBgUpdateMessage = {
          channel: `${APP_PREFIX}/controller/${currentPin}`, // Target private controller
          data: {
            gameid: currentPin,
            id: 35, // Assuming 35 is for background updates
            type: "message",
            host: "VuiQuiz.com",
            content: contentString,
            cid: joiningPlayerCid, // Target the specific player
          },
          ext: { timetrack: Date.now() },
        };
        if (sendMessageRef.current) sendMessageRef.current(privateBgUpdateMessage.channel, JSON.stringify([privateBgUpdateMessage]));

      }
      // Auto-Start Logic (remains the same)
      if (
        isAutoStartEnabledRef.current && // Use ref
        autoStartTimeSecondsRef.current !== null && // Use ref
        liveGameStateRef.current &&
        Object.keys(liveGameStateRef.current.players).length > 0 &&
        autoStartCountdownRef.current === null && // Use ref
        autoStartIntervalRef.current === null
      ) {
        setAutoStartCountdown(autoStartTimeSecondsRef.current); // Use ref value to set state
      }
    },
  });
  const coordinatorRef = useRef(coordinator);

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
        coordinatorRef.current.handleWebSocketMessage(message.body as any); // Cast if DevMockControls used
      } else {
        console.warn("[HostPage] Coordinator ref not ready for message handling.");
      }
    },
  });

  // Refs for values used in callbacks that might otherwise cause stale closures
  const selectedBackgroundIdRef = useRef(selectedBackgroundId);
  const fetchedGamePinRef = useRef(fetchedGamePin);
  const wsConnectionStatusRef = useRef(wsConnectionStatus);
  const isAutoStartEnabledRef = useRef(isAutoStartEnabled);
  const autoStartTimeSecondsRef = useRef(autoStartTimeSeconds);
  const autoStartCountdownRef = useRef(autoStartCountdown);
  const sendMessageRef = useRef(sendMessage);

  useEffect(() => { selectedBackgroundIdRef.current = selectedBackgroundId; }, [selectedBackgroundId]);
  useEffect(() => { fetchedGamePinRef.current = fetchedGamePin; }, [fetchedGamePin]);
  useEffect(() => { wsConnectionStatusRef.current = wsConnectionStatus; }, [wsConnectionStatus]);
  useEffect(() => { isAutoStartEnabledRef.current = isAutoStartEnabled; }, [isAutoStartEnabled]);
  useEffect(() => { autoStartTimeSecondsRef.current = autoStartTimeSeconds; }, [autoStartTimeSeconds]);
  useEffect(() => { autoStartCountdownRef.current = autoStartCountdown; }, [autoStartCountdown]);
  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);


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
    kickPlayerCid,
  } = coordinator;

  useEffect(() => {
    liveGameStateRef.current = liveGameState;
  }, [liveGameState]);

  useEffect(() => {
    if (!quizId) {
      setApiError("No Quiz ID provided in the URL.");
      setUiState("ERROR");
      setIsQuizDataLoading(false);
      return;
    }
    let isMounted = true;
    setIsQuizDataLoading(true);
    setApiError(null);
    fetchQuizDetails(quizId)
      .then((fetchedQuiz) => {
        if (isMounted) {
          setQuizData(fetchedQuiz as unknown as QuizStructureHost);
          setIsQuizDataLoading(false);
        }
      })
      .catch((error: any) => {
        if (isMounted) {
          setApiError(error.message || "Failed to load quiz data.");
          setUiState("ERROR");
          setIsQuizDataLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [quizId]);

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

  useEffect(() => {
    if (uiState === 'INITIAL' && isQuizDataLoading) return;
    if (wsConnectionStatus === "CONNECTING") setUiState("CONNECTING");
    else if (wsConnectionStatus === "CONNECTED") setUiState("CONNECTED");
    else if (wsConnectionStatus === "DISCONNECTED") {
      if (uiState !== "INITIAL" && uiState !== "ERROR") {
        setUiState("DISCONNECTED");
      }
    } else if (wsConnectionStatus === "ERROR") {
      setApiError(wsError ?? "Unknown WebSocket error.");
      setUiState("ERROR");
    }
  }, [wsConnectionStatus, wsError, uiState, isQuizDataLoading]);

  useEffect(() => {
    if (!liveGameState) return;
    if (uiState !== "CONNECTED" || wsConnectionStatus !== "CONNECTED") return;

    const { status, gamePin, players, hostUserId, currentQuestionIndex } =
      liveGameState;

    if (status === "QUESTION_SHOW" || status === "QUESTION_GET_READY") {
      if (
        currentBlock &&
        currentBlock.questionIndex === currentQuestionIndex &&
        lastSentQuestionIndexRef.current !== currentQuestionIndex
      ) {
        const messageBody = prepareQuestionMessage(); // prepareQuestionMessage now returns the body string
        if (messageBody && gamePin) {
          const destination = `${TOPIC_PREFIX}/player/${gamePin}`; // Public topic for questions
          sendMessage(destination, messageBody);
          lastSentQuestionIndexRef.current = currentQuestionIndex;
        }
      }
    }
    else if (status === "SHOWING_STATS" || status === "PODIUM" || status === "ENDED") { // Results or Podium
      // The check `lastSentQuestionIndexRef.current === currentQuestionIndex` ensures results are sent once per question end.
      // For podium/end, currentQuestionIndex might be the last question's index or -1 if game ended abruptly.
      // The logic here focuses on sending to each player.
      const isFinalMessage = status === "PODIUM" || status === "ENDED";
      // Only send if we haven't sent for this specific question's results OR if it's a final message
      if (lastSentQuestionIndexRef.current === currentQuestionIndex || isFinalMessage) {
        if (players && Object.keys(players).length > 0 && gamePin) {
          Object.keys(players).forEach((playerId) => {
            if (playerId !== hostUserId) { // Don't send results to host itself

              // +++ START MODIFICATION FOR PHASE 1 (Corrected) +++
              const preparedMsg = prepareResultMessage(playerId); // Returns { messageString, messageDataId }

              if (preparedMsg.messageString && preparedMsg.messageDataId !== null) {
                let destinationChannel: string;
                // Determine destination based on messageDataId
                if (preparedMsg.messageDataId === 8 || preparedMsg.messageDataId === 13) {
                  destinationChannel = `${APP_PREFIX}/controller/${gamePin}`; // Private channel
                  console.log(`[HostPage] Sending private result (ID: ${preparedMsg.messageDataId}) for player ${playerId} to ${destinationChannel}`);
                } else {
                  // Fallback for other types (should not happen if prepareResultMessage is only for results)
                  destinationChannel = `${TOPIC_PREFIX}/player/${gamePin}`; // Public channel
                  console.warn(`[HostPage] Unexpected messageDataId ${preparedMsg.messageDataId} from prepareResultMessage, sending to public topic.`);
                }
                sendMessage(destinationChannel, preparedMsg.messageString);
              } else {
                console.warn(`Could not prepare result/final message for player ${playerId}.`);
              }
              // +++ END MODIFICATION FOR PHASE 1 (Corrected) +++
            }
          });
        }
        if (!isFinalMessage) { // For intermediate question results
          lastSentQuestionIndexRef.current = null; // Reset after sending results for the question
        } else if (isFinalMessage && lastSentQuestionIndexRef.current !== -999) { // Arbitrary value to ensure final messages are sent once
          lastSentQuestionIndexRef.current = -999; // Mark final messages as sent
        }
      }
    }
    else if (status === "LOBBY") {
      if (lastSentQuestionIndexRef.current !== null) {
        lastSentQuestionIndexRef.current = null;
      }
    }
  }, [
    liveGameState,
    currentBlock,
    uiState,
    wsConnectionStatus,
    sendMessage,
    prepareQuestionMessage,
    prepareResultMessage,
  ]);

  useEffect(() => {
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
      if (autoStartIntervalRef.current) clearInterval(autoStartIntervalRef.current);
    };
  }, [isAutoStartEnabled, autoStartTimeSeconds, autoStartCountdown, liveGameState?.status, handleNext]);

  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (
      liveGameState &&
      quizData &&
      (liveGameState.status === "PODIUM" || liveGameState.status === "ENDED") &&
      isAuthenticated &&
      !isFinalizingSession
    ) {
      setIsFinalizingSession(true);
      const finalPayload = transformLiveStateToFinalizationDto(liveGameState, quizData);
      const sendFinalizationRequest = async () => {
        try {
          await saveSessionResults(finalPayload);
          toast({
            title: "Session Results Saved",
            description: "The game results have been successfully recorded.",
          });
        } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Error Saving Results",
            description: error.message || "An unexpected error occurred.",
          });
        }
      };
      sendFinalizationRequest();
    }
  }, [
    liveGameState,
    quizData,
    isAuthenticated,
    isFinalizingSession,
    toast,
    // setIsFinalizingSession // Only if you set it back to false
  ]);

  const handleStartGameClick = async () => {
    if (uiState !== 'INITIAL' || isQuizDataLoading || !quizData) {
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
      } else {
        throw new Error(data.error || `Failed to create session (Status: ${response.status})`);
      }
    } catch (error: any) {
      setApiError(error.message || "Failed to start game session.");
      setUiState('ERROR');
    }
  };

  const handleResetAndGoToInitial = () => {
    disconnectWebSocket();
    resetGameState();
    setApiError(null);
    setFetchedGamePin(null);
    lastSentQuestionIndexRef.current = null;
    setQuizData(null);
    setIsQuizDataLoading(true);
    setSelectedBackgroundId(null);
    setSelectedSoundId(null);
    setIsSettingsOpen(false);
    setIsAutoStartEnabled(false);
    setAutoStartTimeSeconds(DEFAULT_AUTO_START_SECONDS);
    setAutoStartCountdown(null);
    if (autoStartIntervalRef.current) clearInterval(autoStartIntervalRef.current);
    autoStartIntervalRef.current = null;
    setUiState("INITIAL");
    window.location.reload();
  };

  const handleReconnect = () => {
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
  const handleSoundSelect = (soundId: string) => { setSelectedSoundId(soundId); setIsSettingsOpen(false); };
  const handleBackgroundSelect = (backgroundId: string) => {
    setSelectedBackgroundId(backgroundId);
    setIsSettingsOpen(false);
    const currentPin = liveGameState?.gamePin ?? fetchedGamePin;
    if (currentPin && wsConnectionStatus === "CONNECTED") {
      const contentPayload = { background: { id: backgroundId } };
      const contentString = JSON.stringify(contentPayload);
      // Background changes are typically broadcast to all players
      const wsMessageEnvelope = {
        channel: `${TOPIC_PREFIX}/player/${currentPin}`, // Public channel for background
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
      autoStartIntervalRef.current = null;
    } else if (seconds === null) {
      setAutoStartCountdown(null);
      if (autoStartIntervalRef.current) clearInterval(autoStartIntervalRef.current);
      autoStartIntervalRef.current = null;
    }
  };

  const handleToggleFullScreen = () => {
    if (!document.fullscreenEnabled) {
      toast({ variant: "destructive", title: "Error", description: "Fullscreen not supported." });
      return;
    }
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => toast({ variant: "destructive", title: "Error", description: "Could not enter fullscreen." }));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const handleKickPlayer = (playerIdToKick: string) => {
    // Logic to send kick message via WebSocket
    const currentPin = liveGameState?.gamePin ?? fetchedGamePin;
    if (currentPin && wsConnectionStatus === "CONNECTED") {
      const kickPayload = { kickCode: 1 }; // Example kick code
      const contentString = JSON.stringify(kickPayload);
      const wsMessageEnvelope = {
        // For kicking, send to the PRIVATE controller channel,
        // the backend will then dispatch to the specific player's private queue.
        channel: `${APP_PREFIX}/controller/${currentPin}`,
        data: {
          gameid: currentPin,
          id: 10, // ID for Player Kicked (as per docs/websocket_message_structure.txt)
          type: "message",
          host: "VuiQuiz.com",
          content: contentString,
          cid: playerIdToKick, // The player to be kicked
        },
        ext: { timetrack: Date.now() },
      };
      sendMessage(wsMessageEnvelope.channel, JSON.stringify([wsMessageEnvelope]));
      toast({ title: "Player Kicked", description: `Attempted to kick player ${playerIdToKick}.` });

      // Optimistically update UI or wait for backend confirmation if preferred
      if (kickPlayerCid) { // Check if the function exists
        kickPlayerCid(playerIdToKick);
      }
    } else {
      toast({ variant: "destructive", title: "Error", description: "Cannot kick player, not connected." });
    }
  };

  const renderPageActualContent = () => {
    if (!quizId && uiState !== 'ERROR') {
      return <ErrorHostView errorMessage="No Quiz ID specified in URL." onRetry={() => window.location.reload()} />;
    }
    switch (uiState) {
      case "INITIAL":
        return (
          <InitialHostView
            onStartGameClick={handleStartGameClick}
            isQuizLoading={isQuizDataLoading || assetsLoading}
            isDisabled={isQuizDataLoading || assetsLoading || !quizData}
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
        if (assetsLoading) return <ConnectingHostView message="Loading assets..." />;
        if (assetsError) return <ErrorHostView errorMessage={assetsError} onRetry={handleResetAndGoToInitial} />;
        if (!liveGameState) return <ConnectingHostView message="Initializing game state..." />;
        return (
          <>
            {liveGameState.status === "LOBBY" ? (
              <HostLobbyView
                quizTitle={quizData?.title ?? "Quiz"}
                gamePin={liveGameState.gamePin}
                accessUrl={"VuiQuiz.com"}
                participants={Object.values(liveGameState.players ?? {}).filter(p => p.cid !== liveGameState.hostUserId)} // Filter out host from participant list
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
            {process.env.NODE_ENV === "development" && false && ( // Disabled DevMockControls for now
              <DevMockControls
                simulatePlayerAnswer={(msgBody) => coordinatorRef.current?.handleWebSocketMessage(msgBody as any)}
                simulateHostReceiveJoin={(msgBody) => coordinatorRef.current?.handleWebSocketMessage(msgBody as any)}
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
        return <ErrorHostView errorMessage={`Invalid UI state: ${uiState}`} onRetry={handleResetAndGoToInitial} />;
    }
  };

  if (!quizId && uiState !== "ERROR") {
    return <ErrorHostView errorMessage="No Quiz ID specified in URL." onRetry={() => window.location.reload()} />;
  }
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