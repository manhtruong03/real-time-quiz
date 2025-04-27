// src/app/game/host/page.tsx
"use client"; // <--- ADD THIS DIRECTIVE AT THE TOP

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Client, IFrame, IMessage } from "@stomp/stompjs";

import HostView from "@/src/components/game/views/HostView";
import { Button } from "@/src/components/ui/button";
import { Loader2, WifiOff } from "lucide-react";
import DevMockControls, { MockWebSocketMessage } from "@/src/components/game/DevMockControls";
import mockQuizStructureHost from "@/src/__mocks__/api/quiz_sample_all_types";
import { QuizStructureHost, GameBlock, LiveGameState } from "@/src/lib/types";
import { useHostGame } from "@/src/hooks/useHostGame";

// --- Constants ---
const API_BASE_URL = 'http://localhost:8080/api/session';
const WEBSOCKET_URL = 'ws://localhost:8080/ws-quiz';
const APP_PREFIX = '/app';
const TOPIC_PREFIX = '/topic';
const USER_QUEUE_PREFIX = '/user/queue';

export default function HostPage() {
  // === State for UI Flow and Connection ===
  type UiStateType = 'INITIAL' | 'FETCHING_PIN' | 'CONNECTING_WS' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  const [uiState, setUiState] = useState<UiStateType>('INITIAL');
  const [apiError, setApiError] = useState<string | null>(null);
  const [fetchedGamePin, setFetchedGamePin] = useState<string | null>(null);
  const [hostClientId, setHostClientId] = useState<string | null>(null);

  // === State for Initial Data Loading ===
  const [quizData, setQuizData] = useState<QuizStructureHost | null>(null);
  const [isQuizLoading, setIsQuizLoading] = useState(true);

  // === WebSocket Refs ===
  const stompClientRef = useRef<Client | null>(null); // Use Client type now
  const subscriptionsRef = useRef<{ [key: string]: any }>({});

  // === Load Mock Quiz Data ===
  useEffect(() => {
    // ... (implementation remains the same) ...
    console.log("HostPage: Loading mock quiz structure...");
    setIsQuizLoading(true);
    const mockData = mockQuizStructureHost as QuizStructureHost;
    setQuizData(mockData);
    setIsQuizLoading(false);
    console.log("HostPage: Mock quiz structure loaded.");
  }, []);

  // === Use the Custom Hook for Game Logic ===
  const {
    liveGameState,
    currentBlock,
    timerKey,
    currentQuestionAnswerCount,
    currentTotalPlayers,
    handleNext,
    handleSkip,
    handleTimeUp,
    handleWebSocketMessage,
    initializeSession,
    sendBlockToPlayers,
  } = useHostGame(quizData);

  // === WebSocket Connection Logic ===
  const handleReceivedMessage = (message: IMessage) => {
    // Pass body to the hook's handler
    handleWebSocketMessage(message.body);
  };

  const connectWebSocket = useCallback((pin: string) => {
    // ... (implementation remains the same, uses handleReceivedMessage) ...
    if (!pin || !quizData) { console.error("Cannot connect: Missing pin or quizData"); setUiState('ERROR'); setApiError("Missing data needed to connect."); return; };
    if (stompClientRef.current?.active) { console.warn("WS already connected."); return; }
    console.log(`HostPage: Attempting WebSocket connection for game pin ${pin}...`);
    setUiState('CONNECTING_WS');
    const client = new Client({
      brokerURL: WEBSOCKET_URL, debug: (str) => { console.log("STOMP DEBUG:", str); }, reconnectDelay: 5000, heartbeatIncoming: 4000, heartbeatOutgoing: 4000,
      onConnect: (frame: IFrame) => {
        const connectedSessionId = frame.headers['user-name'] || `host-${Date.now()}`;
        setHostClientId(connectedSessionId);
        console.log(`HostPage: WebSocket Connected! Session ID (approx): ${connectedSessionId}`);
        setUiState('CONNECTED');
        // Initialize the game state in the hook *after* connection
        initializeSession(pin, connectedSessionId);
        // Subscribe
        const hostTopic = `${TOPIC_PREFIX}/host/${pin}`; const playerTopic = `${TOPIC_PREFIX}/player/${pin}`; const privateTopic = `${USER_QUEUE_PREFIX}/private`;
        console.log(`HostPage: Subscribing to ${hostTopic}, ${playerTopic}, ${privateTopic}`);
        subscriptionsRef.current[hostTopic] = client.subscribe(hostTopic, handleReceivedMessage);
        subscriptionsRef.current[playerTopic] = client.subscribe(playerTopic, handleReceivedMessage);
        subscriptionsRef.current[privateTopic] = client.subscribe(privateTopic, handleReceivedMessage);
      },
      onWebSocketError: (error: Event) => { console.error('HostPage: WS Error:', error); setApiError("WebSocket error."); setUiState('ERROR'); },
      onStompError: (frame: IFrame) => { console.error('HostPage: STOMP Error:', frame.headers['message'], frame.body); setApiError(`STOMP error: ${frame.headers['message']}`); setUiState('ERROR'); },
      onDisconnect: () => { console.log('HostPage: WS Disconnected.'); setUiState('DISCONNECTED'); setHostClientId(null); subscriptionsRef.current = {}; initializeSession("RESET", "RESET"); /* Reset hook state? */ }
    });
    client.activate();
    stompClientRef.current = client;
  }, [quizData, initializeSession, handleWebSocketMessage]); // Added handleWebSocketMessage here too if needed

  const disconnectWebSocket = useCallback(() => {
    // ... (implementation remains the same) ...
    console.log("HostPage: Attempting disconnect...");
    Object.values(subscriptionsRef.current).forEach((sub: any) => { if (sub?.unsubscribe) try { sub.unsubscribe(); } catch (e) { } });
    subscriptionsRef.current = {};
    stompClientRef.current?.deactivate();
    stompClientRef.current = null;
    setUiState(prev => (prev === 'CONNECTED' || prev === 'CONNECTING_WS' ? 'DISCONNECTED' : prev));
    setHostClientId(null);
    console.log("HostPage: WS deactivated.");
  }, []);

  useEffect(() => { return () => { disconnectWebSocket(); }; }, [disconnectWebSocket]);


  // --- API Call ---
  const handleStartGameClick = async () => {
    // ... (implementation remains the same) ...
    if (!quizData) { setApiError("Quiz data not ready."); setUiState('ERROR'); return; }
    setUiState('FETCHING_PIN'); setApiError(null); console.log("HostPage: Requesting game pin...");
    try {
      const response = await fetch(`${API_BASE_URL}/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await response.json();
      if (response.ok && data.gamePin) {
        console.log("HostPage: Game pin received:", data.gamePin);
        setFetchedGamePin(data.gamePin);
        connectWebSocket(data.gamePin);
      } else { throw new Error(data.error || `Failed to create session (Status: ${response.status})`); }
    } catch (error: any) { console.error("HostPage: Error creating session:", error); setApiError(error.message || "Failed to start game."); setUiState('ERROR'); }
  };

  // --- Render Functions for UI States ---
  const renderInitialView = () => ( /* ... same ... */
    <div className="flex flex-col items-center justify-center min-h-screen p-4"> <h1 className="text-3xl font-bold mb-6">Start New Quiz Game</h1> <p className="text-muted-foreground mb-6">Click the button below to generate a game pin and start hosting.</p> <Button size="lg" onClick={handleStartGameClick} disabled={isQuizLoading || uiState !== 'INITIAL'}> {(isQuizLoading || uiState === 'FETCHING_PIN') ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} {isQuizLoading ? 'Loading Quiz Data...' : (uiState === 'FETCHING_PIN' ? 'Getting Pin...' : 'Get Game Pin & Start Hosting')} </Button> </div>
  );
  const renderConnectingView = () => ( /* ... same ... */
    <div className="flex flex-col items-center justify-center min-h-screen p-4"> <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /> <p className="text-muted-foreground text-center"> {uiState === 'CONNECTING_WS' ? `Connecting to WebSocket for Game Pin: ${fetchedGamePin}...` : 'Generating Game Pin...'} </p> </div>
  );
  const renderErrorView = () => ( /* ... same ... */
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center"> <WifiOff className="h-12 w-12 text-destructive mb-4" /> <h2 className="text-xl font-semibold text-destructive mb-2">Failed</h2> <p className="text-muted-foreground mb-4">{apiError || "An unknown error occurred."}</p> <Button onClick={() => { setApiError(null); setFetchedGamePin(null); initializeSession("RESET", "RESET"); setUiState('INITIAL'); }}>Try Again</Button> </div> // Added state reset
  );
  const renderDisconnectedView = () => ( /* ... same ... */
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center"> <WifiOff className="h-12 w-12 text-muted-foreground mb-4" /> <h2 className="text-xl font-semibold mb-2">Disconnected</h2> <p className="text-muted-foreground mb-4">The WebSocket connection was closed.</p> <Button onClick={() => { setApiError(null); setFetchedGamePin(null); initializeSession("RESET", "RESET"); setUiState('INITIAL'); }}>Start New Game</Button> {fetchedGamePin && (<Button variant="outline" className="mt-2" onClick={() => connectWebSocket(fetchedGamePin)}> Reconnect (Pin: {fetchedGamePin}) </Button>)} </div> // Added state reset
  );


  // --- Main Return with Conditional Rendering ---
  if (uiState === 'INITIAL') return renderInitialView();
  if (uiState === 'FETCHING_PIN' || uiState === 'CONNECTING_WS') return renderConnectingView();
  if (uiState === 'ERROR') return renderErrorView();
  if (uiState === 'DISCONNECTED') return renderDisconnectedView();

  if (uiState === 'CONNECTED' && liveGameState) {
    return (
      <>
        <HostView
          timerKey={timerKey}
          questionData={currentBlock}
          currentAnswerCount={currentQuestionAnswerCount}
          totalPlayers={currentTotalPlayers}
          gamePin={liveGameState.gamePin}
          accessUrl={"VuiQuiz.com"}
          onTimeUp={handleTimeUp}
          onSkip={handleSkip}
          onNext={handleNext}
          isLoading={!currentBlock && liveGameState.status !== "LOBBY" && liveGameState.status !== "PODIUM" && liveGameState.status !== "ENDED"}
        />
        <DevMockControls
          loadMockBlock={(block) => { console.warn("DevMockControls loadMockBlock ignored when connected."); }}
          setMockResult={(result) => { console.warn("DevMockControls setMockResult ignored when connected."); }}
        // simulateHostReceiveJoin={(msg) => handleWebSocketMessage(msg)} // Can still use for testing
        // simulatePlayerAnswer={(msg) => handleWebSocketMessage(msg)}   // Can still use for testing
        />
      </>
    );
  }

  return renderConnectingView(); // Show connecting as a fallback if CONNECTED but no liveGameState yet
}