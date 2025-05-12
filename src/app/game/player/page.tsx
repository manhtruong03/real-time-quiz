// src/app/game/player/page.tsx
'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { IMessage } from '@stomp/stompjs';

import { GameBlock, PlayerAnswerPayload, QuestionResultPayload, LivePlayerState, Avatar as AvatarType } from '@/src/lib/types';

import { usePlayerWebSocket, PlayerConnectionStatus } from '@/src/hooks/game/usePlayerWebSocket';

import { GameAssetsProvider, useGameAssets } from '@/src/context/GameAssetsContext';

import { MockWebSocketMessage } from '@/src/components/game/DevMockControls';

import { PinInputForm } from '@/src/components/game/player/PinInputForm';

import { NicknameInputForm } from '@/src/components/game/player/NicknameInputForm';

import { ConnectingPlayerView } from '@/src/components/game/player/ConnectingPlayerView';
import { PlayerGameScreen } from '@/src/components/game/player/PlayerGameScreen';

import { DisconnectedPlayerView } from '@/src/components/game/player/DisconnectedPlayerView';
import { ErrorPlayerView } from '@/src/components/game/player/ErrorPlayerView';


interface MinimalPlayerInfo {
  cid: string | null;

  name: string;
  // Add avatarId here to store it at the page level
  avatarId: string | null;
  totalScore: number;
  rank: number | undefined;
}

type PageUiState = 'PIN_INPUT' | 'CONNECTING' | 'NICKNAME_INPUT' | 'PLAYING' | 'DISCONNECTED' | 'ERROR';

function PlayerPageInternal() {
  const [uiState, setUiState] = useState<PageUiState>('PIN_INPUT');
  const [gamePin, setGamePin] = useState<string>('');

  const [nickname, setNickname] = useState<string>('');
  const [pageError, setPageError] = useState<string | null>(null);

  const [currentBlock, setCurrentBlock] = useState<GameBlock | null>(null);

  const [currentResult, setCurrentResult] = useState<QuestionResultPayload | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize playerInfo with avatarId
  const [playerInfo, setPlayerInfo] = useState<MinimalPlayerInfo>({ cid: null, name: '', avatarId: null, totalScore: 0, rank: undefined });

  const [joinAttempted, setJoinAttempted] = useState(false);

  const [currentBackgroundId, setCurrentBackgroundId] = useState<string | null>(null);

  const { avatars, isLoading: assetsLoading, error: assetsError } = useGameAssets();

  const _setCurrentBlock = useCallback((block: GameBlock | null) => {
    setCurrentResult(null);
    setIsSubmitting(false);
    setCurrentBlock(block);
  }, []);


  const _setCurrentResult = useCallback((result: QuestionResultPayload | null) => {
    setCurrentBlock(null);
    setIsSubmitting(false);
    setCurrentResult(result);
    if (result) {
      setPlayerInfo(prev => ({
        ...prev,
        totalScore: result.totalScore,
        rank: result.rank,
      }));
    }
  }, []);


  const _resetGameState = useCallback(() => {
    setCurrentBlock(null);
    setCurrentResult(null);
    setIsSubmitting(false);
    setJoinAttempted(false);
    setCurrentBackgroundId(null);
    setPlayerInfo(prev => ({ ...prev, avatarId: null, totalScore: 0, rank: undefined }));
  }, []);


  const handleReceivedMessageCallback = useCallback((message: IMessage) => {
    let parsedBody;
    try {
      // +++ ADD DETAILED LOGGING HERE +++
      console.log(
        `[PlayerPage WS Handler] RAW INCOMING MESSAGE. Destination Header: ${message.headers.destination}, Subscription Header: ${message.headers.subscription}, Message ID Header: ${message.headers['message-id']}`
      );
      // console.log("[PlayerPage WS Handler] Full Message Object:", message); // Uncomment for even more detail if needed
      // +++ END DETAILED LOGGING +++

      parsedBody = JSON.parse(message.body);
      const messageData = Array.isArray(parsedBody) ? parsedBody[0] : parsedBody;

      if (!messageData || !messageData.data) {
        console.warn('[PlayerPage WS Handler] Received message without data field:', messageData);
        return;
      }

      console.log("[PlayerPage WS Handler] Parsed messageData Content:", JSON.stringify(messageData.data.content, null, 2));


      // The existing check for '/private' in destination is good,
      // but also log if the subscription ID matches the one for the private queue.
      // You might need to find out what subscription ID stompClient.subscribe returns for '/user/queue/private'
      // and compare message.headers.subscription to that.
      if (message.headers.destination?.includes('/private') || message.headers.destination?.includes(playerClientId || 'impossible-to-match-initially')) {
        console.log(
          `[PlayerPage WS Handler] Message looks to be for a private queue (destination: ${message.headers.destination})`
        );
      }

      const { id: dataTypeId, content } = messageData.data;

      if (typeof content === 'string') {
        const parsedContent = JSON.parse(content);

        if (dataTypeId === 1 || dataTypeId === 2) { // Question data
          console.log(`[PlayerPage WS Handler] Processing Question Block (ID: ${dataTypeId}):`, parsedContent.type, `(Index: ${parsedContent.gameBlockIndex})`);
          _setCurrentBlock(parsedContent as GameBlock);
        } else if (dataTypeId === 8 || dataTypeId === 13) { // Result or Podium data
          console.log(`[PlayerPage WS Handler] Processing Result/Podium (ID: ${dataTypeId}):`, parsedContent.type, `(Index: ${parsedContent.pointsData?.lastGameBlockIndex})`);
          _setCurrentResult(parsedContent as QuestionResultPayload);
        } else if (dataTypeId === 35) { // Host Background Change
          console.log(`[PlayerPage WS Handler] Processing Background Change (ID: ${dataTypeId})`);
          const newBackgroundId = parsedContent?.background?.id;
          if (typeof newBackgroundId === 'string' && newBackgroundId) {
            setCurrentBackgroundId(newBackgroundId);
          } else {
            console.warn("[PlayerPage WS Handler] Received background change message but ID was missing or invalid:", parsedContent);
          }
        } else if (dataTypeId === 10) { // Player Kicked (as per docs/websocket_message_structure.txt)
          console.log(`[PlayerPage WS Handler] Processing Player Kicked (ID: ${dataTypeId})`, parsedContent);
          // TODO: Implement logic to handle player being kicked (e.g., show message, disconnect)
          // Example:
          // setError("You have been kicked from the game by the host.");
          // setUiState("ERROR"); // or a specific "KICKED" state
          // disconnectWebSocket();
        }
        else {
          console.log(`[PlayerPage WS Handler] Received unhandled data type ID: ${dataTypeId}`, parsedContent);
        }
      } else {
        console.warn("[PlayerPage WS Handler] Received message content is not a string:", content);
      }
    } catch (e) {
      console.error('[PlayerPage WS Handler] Failed to parse or process message body:', e, message.body);
    }
  }, [_setCurrentBlock, _setCurrentResult]);

  const {
    connect: connectWebSocket, disconnect: disconnectWebSocket, joinGame, sendAnswer, sendAvatarUpdate,
    connectionStatus: wsConnectionStatus, error: wsError, playerClientId,
  } = usePlayerWebSocket({ onMessageReceived: handleReceivedMessageCallback });


  const handleResetAndGoToPinInput = useCallback(() => {
    disconnectWebSocket();
    _resetGameState();
    setGamePin('');
    setNickname('');
    setPageError(null);
    setUiState('PIN_INPUT');
  }, [disconnectWebSocket, _resetGameState]);


  useEffect(() => {
    setPageError(wsError);
    switch (wsConnectionStatus) {
      case 'CONNECTING': setUiState('CONNECTING'); break;
      case 'NICKNAME_INPUT': if (!joinAttempted && uiState !== 'PLAYING') setUiState('NICKNAME_INPUT'); break;
      case 'CONNECTED': if (uiState !== 'PLAYING' && uiState !== 'NICKNAME_INPUT' && !joinAttempted) setUiState('NICKNAME_INPUT'); break;
      case 'DISCONNECTED': if (uiState !== 'PIN_INPUT' && uiState !== 'ERROR') { setUiState('DISCONNECTED'); setJoinAttempted(false); } break;
      case 'ERROR': setUiState('ERROR'); setJoinAttempted(false); break;

      case 'INITIAL': if (uiState !== 'PIN_INPUT') handleResetAndGoToPinInput(); break;

    }
  }, [wsConnectionStatus, wsError, uiState, joinAttempted, handleResetAndGoToPinInput]); // Added handleResetAndGoToPinInput


  useEffect(() => {
    if (playerClientId) setPlayerInfo(prev => ({ ...prev, cid: playerClientId }));
  }, [playerClientId]);


  const handlePinSubmit = () => {
    const pinRegex = /^\d{6,7}$/;

    if (!pinRegex.test(gamePin)) { setPageError("Please enter a valid 6 or 7 digit Game PIN."); setUiState('PIN_INPUT'); return; }

    setPageError(null);

    setJoinAttempted(false);
    connectWebSocket(gamePin);
  };

  // *** Define the handler function for avatar selection ***
  const handleAvatarSelected = useCallback((avatarId: string | null) => {
    setPlayerInfo(prev => ({ ...prev, avatarId: avatarId }));

    // Send update ONLY if an avatarId exists, we are connected, and already in the 'PLAYING' state (lobby or later)
    if (avatarId && gamePin && playerClientId && uiState === 'PLAYING') {
      console.log(`[PlayerPage] Sending avatar update to host. AvatarID: ${avatarId}`);
      sendAvatarUpdate(avatarId, gamePin);
    } else {
      // console.log("[PlayerPage] Avatar selected, but not sending update (State:", uiState, "Pin:", !!gamePin, "CID:", !!playerClientId, ")");
    }
  }, [gamePin, playerClientId, uiState, sendAvatarUpdate]); // No dependencies needed if setPlayerInfo is stable

  const handleNicknameSubmitClick = async () => {
    setPageError(null);
    setJoinAttempted(true);

    // Pass nickname AND the currently stored avatarId to joinGame
    // We'll modify joinGame in Stage 3 to accept and use the avatarId
    const success = await joinGame(nickname, gamePin, playerInfo.avatarId);

    if (success) {
      setPlayerInfo(prev => ({ ...prev, name: nickname.trim() })); // Keep avatarId already set

      // Don't reset game state here fully, just blocks/results if needed
      // _resetGameState(); // Keep playerInfo (including avatarId)
      setCurrentBlock(null);
      setCurrentResult(null);
      setIsSubmitting(false);

      setUiState('PLAYING');

      setUiState('PLAYING');
    } else {
      setJoinAttempted(false);

    }
    return success;

  };

  const handleAnswerSubmitClick = (answerDetailPayload: PlayerAnswerPayload) => {
    if (!gamePin) return;
    setIsSubmitting(true);

    sendAnswer(answerDetailPayload, gamePin);

  };

  const handleSimulatedMessageFromDevControls = useCallback((mockMessage: MockWebSocketMessage) => {
    console.log("[PlayerPage] Received simulated message from DevControls:", mockMessage);
    const partialIMessage: Partial<IMessage> & { body: string, headers: { destination: string } } = {
      body: JSON.stringify([mockMessage]),
      headers: { destination: mockMessage.channel || `/topic/player/${gamePin || 'unknown'}` },
      ack: () => { }, nack: () => { }, command: 'MESSAGE', binaryBody: new Uint8Array()

    };
    handleReceivedMessageCallback(partialIMessage as IMessage);

  }, [handleReceivedMessageCallback, gamePin]);

  // *** Calculate Avatar URL using useMemo ***
  const selectedAvatarUrl = useMemo(() => {
    if (assetsLoading || assetsError || !playerInfo.avatarId || !avatars) {
      return null; // Return null if loading, errored, no ID selected, or avatars not loaded
    }
    const foundAvatar = avatars.find(a => a.avatar_id === playerInfo.avatarId);
    return foundAvatar?.image_file_path ?? null; // Return path or null if not found
  }, [playerInfo.avatarId, avatars, assetsLoading, assetsError]);

  const renderPageContent = () => {
    switch (uiState) {
      case 'PIN_INPUT':
        return <PinInputForm
          gamePin={gamePin}
          onGamePinChange={setGamePin}
          onSubmit={handlePinSubmit}
          errorMessage={pageError}

          isConnecting={wsConnectionStatus === 'CONNECTING'}

        />;

      case 'CONNECTING':
        return <ConnectingPlayerView message={`Connecting to game ${gamePin}...`} />;

      case 'NICKNAME_INPUT':
        return <NicknameInputForm
          gamePin={gamePin}
          nickname={nickname}
          onNicknameChange={setNickname}
          onSubmit={handleNicknameSubmitClick}
          errorMessage={pageError}
          // *** Pass the handler function down ***
          onAvatarSelected={handleAvatarSelected}
        />;

      case 'PLAYING':
        // Construct minimal player info for status bar
        const playerInfoForStatusBar = {
          name: playerInfo.name,
          avatarUrl: selectedAvatarUrl,
          avatarId: playerInfo.avatarId,
          score: playerInfo.totalScore, // Use state value
          rank: playerInfo.rank,        // Use state value
        };

        return <PlayerGameScreen
          currentBlock={currentBlock}
          currentResult={currentResult}
          isSubmitting={isSubmitting}
          playerInfoForStatusBar={playerInfoForStatusBar}
          onSubmitAnswer={handleAnswerSubmitClick}
          handleSimulatedMessage={handleSimulatedMessageFromDevControls}
          currentBackgroundId={currentBackgroundId}
          // --- Pass avatars and handler down ---
          avatars={avatars} // Pass the full list
          onAvatarChange={handleAvatarSelected} // Pass the callback

        />;

      case 'DISCONNECTED':
        return <DisconnectedPlayerView errorMessage={pageError} onJoinNewGame={handleResetAndGoToPinInput} />;

      case 'ERROR':
        return <ErrorPlayerView errorMessage={pageError} onRetry={handleResetAndGoToPinInput} />;

      default:
        console.error("Reached default case in renderPageContent, UI state:", uiState);

        return <ErrorPlayerView errorMessage="An unexpected error occurred." onRetry={handleResetAndGoToPinInput} />;
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