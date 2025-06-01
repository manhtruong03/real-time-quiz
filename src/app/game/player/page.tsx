// src/app/game/player/page.tsx
'use client';

import React, { useCallback, useEffect, useMemo } from 'react';
import { IMessage } from '@stomp/stompjs';

import { PlayerAnswerPayload, Avatar as AvatarType } from '@/src/lib/types'; //
import { usePlayerWebSocket } from '@/src/hooks/game/usePlayerWebSocket'; //
import { GameAssetsProvider, useGameAssets } from '@/src/context/GameAssetsContext'; //
import { MockWebSocketMessage } from '@/src/components/game/DevMockControls'; //

import { ConnectingPlayerView } from '@/src/components/game/player/ConnectingPlayerView'; //
import { DisconnectedPlayerView } from '@/src/components/game/player/DisconnectedPlayerView'; //
import { ErrorPlayerView } from '@/src/components/game/player/ErrorPlayerView'; //

import { PlayerPinInputView } from './views/PlayerPinInputView';
import { PlayerNicknameInputView } from './views/PlayerNicknameInputView';
import { PlayerGameplayView } from './views/PlayerGameplayView';

import { usePlayerGameManager } from './hooks/usePlayerGameManager';
import { usePlayerPageUI, PageUiState } from './hooks/usePlayerPageUI';


function PlayerPageInternal() {
  const { avatars, isLoading: assetsLoading, error: assetsError } = useGameAssets(); //

  const gameManager = usePlayerGameManager();
  const {
    currentBlock, currentResult, isSubmitting, playerInfo, currentBackgroundId,
    processGameMessage, resetCoreGameState, setPlayerClientId,
    setPlayerNickname: setPlayerNicknameInManager, // Alias for clarity
    setPlayerAvatarId, setIsPlayerSubmitting,
  } = gameManager;

  // Forward declaration for handleReceivedMessageCallback
  let onKickCallback: (() => void) | null = null;

  const handleReceivedMessageCallback = useCallback((message: IMessage) => {
    let parsedBody;
    try {
      parsedBody = JSON.parse(message.body);
      const messageData = Array.isArray(parsedBody) ? parsedBody[0] : parsedBody;
      if (!messageData || !messageData.data) return;
      const { id: dataTypeId, content: rawContent } = messageData.data;

      if (typeof rawContent === 'string') {
        const parsedContent = JSON.parse(rawContent);
        if ([1, 2, 8, 13, 35].includes(dataTypeId)) {
          processGameMessage(dataTypeId, parsedContent);
        } else if (dataTypeId === 10) { // Player Kicked
          console.log(`[PlayerPage WS Handler] Player Kicked (ID: ${dataTypeId})`);
          if (onKickCallback) onKickCallback(); // Call the kick handler from usePlayerPageUI
        } else {
          console.log(`[PlayerPage WS Handler] Unhandled data type ID: ${dataTypeId}`, parsedContent);
        }
      }
    } catch (e) {
      console.error('[PlayerPage WS Handler] Failed to parse message body:', e, message.body);
    }
  }, [processGameMessage /* onKickCallback will be stable once set */]);

  const ws = usePlayerWebSocket({ onMessageReceived: handleReceivedMessageCallback });
  const {
    connect: connectWebSocket, disconnect: disconnectWebSocket, joinGame, sendAnswer, sendAvatarUpdate,
    connectionStatus: wsConnectionStatus, error: wsError, playerClientId,
  } = ws;

  const pageUI = usePlayerPageUI({
    wsConnectionStatus,
    wsError,
    connectFn: connectWebSocket,
    joinGameFn: joinGame,
    setPlayerNicknameInGameManagerFn: setPlayerNicknameInManager,
    currentAvatarIdFromGameManager: playerInfo.avatarId,
  });
  const {
    uiState, gamePin, nicknameInput, pageError, isProcessingPin,
    setGamePinInput, setNicknameInputFieldValue,
    submitPin, submitNickname, resetToPinInputState, processPlayerKick,
  } = pageUI;

  // Assign the kick processing function to the callback placeholder
  // This ensures handleReceivedMessageCallback can call processPlayerKick
  useEffect(() => {
    onKickCallback = () => processPlayerKick(disconnectWebSocket);
    // Cleanup onKickCallback when component unmounts or dependencies change
    return () => { onKickCallback = null; };
  }, [processPlayerKick, disconnectWebSocket]);

  // Effect to handle WS 'INITIAL' state specifically for resetting to PIN input
  useEffect(() => {
    if (wsConnectionStatus === 'INITIAL' && uiState !== 'PIN_INPUT') {
      console.log("[PlayerPageInternal] WS connection is INITIAL and UI not PIN_INPUT, resetting.");
      resetToPinInputState(disconnectWebSocket, resetCoreGameState);
    }
  }, [wsConnectionStatus, uiState, resetToPinInputState, disconnectWebSocket, resetCoreGameState]);


  const handleAvatarSelected = useCallback((avatarId: string | null) => {
    setPlayerAvatarId(avatarId);
    if (avatarId && gamePin && playerInfo.cid && uiState === 'PLAYING') {
      sendAvatarUpdate(avatarId, gamePin);
    }
  }, [gamePin, playerInfo.cid, uiState, sendAvatarUpdate, setPlayerAvatarId]);

  const handleActualNicknameSubmit = async () => {
    const success = await submitNickname(); // From usePlayerPageUI
    if (success) {
      // After UI state is set to PLAYING by submitNickname, reset game-specific state
      resetCoreGameState();
    }
    return success;
  };

  const handleAnswerSubmitClick = (answerDetailPayload: PlayerAnswerPayload) => {
    if (!gamePin) return;
    setIsPlayerSubmitting(true);
    sendAnswer(answerDetailPayload, gamePin);
  };

  const handleSimulatedMessageFromDevControls = useCallback((mockMessage: MockWebSocketMessage) => {
    const partialIMessage: Partial<IMessage> & { body: string, headers: { destination: string } } = {
      body: JSON.stringify([mockMessage]),
      headers: { destination: mockMessage.channel || `/topic/player/${gamePin || 'unknown'}` },
      ack: () => { }, nack: () => { }, command: 'MESSAGE', binaryBody: new Uint8Array()
    };
    handleReceivedMessageCallback(partialIMessage as IMessage);
  }, [handleReceivedMessageCallback, gamePin]);

  useEffect(() => {
    if (playerClientId) setPlayerClientId(playerClientId);
  }, [playerClientId, setPlayerClientId]);

  useEffect(() => {
    if (uiState === 'NICKNAME_INPUT' && !assetsLoading && !playerInfo.avatarId && avatars && avatars.length > 0) {
      const activeAvatars = avatars.filter(a => a.is_active && a.image_file_path);
      if (activeAvatars.length > 0) {
        handleAvatarSelected(activeAvatars[Math.floor(Math.random() * activeAvatars.length)].avatar_id);
      }
    }
  }, [uiState, assetsLoading, avatars, playerInfo.avatarId, handleAvatarSelected]);

  const selectedAvatarUrl = useMemo(() => {
    if (assetsLoading || assetsError || !playerInfo.avatarId || !avatars) return null;
    return avatars.find(a => a.avatar_id === playerInfo.avatarId)?.image_file_path ?? null;
  }, [playerInfo.avatarId, avatars, assetsLoading, assetsError]);

  const renderPageContent = () => {
    switch (uiState) {
      case 'PIN_INPUT':
        return <PlayerPinInputView
          gamePin={gamePin}
          onGamePinChange={setGamePinInput}
          onSubmit={submitPin}
          errorMessage={pageError}
          isConnecting={isProcessingPin}
        />;
      case 'CONNECTING':
        return <ConnectingPlayerView message={`Connecting to game ${gamePin}...`} />;
      case 'NICKNAME_INPUT':
        return <PlayerNicknameInputView
          gamePin={gamePin}
          nickname={nicknameInput}
          onNicknameChange={setNicknameInputFieldValue}
          onSubmit={handleActualNicknameSubmit}
          errorMessage={pageError}
          onAvatarSelected={handleAvatarSelected}
        />;
      case 'PLAYING':
        const playerInfoForStatusBar = {
          name: playerInfo.name, avatarUrl: selectedAvatarUrl, avatarId: playerInfo.avatarId,
          score: playerInfo.totalScore, rank: playerInfo.rank,
        };
        return <PlayerGameplayView
          currentBlock={currentBlock} currentResult={currentResult} isSubmitting={isSubmitting}
          playerInfoForStatusBar={playerInfoForStatusBar} onSubmitAnswer={handleAnswerSubmitClick}
          handleSimulatedMessage={handleSimulatedMessageFromDevControls}
          currentBackgroundId={currentBackgroundId} avatars={avatars} onAvatarChange={handleAvatarSelected}
        />;
      case 'DISCONNECTED':
        return <DisconnectedPlayerView errorMessage={pageError} onJoinNewGame={() => resetToPinInputState(disconnectWebSocket, resetCoreGameState)} />;
      case 'ERROR':
        return <ErrorPlayerView errorMessage={pageError} onRetry={() => resetToPinInputState(disconnectWebSocket, resetCoreGameState)} />;
      default:
        return <ErrorPlayerView errorMessage="An unexpected error occurred." onRetry={() => resetToPinInputState(disconnectWebSocket, resetCoreGameState)} />;
    }
  };

  return renderPageContent();
}

export default function PlayerPage() {
  return (
    <GameAssetsProvider>
      <PlayerPageInternal />
    </GameAssetsProvider>
  );
}