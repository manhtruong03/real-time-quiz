// src/app/game/player/page.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { IMessage } from '@stomp/stompjs';

import PlayerView from '@/src/components/game/views/PlayerView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Loader2, WifiOff, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { GameBlock, PlayerAnswerPayload, QuestionResultPayload, isContentBlock } from '@/src/lib/types';
import { cn } from '@/src/lib/utils';
import DevMockControls, { MockWebSocketMessage } from '@/src/components/game/DevMockControls';
import { usePlayerWebSocket, PlayerConnectionStatus } from '@/src/hooks/game/usePlayerWebSocket';

interface PlayerInfoState {
  name: string;
  avatarUrl?: string;
  score: number;
  rank?: number;
  cid?: string | null;
}

// Page UI State (Removed JOINING and WAITING_FOR_GAME)
type PageUiState = 'PIN_INPUT' | 'CONNECTING' | 'NICKNAME_INPUT' | 'PLAYING' | 'DISCONNECTED' | 'ERROR';

export default function PlayerPage() {
  const [uiState, setUiState] = useState<PageUiState>('PIN_INPUT');
  const [gamePin, setGamePin] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [pageError, setPageError] = useState<string | null>(null);
  const [currentBlock, setCurrentBlock] = useState<GameBlock | null>(null);
  const [currentResult, setCurrentResult] = useState<QuestionResultPayload | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playerInfo, setPlayerInfo] = useState<PlayerInfoState>({
    name: '', score: 0, rank: undefined, avatarUrl: undefined, cid: null,
  });
  // Track if join was attempted to prevent accidental transitions
  const [joinAttempted, setJoinAttempted] = useState(false);

  // Internal state update functions (no change needed)
  const _setCurrentBlock = useCallback((block: GameBlock | null) => {
    // console.log("[PlayerPage] Setting block:", block?.type, "Index:", block?.gameBlockIndex);
    setCurrentResult(null);
    setIsSubmitting(false);
    setCurrentBlock(block);
  }, []);

  const _setCurrentResult = useCallback((result: QuestionResultPayload | null) => {
    // console.log("[PlayerPage] Setting result:", result?.type);
    setCurrentBlock(null);
    setIsSubmitting(false);
    setCurrentResult(result);
    if (result) {
      setPlayerInfo(prev => ({
        ...prev,
        score: result.totalScore,
        rank: result.rank,
      }));
    }
  }, []);

  const _resetGameState = useCallback(() => {
    // console.log("[PlayerPage] Resetting internal game state.");
    setCurrentBlock(null);
    setCurrentResult(null);
    setIsSubmitting(false);
    setPlayerInfo(prev => ({ ...prev, score: 0, rank: undefined }));
    setJoinAttempted(false); // Reset join attempt flag
  }, []);

  // WebSocket Hook message handler (no change needed)
  const handleReceivedMessageCallback = useCallback((message: IMessage) => {
    // ... (message handling logic remains the same as previous version) ...
    // console.log(`[PlayerPage] <<< Hook delivered message on ${message.headers.destination}:`);
    let parsedBody;
    try {
      parsedBody = JSON.parse(message.body);
      const messageData = Array.isArray(parsedBody) ? parsedBody[0] : parsedBody;

      if (!messageData || !messageData.data) {
        return;
      }

      const { id: dataTypeId, content, type: messageType } = messageData.data;

      if (message.headers.destination?.includes('/private')) {
        return;
      }

      if (typeof content === 'string') {
        const parsedContent = JSON.parse(content);
        // console.log(`[PlayerPage] Processing data.id=${dataTypeId}, Content Type=${parsedContent?.type}`);

        if (dataTypeId === 1 || dataTypeId === 2) { // Question data
          // console.log(`[PlayerPage] Calling _setCurrentBlock for index: ${parsedContent?.gameBlockIndex}`);
          _setCurrentBlock(parsedContent as GameBlock);
        } else if (dataTypeId === 8) { // Result data
          // console.log(`[PlayerPage] Calling _setCurrentResult for index: ${parsedContent?.pointsData?.lastGameBlockIndex}`);
          _setCurrentResult(parsedContent as QuestionResultPayload);
        } else if (dataTypeId === 13) { // Game End / Podium
          console.log('[PlayerPage] Received Game End / Podium signal.');
          _setCurrentResult(parsedContent as QuestionResultPayload);
        }
      }

    } catch (e) {
      console.error('[PlayerPage] Failed to parse or process message body:', e, message.body);
    }
  }, [_setCurrentBlock, _setCurrentResult]);

  const {
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
    joinGame,
    sendAnswer,
    connectionStatus: wsConnectionStatus,
    error: wsError,
    playerClientId,
  } = usePlayerWebSocket({
    onMessageReceived: handleReceivedMessageCallback,
  });

  // Revised UI State Sync Effect
  useEffect(() => {
    setPageError(wsError); // Always reflect WS errors

    switch (wsConnectionStatus) {
      case 'CONNECTING':
        setUiState('CONNECTING');
        break;
      case 'NICKNAME_INPUT':
        // Only go to nickname input if we haven't already attempted to join and aren't playing
        if (!joinAttempted && uiState !== 'PLAYING') {
          setUiState('NICKNAME_INPUT');
        }
        break;
      // Removed JOINING case - managed by action handler
      case 'CONNECTED':
        // If WS is connected, but UI isn't PLAYING, stay in NICKNAME_INPUT
        // The transition to PLAYING happens explicitly after joinGame succeeds.
        if (uiState !== 'PLAYING' && uiState !== 'NICKNAME_INPUT') {
          // If we got here unexpectedly (e.g. after error/disconnect), go back to nickname input
          if (!joinAttempted) { // Make sure join wasn't already done
            setUiState('NICKNAME_INPUT');
          }
        }
        break;
      case 'DISCONNECTED':
        if (uiState !== 'PIN_INPUT' && uiState !== 'ERROR') {
          setUiState('DISCONNECTED');
          setJoinAttempted(false); // Allow re-joining
        }
        break;
      case 'ERROR':
        setUiState('ERROR');
        setJoinAttempted(false); // Allow retry
        break;
      case 'INITIAL':
        if (uiState !== 'PIN_INPUT') {
          handleResetAndGoToPinInput();
        }
        break;
    }
  }, [wsConnectionStatus, wsError, uiState, joinAttempted]); // Added joinAttempted

  // Update playerInfo CID
  useEffect(() => {
    if (playerClientId) {
      setPlayerInfo(prev => ({ ...prev, cid: playerClientId }));
    }
  }, [playerClientId]);

  // Action Handlers
  const handlePinSubmit = () => {
    // ... (validation) ...
    const pinRegex = /^\d{6,7}$/;
    if (!pinRegex.test(gamePin)) {
      setPageError("Please enter a valid 6 or 7 digit Game PIN.");
      setUiState('PIN_INPUT'); return;
    }
    setPageError(null);
    setJoinAttempted(false); // Reset join attempt before connecting
    connectWebSocket(gamePin);
  };

  const handleNicknameSubmitClick = async () => {
    setPageError(null);
    setJoinAttempted(true); // Mark that join is being attempted

    // *** Show a temporary loading state within the button if desired ***
    // setUiState('JOINING'); // Or manage a separate loading state for the button

    const success = await joinGame(nickname, gamePin);

    if (success) {
      console.log("[PlayerPage] Join message sent successfully. Transitioning to PLAYING state.");
      setPlayerInfo(prev => ({ ...prev, name: nickname.trim() }));
      _resetGameState(); // Reset scores etc.
      setUiState('PLAYING'); // <<< Directly transition to PLAYING state
    } else {
      // Error should be set by the hook, useEffect handles uiState = 'ERROR'
      setJoinAttempted(false); // Allow retry on failure
      // setUiState('NICKNAME_INPUT'); // Optionally revert UI if needed, but ERROR state is better
    }
  };

  const handleAnswerSubmitClick = (answerDetailPayload: PlayerAnswerPayload) => {
    // ... (validation) ...
    if (!gamePin) { return; }
    setIsSubmitting(true);
    sendAnswer(answerDetailPayload, gamePin);
  };

  const handleResetAndGoToPinInput = useCallback(() => {
    disconnectWebSocket();
    _resetGameState(); // This now also resets joinAttempted
    setGamePin('');
    setNickname('');
    setPageError(null);
    setUiState('PIN_INPUT');
  }, [disconnectWebSocket, _resetGameState]);


  // Dev Controls (no change)
  const handleSimulatedMessageFromDevControls = useCallback((mockMessage: MockWebSocketMessage) => {
    // ... (simulation logic) ...
    console.log("[PlayerPage] Received simulated message from DevControls:", mockMessage);
    const partialIMessage: Partial<IMessage> & { body: string, headers: { destination: string } } = {
      body: JSON.stringify([mockMessage]),
      headers: { destination: mockMessage.channel || `/topic/player/${gamePin || 'unknown'}` },
      ack: () => { }, nack: () => { }, command: 'MESSAGE', binaryBody: new Uint8Array()
    };
    handleReceivedMessageCallback(partialIMessage as IMessage);
  }, [handleReceivedMessageCallback, gamePin]);

  // Render Functions (Remove renderJoining, renderWaitingForGame)
  const renderPinInput = () => ( /* ... */
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Join Game</CardTitle>
          <CardDescription className="text-center text-muted-foreground">Enter the 6 or 7 digit PIN.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="number" placeholder="Game PIN" value={gamePin}
            onChange={(e) => setGamePin(e.target.value.replace(/[^0-9]/g, '').slice(0, 7))}
            className="text-center text-2xl h-14 tracking-widest" maxLength={7} aria-label="Game PIN"
          />
          {pageError && <p className="text-sm text-red-600 dark:text-red-400 text-center">{pageError}</p>}
          <Button onClick={handlePinSubmit} className="w-full" size="lg" disabled={uiState === 'CONNECTING'}>
            {uiState === 'CONNECTING' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
            {uiState === 'CONNECTING' ? 'Connecting...' : 'Enter'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
  const renderNicknameInput = () => ( /* ... */
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900 dark:to-teal-900">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Enter Nickname</CardTitle>
          <CardDescription className="text-center text-muted-foreground">Game PIN: {gamePin}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="text" placeholder="Your Nickname" value={nickname}
            onChange={(e) => setNickname(e.target.value)} maxLength={25}
            className="text-center text-lg h-12" aria-label="Nickname"
          />
          {pageError && <p className="text-sm text-red-600 dark:text-red-400 text-center">{pageError}</p>}
          {/* Consider adding a local loading state for the button itself during the async call */}
          <Button onClick={handleNicknameSubmitClick} className="w-full" size="lg" >
            <UserPlus className="mr-2 h-5 w-5" />
            Join Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
  const renderConnecting = () => ( /* ... */
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground text-center">Connecting to game {gamePin}...</p>
    </div>
  );
  // Removed renderJoining
  // Removed renderWaitingForGame
  const renderDisconnected = () => ( /* ... */
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <WifiOff className="h-12 w-12 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold mb-2">Disconnected</h2>
      <p className="text-muted-foreground mb-4">{pageError || "Connection lost. Please try joining again."}</p>
      <Button onClick={handleResetAndGoToPinInput}>Join New Game</Button>
    </div>
  );
  const renderError = () => ( /* ... */
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-xl font-semibold text-destructive mb-2">Error</h2>
      <p className="text-muted-foreground mb-4">{pageError || "An unknown error occurred."}</p>
      <Button onClick={handleResetAndGoToPinInput}>Try Again</Button>
    </div>
  );


  // Main Render Logic
  switch (uiState) {
    case 'PIN_INPUT': return renderPinInput();
    case 'CONNECTING': return renderConnecting();
    case 'NICKNAME_INPUT': return renderNicknameInput();
    // Removed JOINING case
    case 'PLAYING':
      const derivedIsWaiting = !currentBlock && !currentResult && !isSubmitting;
      return (
        <>
          <PlayerView
            questionData={currentBlock}
            feedbackPayload={currentResult}
            onSubmitAnswer={handleAnswerSubmitClick}
            isWaiting={derivedIsWaiting}
            isSubmitting={isSubmitting}
            playerInfo={playerInfo}
          />
          <DevMockControls
            simulateReceiveMessage={handleSimulatedMessageFromDevControls}
            loadMockBlock={() => { }}
            setMockResult={() => { }}
          />
        </>
      );
    case 'DISCONNECTED': return renderDisconnected();
    case 'ERROR': return renderError();
    default:
      // Default to error state if something unexpected happens
      return renderError();
  }
}