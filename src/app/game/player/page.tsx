// src/app/game/player/page.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { IMessage } from '@stomp/stompjs';

import { PlayerAnswerPayload, Avatar as AvatarType } from '@/src/lib/types';
import { usePlayerWebSocket } from '@/src/hooks/game/usePlayerWebSocket';
import { GameAssetsProvider, useGameAssets } from '@/src/context/GameAssetsContext';
import { MockWebSocketMessage } from '@/src/components/game/DevMockControls';

import { ConnectingPlayerView } from '@/src/components/game/player/ConnectingPlayerView';
import { DisconnectedPlayerView } from '@/src/components/game/player/DisconnectedPlayerView';
import { ErrorPlayerView } from '@/src/components/game/player/ErrorPlayerView';

import { PlayerPinInputView } from './views/PlayerPinInputView';
import { PlayerNicknameInputView } from './views/PlayerNicknameInputView';
import { PlayerGameplayView } from './views/PlayerGameplayView';
import { PlayerKickedView } from '@/src/app/game/player/views/PlayerKickedView';

import { usePlayerGameManager } from './hooks/usePlayerGameManager';
import { usePlayerPageUI, PageUiState } from './hooks/usePlayerPageUI';


// Định nghĩa URL background tĩnh
const STATIC_BACKGROUND_URL = "https://images-cdn.kahoot.it/01015166-e2b7-4d09-ab1a-244f0958e8a1";


function PlayerPageInternal() {
  const { avatars, isLoading: assetsLoading, error: assetsError } = useGameAssets();

  const gameManager = usePlayerGameManager();
  const {
    currentBlock, currentResult, isSubmitting, playerInfo, currentBackgroundId,
    processGameMessage, resetCoreGameState, setPlayerClientId,
    setPlayerNickname: setPlayerNicknameInManager, // Alias for clarity
    setPlayerAvatarId, setIsPlayerSubmitting,
  } = gameManager;

  // Forward declaration for handleReceivedMessageCallback
  const onKickCallbackRef = useRef<(() => void) | null>(null);

  const handleReceivedMessageCallback = useCallback((message: IMessage) => {
    let parsedBody;
    try {
      parsedBody = JSON.parse(message.body);
      const messageData = Array.isArray(parsedBody) ? parsedBody[0] : parsedBody;
      if (!messageData || !messageData.data) {
        console.warn("[PlayerPage WS Handler] Đã nhận tin nhắn không có trường dữ liệu:", messageData);
        return;
      }
      const { id: dataTypeId, content: rawContent } = messageData.data;

      if (typeof rawContent === 'string') {
        const parsedContent = JSON.parse(rawContent);
        if (dataTypeId === 10) { // Player Kicked
          console.log(`[PlayerPage WS Handler] Đã nhận tin nhắn bị kick (ID: ${dataTypeId}). Nội dung:`, parsedContent);
          processGameMessage(dataTypeId, parsedContent);
          if (onKickCallbackRef.current) {
            onKickCallbackRef.current();
          } else {
            console.warn('[PlayerPage WS Handler] onKickCallbackRef.current chưa được thiết lập, không thể xử lý việc kick.');
          }
        } else if ([1, 2, 8, 13, 35].includes(dataTypeId)) { // Other game messages
          processGameMessage(dataTypeId, parsedContent);
        } else {
          console.log(`[PlayerPage WS Handler] ID loại dữ liệu không được xử lý: ${dataTypeId}`, parsedContent);
        }
      } else if (dataTypeId === 10 && (rawContent === null || typeof rawContent === 'object')) {
        console.log(`[PlayerPage WS Handler] Đã nhận tin nhắn bị kick (ID: ${dataTypeId}) với nội dung đã được phân tích cú pháp hoặc rỗng. Nội dung:`, rawContent);
        processGameMessage(dataTypeId, rawContent || {});
        if (onKickCallbackRef.current) {
          onKickCallbackRef.current();
        } else {
          console.warn('[PlayerPage WS Handler] onKickCallbackRef.current chưa được thiết lập cho việc kick đã được phân tích cú pháp trước đó.');
        }
      } else {
        console.warn(`[PlayerPage WS Handler] Đã nhận tin nhắn (ID: ${dataTypeId}) mà nội dung không phải là chuỗi:`, rawContent);
      }
    } catch (e) {
      console.error('[PlayerPage WS Handler] Không thể phân tích tin nhắn hoặc xử lý callback:', e, message.body);
    }
  }, [processGameMessage]);

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
  useEffect(() => {
    onKickCallbackRef.current = () => processPlayerKick(disconnectWebSocket);
    return () => {
      onKickCallbackRef.current = null;
    };
  }, [processPlayerKick, disconnectWebSocket]);

  // Effect to handle WS 'INITIAL' state specifically for resetting to PIN input
  useEffect(() => {
    if (wsConnectionStatus === 'INITIAL' && uiState !== 'PIN_INPUT') {
      console.log("[PlayerPageInternal] Kết nối WS đang ở trạng thái INITIAL và UI không phải là PIN_INPUT, đang đặt lại.");
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
    const success = await submitNickname();
    if (success) {
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
    if (wsConnectionStatus === 'INITIAL' && uiState !== 'PIN_INPUT') {
      console.log("[PlayerPageInternal] Kết nối WS đang ở trạng thái INITIAL và UI không phải là PIN_INPUT, đang đặt lại.");
      resetToPinInputState(disconnectWebSocket, resetCoreGameState);
    }
  }, [wsConnectionStatus, uiState, resetToPinInputState, disconnectWebSocket, resetCoreGameState]);

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
        return (
          <div className="relative min-h-screen bg-cover bg-center" style={{ backgroundImage: `url(${STATIC_BACKGROUND_URL})` }}>
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <PlayerPinInputView
                gamePin={gamePin}
                onGamePinChange={setGamePinInput}
                onSubmit={submitPin}
                errorMessage={pageError}
                isConnecting={isProcessingPin}
              />
            </div>
          </div>
        );
      case 'CONNECTING':
        return (
          <div className="relative min-h-screen bg-cover bg-center" style={{ backgroundImage: `url(${STATIC_BACKGROUND_URL})` }}>
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <ConnectingPlayerView message={`Đang kết nối đến trò chơi ${gamePin}...`} />
            </div>
          </div>
        );
      case 'NICKNAME_INPUT':
        return (
          <div className="relative min-h-screen bg-cover bg-center" style={{ backgroundImage: `url(${STATIC_BACKGROUND_URL})` }}>
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <PlayerNicknameInputView
                gamePin={gamePin}
                nickname={nicknameInput}
                onNicknameChange={setNicknameInputFieldValue}
                onSubmit={handleActualNicknameSubmit}
                errorMessage={pageError}
                onAvatarSelected={handleAvatarSelected}
              />
            </div>
          </div>
        );
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
      case 'KICKED':
        return <PlayerKickedView />;
      case 'ERROR':
        return <ErrorPlayerView errorMessage={pageError} onRetry={() => resetToPinInputState(disconnectWebSocket, resetCoreGameState)} />;
      default:
        return <ErrorPlayerView errorMessage="Đã xảy ra lỗi không mong muốn." onRetry={() => resetToPinInputState(disconnectWebSocket, resetCoreGameState)} />;
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