// src/app/game/player/page.tsx
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Client, IFrame, IMessage } from '@stomp/stompjs';

import PlayerView from '@/src/components/game/views/PlayerView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Loader2, WifiOff, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { GameBlock, PlayerAnswerPayload, QuestionResultPayload, isContentBlock } from '@/src/lib/types';
import { cn } from '@/src/lib/utils';
import DevMockControls, { MockWebSocketMessage } from '@/src/components/game/DevMockControls'; //


// --- Constants ---
const WEBSOCKET_URL = 'ws://localhost:8080/ws-quiz';
const APP_PREFIX = '/app';
const TOPIC_PREFIX = '/topic';
const USER_QUEUE_PREFIX = '/user/queue';

interface PlayerInfoState {
  name: string;
  avatarUrl?: string;
  score: number;
  rank?: number;
  cid?: string; // Client ID assigned by STOMP/backend
}

type UiStateType = 'PIN_INPUT' | 'CONNECTING' | 'NICKNAME_INPUT' | 'JOINING' | 'PLAYING' | 'DISCONNECTED' | 'ERROR';

export default function PlayerPage() {
  // === UI and Connection State ===
  const [uiState, setUiState] = useState<UiStateType>('PIN_INPUT');
  const [gamePin, setGamePin] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // === Game State ===
  const [currentBlock, setCurrentBlock] = useState<GameBlock | null>(null);
  const [currentResult, setCurrentResult] = useState<QuestionResultPayload | null>(null);
  const [isWaiting, setIsWaiting] = useState(true); // Waiting for question/result
  const [isSubmitting, setIsSubmitting] = useState(false); // Waiting for server ack after sending answer

  // === Player State ===
  const [playerInfo, setPlayerInfo] = useState<PlayerInfoState>({
    name: '', // Start empty, set after joining
    score: 0,
    rank: undefined,
    avatarUrl: undefined,
    cid: undefined, // Set from STOMP connection
  });

  // === WebSocket Refs ===
  const stompClientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<{ [key: string]: any }>({});

  // --- Logging Helper ---
  const logMessage = (level: 'info' | 'warn' | 'error', ...args: any[]) => {
    const timestamp = new Date().toLocaleTimeString();
    console[level](`[PlayerPage ${timestamp}]`, ...args);
  };


  // --- Internal State Update Functions ---
  const _setCurrentBlock = useCallback((block: GameBlock | null) => {
    logMessage('info', "Setting block:", block?.type, "Index:", block?.gameBlockIndex);
    setCurrentResult(null);
    setIsWaiting(false);
    setIsSubmitting(false);
    setCurrentBlock(block);
  }, []);

  const _setCurrentResult = useCallback((result: QuestionResultPayload | null) => {
    logMessage('info', "Setting result:", result?.type);
    setCurrentBlock(null);
    setIsSubmitting(false);
    setCurrentResult(result);
    if (result) {
      setPlayerInfo(prev => ({
        ...prev,
        score: result.totalScore,
        rank: result.rank,
      }));
      setIsWaiting(true);
    } else {
      setIsWaiting(true);
      logMessage('info', "Clearing result, setting to waiting.");
    }
  }, []);

  const _resetGameState = () => {
    logMessage('info', "Resetting game state.");
    setCurrentBlock(null);
    setCurrentResult(null);
    setIsWaiting(true);
    setIsSubmitting(false);
    setPlayerInfo(prev => ({ ...prev, score: 0, rank: undefined }));
  }

  // --- WebSocket Message Handling (Receives IMessage from STOMP) ---
  const handleReceivedMessage = useCallback((message: IMessage) => {
    logMessage('info', `<<< Message received on ${message.headers.destination}:`);
    let parsedBody;
    try {
      parsedBody = JSON.parse(message.body);
      const messageData = Array.isArray(parsedBody) ? parsedBody[0] : parsedBody;
      logMessage('info', 'Parsed body:', messageData);

      if (!messageData || !messageData.data) {
        logMessage('warn', "Received message without 'data' field:", messageData);
        return;
      }

      const { id: dataTypeId, content, type: messageType } = messageData.data;

      if (message.headers.destination?.includes('/private')) {
        if (messageData.type === 'PLAYER_ASSIGNED') {
          logMessage('info', '*** Confirmed as PLAYER ***');
        }
        return;
      }

      if (typeof content !== 'string') {
        if (messageType === 'GAME_START' && dataTypeId === 9) {
          logMessage('info', 'Game starting signal received!');
          setUiState('PLAYING');
          _resetGameState();
          setIsWaiting(true);
        } else {
          logMessage('warn', "Message content is not a string and not a known direct type:", messageData.data);
        }
        return;
      }

      const parsedContent = JSON.parse(content);
      logMessage('info', `Processing data.id=${dataTypeId}, Type=${messageType || 'N/A'}`);

      if (dataTypeId === 1 || dataTypeId === 2) {
        logMessage('info', `Received Question Block (Type: ${dataTypeId}) - Index: ${parsedContent?.gameBlockIndex}`);
        _setCurrentBlock(parsedContent as GameBlock);
      } else if (dataTypeId === 8) {
        logMessage('info', `Received Result - Index: ${parsedContent?.pointsData?.lastGameBlockIndex}`);
        _setCurrentResult(parsedContent as QuestionResultPayload);
      } else if (dataTypeId === 9) {
        logMessage('info', 'Received Game Start / Blocks Overview signal.');
        setUiState('PLAYING');
        _resetGameState();
        setIsWaiting(true);
      } else if (dataTypeId === 13) {
        logMessage('info', 'Received Game End / Podium signal.');
        _setCurrentResult(parsedContent as QuestionResultPayload);
        setTimeout(() => {
          logMessage('info', 'Game ended, returning to PIN input.');
          disconnectWebSocket();
          setUiState('PIN_INPUT');
        }, 10000);
      }
      else {
        logMessage('warn', `Received message with unhandled data.id: ${dataTypeId}`, parsedContent);
      }

    } catch (e) {
      logMessage('error', 'Failed to parse or process message body:', e, message.body);
      return;
    }

  }, [_setCurrentBlock, _setCurrentResult]); // Added disconnectWebSocket dependency


  // --- *** NEW: Wrapper for DevMockControls *** ---
  const handleSimulatedMessageFromDevControls = useCallback((mockMessage: MockWebSocketMessage) => {
    logMessage('info', "Received simulated message from DevControls:", mockMessage);
    // Reconstruct a partial IMessage-like object that handleReceivedMessage expects
    // Primarily need 'body' and 'headers.destination'
    const partialIMessage: Partial<IMessage> & { body: string, headers: { destination: string } } = {
      body: JSON.stringify([mockMessage]), // Wrap in array like real messages
      headers: {
        destination: mockMessage.channel || `${TOPIC_PREFIX}/player/${gamePin || 'unknown'}` // Simulate destination
      },
      // Add dummy ack/nack if needed, though handleReceivedMessage doesn't use them
      ack: () => { },
      nack: () => { },
      command: 'MESSAGE', // Simulate command
      binaryBody: new Uint8Array() // Add missing properties with dummy values
    };
    // Call the actual handler with the simulated IMessage
    handleReceivedMessage(partialIMessage as IMessage);
  }, [handleReceivedMessage, gamePin]); // Add dependencies


  // --- WebSocket Connection Logic ---
  const connectWebSocket = useCallback((pin: string) => {
    // ... (connection logic remains the same, uses handleReceivedMessage for real messages) ...
    if (!pin) {
      setConnectionError("Game PIN cannot be empty.");
      setUiState('ERROR');
      return;
    }
    if (stompClientRef.current?.active) {
      logMessage('warn', 'WS already connected.');
      return;
    }
    logMessage('info', `Attempting WebSocket connection for game pin ${pin}...`);
    setUiState('CONNECTING');
    setConnectionError(null);

    const client = new Client({
      brokerURL: WEBSOCKET_URL,
      debug: (str) => { /* console.log("STOMP DEBUG:", str); */ },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: (frame: IFrame) => {
        const connectedClientId = frame.headers['user-name'] || `player_${Date.now().toString().slice(-6)}`;
        setPlayerInfo(prev => ({ ...prev, cid: connectedClientId }));
        logMessage('info', `WebSocket Connected! Client ID: ${connectedClientId}`);

        const playerTopic = `${TOPIC_PREFIX}/player/${pin}`;
        const privateTopic = `${USER_QUEUE_PREFIX}/private`;

        logMessage('info', `Subscribing to ${playerTopic} and ${privateTopic}`);
        try {
          if (!client.active) {
            logMessage('warn', 'Client deactivated before subscriptions could be made.');
            throw new Error("Client deactivated");
          }
          subscriptionsRef.current[playerTopic] = client.subscribe(playerTopic, handleReceivedMessage);
          subscriptionsRef.current[privateTopic] = client.subscribe(privateTopic, handleReceivedMessage);
          logMessage('info', 'Subscriptions successful.');
          setUiState('NICKNAME_INPUT');
        } catch (subError) {
          logMessage('error', 'Subscription failed:', subError);
          setConnectionError('Failed to subscribe to game topics.');
          setUiState('ERROR');
          if (client.active) client.deactivate();
        }
      },
      onWebSocketClose: (event: CloseEvent) => {
        logMessage('warn', `WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
      },
      onWebSocketError: (error: Event) => {
        logMessage('error', 'WS Error:', error);
        setConnectionError("WebSocket connection error.");
        setUiState('ERROR');
      },
      onStompError: (frame: IFrame) => {
        logMessage('error', 'STOMP Error:', frame.headers['message'], frame.body);
        setConnectionError(`Connection failed: ${frame.headers['message'] || 'Unknown STOMP error'}`);
        setUiState('ERROR');
      },
      onDisconnect: () => {
        logMessage('info', 'WS Disconnected.');
        setUiState(prev => prev === 'ERROR' ? 'ERROR' : 'DISCONNECTED');
        setPlayerInfo(prev => ({ ...prev, cid: undefined }));
        subscriptionsRef.current = {};
        stompClientRef.current = null;
        _resetGameState();
      }
    });

    client.activate();
    stompClientRef.current = client;
  }, [handleReceivedMessage]);

  const disconnectWebSocket = useCallback(() => {
    // ... (disconnect logic remains the same) ...
    if (!stompClientRef.current) {
      logMessage('info', 'Disconnect called but client already null.');
      return;
    }
    logMessage('info', "Attempting disconnect...");
    Object.values(subscriptionsRef.current).forEach((sub: any) => {
      if (sub?.unsubscribe) try { sub.unsubscribe(); } catch (e) { console.error("Unsubscribe error", e) }
    });
    subscriptionsRef.current = {};
    if (stompClientRef.current && typeof stompClientRef.current.deactivate === 'function') {
      try {
        stompClientRef.current.deactivate();
      } catch (e) {
        logMessage('error', 'Error during client deactivation:', e);
        stompClientRef.current = null;
        setUiState('DISCONNECTED');
        _resetGameState();
      }
    } else {
      logMessage('warn', 'Cannot deactivate, client ref is null or lacks deactivate method.');
      stompClientRef.current = null;
      setUiState('DISCONNECTED');
      _resetGameState();
    }
  }, []);

  // Clean up connection on component unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  // --- Action Handlers ---
  const handleJoinGame = () => {
    const pinRegex = /^\d{6,7}$/;
    if (!pinRegex.test(gamePin)) {
      setConnectionError("Please enter a valid 6 or 7 digit Game PIN.");
      setUiState('PIN_INPUT');
      return;
    }
    setConnectionError(null);
    connectWebSocket(gamePin);
  };

  const handleNicknameSubmit = () => {
    // ... (nickname submit logic remains the same) ...
    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      setConnectionError("Nickname cannot be empty.");
      return;
    }
    setConnectionError(null);

    if (!stompClientRef.current || !stompClientRef.current.connected) {
      setConnectionError("Not connected to server.");
      setUiState('ERROR');
      return;
    }

    logMessage('info', `Joining game ${gamePin} as ${trimmedNickname}`);
    setUiState('JOINING');
    setPlayerInfo(prev => ({ ...prev, name: trimmedNickname }));

    const joinMessagePayload = {
      name: trimmedNickname,
      type: "joined",
      content: JSON.stringify({ device: { userAgent: navigator.userAgent, screen: { width: window.screen.width, height: window.screen.height } } }),
      cid: playerInfo.cid || "UNKNOWN_CID"
    };

    const messageToSend = {
      channel: `${APP_PREFIX}/controller/${gamePin}`,
      data: joinMessagePayload,
      ext: { timetrack: Date.now() }
    };

    try {
      stompClientRef.current.publish({
        destination: messageToSend.channel,
        body: JSON.stringify([messageToSend])
      });
      logMessage('info', 'Join message sent.');
      setUiState('PLAYING');
      _resetGameState();
      setIsWaiting(true);

    } catch (error) {
      logMessage('error', 'Failed to send join message:', error);
      setConnectionError('Failed to send join message.');
      setUiState('ERROR');
    }
  };


  const handleAnswerSubmit = (answerDetailPayload: PlayerAnswerPayload) => {
    // ... (answer submit logic remains the same) ...
    if (!stompClientRef.current || !stompClientRef.current.connected) {
      logMessage('error', 'Cannot submit answer: Not connected.');
      return;
    }
    if (isSubmitting) {
      logMessage('warn', 'Already submitting an answer.');
      return;
    }
    if (!playerInfo.cid || !gamePin) {
      logMessage('error', "Cannot submit answer: Missing CID or Game PIN.");
      return;
    }

    logMessage('info', 'Player submitting answer detail:', answerDetailPayload);
    setIsSubmitting(true);

    const contentString = JSON.stringify(answerDetailPayload);
    const messageToSend = {
      channel: `${APP_PREFIX}/controller/${gamePin}`,
      data: {
        gameid: gamePin,
        id: 6,
        type: "message",
        content: contentString,
        cid: playerInfo.cid
      },
      ext: { timetrack: Date.now() }
    };

    try {
      stompClientRef.current.publish({
        destination: messageToSend.channel,
        body: JSON.stringify([messageToSend])
      });
      logMessage('info', 'Answer message sent.');
    } catch (error) {
      logMessage('error', 'Failed to send answer message:', error);
      setIsSubmitting(false);
      setConnectionError("Failed to send answer. Please try again.");
    }
  };

  // --- Render Functions ---
  const renderPinInput = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Join Game</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Enter the 6 or 7 digit PIN provided by the host.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="number"
            placeholder="Game PIN"
            value={gamePin}
            onChange={(e) => setGamePin(e.target.value.replace(/[^0-9]/g, '').slice(0, 7))}
            className="text-center text-2xl h-14 tracking-widest"
            maxLength={7}
            aria-label="Game PIN"
          />
          {connectionError && <p className="text-sm text-red-600 dark:text-red-400 text-center">{connectionError}</p>}
          <Button onClick={handleJoinGame} className="w-full" size="lg" disabled={uiState === 'CONNECTING'}>
            {uiState === 'CONNECTING' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
            {uiState === 'CONNECTING' ? 'Connecting...' : 'Enter'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderNicknameInput = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900 dark:to-teal-900">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Enter Nickname</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Choose a nickname for the game.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="text"
            placeholder="Your Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={25}
            className="text-center text-lg h-12"
            aria-label="Nickname"
          />
          {connectionError && <p className="text-sm text-red-600 dark:text-red-400 text-center">{connectionError}</p>}
          <Button onClick={handleNicknameSubmit} className="w-full" size="lg" disabled={uiState === 'JOINING'}>
            {uiState === 'JOINING' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
            {uiState === 'JOINING' ? 'Joining...' : 'Join Game'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderConnecting = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground text-center">Connecting to game {gamePin}...</p>
    </div>
  );

  const renderJoining = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground text-center">Joining as {nickname}...</p>
    </div>
  );


  const renderDisconnected = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <WifiOff className="h-12 w-12 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold mb-2">Disconnected</h2>
      <p className="text-muted-foreground mb-4">Connection lost. Please try joining again.</p>
      <Button onClick={() => { setConnectionError(null); setGamePin(''); setNickname(''); setUiState('PIN_INPUT'); }}>
        Join New Game
      </Button>
    </div>
  );

  const renderError = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-xl font-semibold text-destructive mb-2">Error</h2>
      <p className="text-muted-foreground mb-4">{connectionError || "An unknown error occurred."}</p>
      <Button onClick={() => { setConnectionError(null); setUiState('PIN_INPUT'); disconnectWebSocket(); }}>
        Try Again
      </Button>
    </div>
  );

  // --- Main Render Logic ---
  switch (uiState) {
    case 'PIN_INPUT':
      return renderPinInput();
    case 'CONNECTING':
      return renderConnecting();
    case 'NICKNAME_INPUT':
      return renderNicknameInput();
    case 'JOINING':
      return renderJoining();
    case 'PLAYING':
      return (
        <>
          <PlayerView
            questionData={currentBlock}
            feedbackPayload={currentResult}
            onSubmitAnswer={handleAnswerSubmit}
            isWaiting={isWaiting}
            isSubmitting={isSubmitting}
            playerInfo={playerInfo}
          />
          {/* Pass the wrapper function to DevMockControls */}
          <DevMockControls
            simulateReceiveMessage={handleSimulatedMessageFromDevControls} // Use the wrapper
            loadMockBlock={(block) => { logMessage('warn', "DEV: Host override block ignored in PlayerPage"); }}
            setMockResult={(result) => { logMessage('warn', "DEV: Host override result ignored in PlayerPage"); }}
          />
        </>
      );
    case 'DISCONNECTED':
      return renderDisconnected();
    case 'ERROR':
      return renderError();
    default:
      logMessage('error', 'Reached unknown UI state:', uiState);
      setUiState('ERROR');
      setConnectionError('Invalid application state.');
      return renderError();
  }
}