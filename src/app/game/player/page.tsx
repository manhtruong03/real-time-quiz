// src/app/game/player/page.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { IMessage } from '@stomp/stompjs';
// Adjust type imports if paths changed
import { GameBlock, PlayerAnswerPayload, QuestionResultPayload, LivePlayerState } from '@/src/lib/types';
import { usePlayerWebSocket, PlayerConnectionStatus } from '@/src/hooks/game/usePlayerWebSocket';
import { GameAssetsProvider } from '@/src/context/GameAssetsContext';
import { MockWebSocketMessage } from '@/src/components/game/DevMockControls'; // Keep for Dev mode

// --- Import NEW UI State Components ---
import { PinInputForm } from '@/src/components/game/player/PinInputForm';
import { NicknameInputForm } from '@/src/components/game/player/NicknameInputForm';
import { ConnectingPlayerView } from '@/src/components/game/player/ConnectingPlayerView';
import { PlayerGameScreen } from '@/src/components/game/player/PlayerGameScreen';
import { DisconnectedPlayerView } from '@/src/components/game/player/DisconnectedPlayerView';
import { ErrorPlayerView } from '@/src/components/game/player/ErrorPlayerView';
// --- END Import ---

// Minimal player state needed for the page itself (most is in hook or PlayerView)
interface MinimalPlayerInfo {
  cid: string | null;
  name: string;
}

type PageUiState = 'PIN_INPUT' | 'CONNECTING' | 'NICKNAME_INPUT' | 'PLAYING' | 'DISCONNECTED' | 'ERROR';

function PlayerPageInternal() { // Renamed inner component
  const [uiState, setUiState] = useState<PageUiState>('PIN_INPUT');
  const [gamePin, setGamePin] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [pageError, setPageError] = useState<string | null>(null);

  // State managed by the page, passed down to PlayerGameScreen/PlayerView
  const [currentBlock, setCurrentBlock] = useState<GameBlock | null>(null);
  const [currentResult, setCurrentResult] = useState<QuestionResultPayload | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Track if player submitted an answer
  const [playerInfo, setPlayerInfo] = useState<MinimalPlayerInfo>({ cid: null, name: '' });

  const [joinAttempted, setJoinAttempted] = useState(false); // Track if join was attempted

  const [currentBackgroundId, setCurrentBackgroundId] = useState<string | null>(null);

  // Internal state update functions
  const _setCurrentBlock = useCallback((block: GameBlock | null) => {
    setCurrentResult(null);
    setIsSubmitting(false);
    setCurrentBlock(block);
    // Decide if background resets on new block: Let's keep the host-selected one for now.
    // setCurrentBackgroundId(null);
  }, []);

  const _setCurrentResult = useCallback((result: QuestionResultPayload | null) => {
    setCurrentBlock(null);
    setIsSubmitting(false);
    setCurrentResult(result);
    // Decide if background resets after result: Let's keep the host-selected one for now.
    // setCurrentBackgroundId(null);
  }, []);

  const _resetGameState = useCallback(() => {
    setCurrentBlock(null);
    setCurrentResult(null);
    setIsSubmitting(false);
    setJoinAttempted(false);
    setCurrentBackgroundId(null); // Reset background on full game reset
  }, []);


  // Step 2.2: Handle Incoming Background Message (Player)
  const handleReceivedMessageCallback = useCallback((message: IMessage) => {
    let parsedBody;
    try {
      parsedBody = JSON.parse(message.body);
      // Messages are often wrapped in an array
      const messageData = Array.isArray(parsedBody) ? parsedBody[0] : parsedBody;

      if (!messageData || !messageData.data) {
        console.warn('[PlayerPage WS Handler] Received message without data field:', messageData);
        return;
      }

      // Ignore private messages directed elsewhere for now
      if (message.headers.destination?.includes('/private')) {
        // console.log('[PlayerPage WS Handler] Ignoring private message for now.');
        return;
      }

      const { id: dataTypeId, content } = messageData.data;
      console.log(`[PlayerPage WS Handler] Received message with data.id: ${dataTypeId}`);

      if (typeof content === 'string') {
        const parsedContent = JSON.parse(content);

        // --- Message Routing ---
        if (dataTypeId === 1 || dataTypeId === 2) { // Question data (Get Ready or Show)
          console.log("[PlayerPage WS Handler] Processing Question Block:", parsedContent.type, `(Index: ${parsedContent.gameBlockIndex})`);
          _setCurrentBlock(parsedContent as GameBlock);
          // Optional: Reset background here if you want questions to have default background initially
          // setCurrentBackgroundId(null);
        } else if (dataTypeId === 8 || dataTypeId === 13) { // Result or Podium data
          console.log("[PlayerPage WS Handler] Processing Result/Podium:", parsedContent.type, `(Index: ${parsedContent.pointsData?.lastGameBlockIndex})`);
          _setCurrentResult(parsedContent as QuestionResultPayload);
          // Optional: Reset background here
          // setCurrentBackgroundId(null);
        } else if (dataTypeId === 35) { // <<<--- Host Background Change Message ID
          console.log("[PlayerPage WS Handler] Processing Background Change message");
          const newBackgroundId = parsedContent?.background?.id;
          if (typeof newBackgroundId === 'string' && newBackgroundId) {
            console.log(`[PlayerPage WS Handler] Setting background ID to: ${newBackgroundId}`);
            setCurrentBackgroundId(newBackgroundId); // Update state with the new ID
          } else {
            console.warn("[PlayerPage WS Handler] Received background change message but ID was missing or invalid:", parsedContent);
          }
        } else {
          console.log(`[PlayerPage WS Handler] Received unhandled data type ID: ${dataTypeId}`, parsedContent);
        }
        // --- End Message Routing ---

      } else {
        console.warn("[PlayerPage WS Handler] Received message content is not a string:", content);
      }
    } catch (e) {
      console.error('[PlayerPage WS Handler] Failed to parse or process message body:', e, message.body);
    }
  }, [_setCurrentBlock, _setCurrentResult]); // Dependencies for internal setters

  const {
    connect: connectWebSocket, disconnect: disconnectWebSocket, joinGame, sendAnswer,
    connectionStatus: wsConnectionStatus, error: wsError, playerClientId,
  } = usePlayerWebSocket({ onMessageReceived: handleReceivedMessageCallback });

  // Sync UI state with WebSocket status
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
  }, [wsConnectionStatus, wsError, uiState, joinAttempted]); // Added handleResetAndGoToPinInput to dependencies

  // Update playerInfo CID
  useEffect(() => {
    if (playerClientId) setPlayerInfo(prev => ({ ...prev, cid: playerClientId }));
  }, [playerClientId]);

  // Action Handlers
  const handlePinSubmit = () => {
    const pinRegex = /^\d{6,7}$/;
    if (!pinRegex.test(gamePin)) { setPageError("Please enter a valid 6 or 7 digit Game PIN."); setUiState('PIN_INPUT'); return; }
    setPageError(null);
    setJoinAttempted(false);
    connectWebSocket(gamePin);
  };

  const handleNicknameSubmitClick = async () => {
    setPageError(null);
    setJoinAttempted(true);
    const success = await joinGame(nickname, gamePin); // joinGame is now async
    if (success) {
      setPlayerInfo(prev => ({ ...prev, name: nickname.trim() }));
      _resetGameState();
      setUiState('PLAYING'); // Transition state only on successful send
    } else {
      setJoinAttempted(false); // Allow retry if joinGame failed
      // UI state will likely transition to ERROR via the useEffect hook listening to wsError
    }
    return success; // Return success status for the form component
  };

  const handleAnswerSubmitClick = (answerDetailPayload: PlayerAnswerPayload) => {
    if (!gamePin) return;
    setIsSubmitting(true); // Set submitting state
    sendAnswer(answerDetailPayload, gamePin);
    // We don't clear the block here, wait for result message
  };

  const handleResetAndGoToPinInput = useCallback(() => {
    disconnectWebSocket();
    _resetGameState();
    setGamePin('');
    setNickname('');
    setPageError(null);
    setUiState('PIN_INPUT');
  }, [disconnectWebSocket, _resetGameState]); // Add dependencies

  // Dev Controls simulation handler
  const handleSimulatedMessageFromDevControls = useCallback((mockMessage: MockWebSocketMessage) => {
    // --- Simulation logic remains the same ---
    console.log("[PlayerPage] Received simulated message from DevControls:", mockMessage);
    const partialIMessage: Partial<IMessage> & { body: string, headers: { destination: string } } = {
      body: JSON.stringify([mockMessage]),
      headers: { destination: mockMessage.channel || `/topic/player/${gamePin || 'unknown'}` },
      ack: () => { }, nack: () => { }, command: 'MESSAGE', binaryBody: new Uint8Array()
    };
    handleReceivedMessageCallback(partialIMessage as IMessage);
  }, [handleReceivedMessageCallback, gamePin]);

  // Step 2.3 (Part 1): Pass prop in render function
  const renderPageContent = () => {
    switch (uiState) {
      // ... cases for PIN_INPUT, CONNECTING, NICKNAME_INPUT, DISCONNECTED, ERROR ...
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
          onSubmit={handleNicknameSubmitClick} // Pass the async handler
          errorMessage={pageError}
        />;
      case 'PLAYING':
        // Create a minimal LivePlayerState for PlayerGameScreen based on page state
        const livePlayerInfo: LivePlayerState = {
          cid: playerInfo.cid || 'temp-id', // Use temporary if null, should be set by hook though
          nickname: playerInfo.name,
          avatar: null, // Page doesn't manage avatar details directly
          isConnected: true, // Assume connected if in PLAYING state
          joinedAt: Date.now(), // Placeholder, actual join time managed elsewhere
          lastActivityAt: Date.now(),
          playerStatus: 'PLAYING',
          totalScore: 0, // Score/Rank will be displayed via feedbackPayload in PlayerView
          rank: 0,
          currentStreak: 0, // Let PlayerView handle display based on feedback
          maxStreak: 0,
          lastAnswerTimestamp: null,
          answers: [], // Page doesn't hold full answer history
          correctCount: 0,
          incorrectCount: 0,
          unansweredCount: 0,
          answersCount: 0,
          totalReactionTimeMs: 0
        };
        return <PlayerGameScreen
          currentBlock={currentBlock}
          currentResult={currentResult}
          isSubmitting={isSubmitting}
          playerInfo={livePlayerInfo} // Pass the constructed state
          onSubmitAnswer={handleAnswerSubmitClick}
          handleSimulatedMessage={handleSimulatedMessageFromDevControls}
          currentBackgroundId={currentBackgroundId}
        />;
      case 'DISCONNECTED':
        return <DisconnectedPlayerView errorMessage={pageError} onJoinNewGame={handleResetAndGoToPinInput} />;
      case 'ERROR':
        return <ErrorPlayerView errorMessage={pageError} onRetry={handleResetAndGoToPinInput} />;
      default:
        console.error("Reached default case in renderPageContent, UI state:", uiState);
        return <ErrorPlayerView errorMessage="An unexpected error occurred." onRetry={handleResetAndGoToPinInput} />;
    }
  }; // End of renderPageContent

  return renderPageContent();

} // End of PlayerPageInternal

// Wrap the internal component with the context provider
export default function PlayerPage() {
  return (
    <GameAssetsProvider>
      <PlayerPageInternal />
    </GameAssetsProvider>
  );
}