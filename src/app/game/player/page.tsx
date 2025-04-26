// src/app/game/player/page.tsx
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import PlayerView from '@/src/components/game/views/PlayerView';
import { GameBlock, PlayerAnswerPayload, QuestionResultPayload } from '@/src/lib/types';
import DevMockControls, { MockWebSocketMessage } from '@/src/components/game/DevMockControls';

interface PlayerInfoState {
  name: string;
  avatarUrl?: string;
  score: number;
  rank?: number;
  cid?: string;
}

export default function PlayerPage() {
  const [currentBlock, setCurrentBlock] = useState<GameBlock | null>(null);
  const [currentResult, setCurrentResult] = useState<QuestionResultPayload | null>(null);
  const [isWaiting, setIsWaiting] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playerInfo, setPlayerInfo] = useState<PlayerInfoState>({
    name: 'Player One',
    score: 0,
    rank: undefined,
    avatarUrl: undefined,
    cid: 'DEV_PLAYER_CID_' + Math.random().toString(36).substring(2, 9),
  });
  // Store gameId separately, obtained from the message envelope
  const [currentGameId, setCurrentGameId] = useState<string>("DEV123");

  // Internal state update functions
  const _setCurrentBlock = (block: GameBlock | null) => {
    setCurrentResult(null);
    setIsWaiting(false);
    setIsSubmitting(false);
    setCurrentBlock(block);
    // --- REMOVE gameid access from block ---
    // if (block?.gameid) setCurrentGameId(block.gameid); // REMOVE THIS LINE
    // --- END REMOVAL ---
    console.log("Player State: Displaying block:", block?.type);
  };

  const _setCurrentResult = (result: QuestionResultPayload | null) => {
    setCurrentBlock(null);
    setIsSubmitting(false);
    setCurrentResult(result);
    if (result) {
      setPlayerInfo(prev => ({
        ...prev,
        score: result.totalScore,
        rank: result.rank,
      }));
      console.log("Player State: Displaying result:", result?.type);
    } else {
      console.log("Player State: Clearing result.");
    }
  };


  const handleSimulatedMessage = useCallback((message: MockWebSocketMessage) => {
    console.log("PlayerPage: Received simulated message:", message);

    if (!message || !message.data) {
      console.warn("PlayerPage: Received invalid simulated message structure.");
      _setCurrentBlock(null); _setCurrentResult(null); setIsWaiting(true); return;
    }

    // --- Set currentGameId from the message envelope DATA ---
    if (message.data.gameid) {
      setCurrentGameId(message.data.gameid); // Get gameId from envelope
    }
    // --- END Setting currentGameId ---

    const { id: dataTypeId, content } = message.data;

    try {
      // --- Handle special state signals ---
      if (dataTypeId === 99) { _setCurrentBlock(null); _setCurrentResult(null); setIsWaiting(true); setIsSubmitting(false); return; }
      if (dataTypeId === 98) { _setCurrentBlock(null); _setCurrentResult(null); setIsWaiting(false); setIsSubmitting(true); return; }
      if (dataTypeId === 0) { _setCurrentBlock(null); _setCurrentResult(null); setIsWaiting(true); setIsSubmitting(false); console.log("Player State: View Cleared."); return; }

      // --- Parse game content ---
      const parsedContent = JSON.parse(content);

      if (dataTypeId === 2) { // Question Start
        _setCurrentBlock(parsedContent as GameBlock);
      } else if (dataTypeId === 8) { // Result
        _setCurrentResult(parsedContent as QuestionResultPayload);
      } else {
        console.warn(`PlayerPage: Received message with unknown data.id: ${dataTypeId}`);
        _setCurrentBlock(null); _setCurrentResult(null); setIsWaiting(true);
      }
    } catch (error) {
      console.error("PlayerPage: Error parsing message content:", error, content);
      _setCurrentBlock(null); _setCurrentResult(null); setIsWaiting(true);
    }
    // Depend on the state setters
  }, [_setCurrentBlock, _setCurrentResult]);


  const handleAnswerSubmit = (answerDetailPayload: PlayerAnswerPayload) => {
    console.log('Player submitting answer detail:', answerDetailPayload);
    // Use the currentGameId from state
    if (isSubmitting || !playerInfo.cid || !currentGameId) {
      console.warn("Submission blocked: Already submitting or missing CID/GameID.");
      return;
    }
    // ... (rest of the function remains the same: set isSubmitting, stringify, create messageToSend, log) ...
    setIsSubmitting(true);
    setCurrentBlock(null);

    const contentString = JSON.stringify(answerDetailPayload);
    const messageToSend: MockWebSocketMessage = {
      channel: `/controller/${currentGameId}`, // Use state variable
      data: {
        gameid: currentGameId,             // Use state variable
        id: 6,
        type: "message",
        content: contentString,
        cid: playerInfo.cid
      },
      ext: { timetrack: Date.now() }
    };
    console.log('Player Message Sent (Simulated):', messageToSend);
    console.log("Player State: Answer submitted. Waiting for result message...");
  };


  return (
    <>
      <PlayerView
        // ... props ...
        questionData={currentBlock}
        onSubmitAnswer={handleAnswerSubmit}
        isWaiting={isWaiting}
        isSubmitting={isSubmitting}
        feedbackPayload={currentResult}
        playerInfo={playerInfo}
      />
      <DevMockControls
        simulateReceiveMessage={handleSimulatedMessage}
        // Pass host overrides if still needed, otherwise remove them
        loadMockBlock={(block) => { console.log("DEV: Host override block ignored in PlayerPage"); }}
        setMockResult={(result) => { console.log("DEV: Host override result ignored in PlayerPage"); }}
      />
    </>
  );
}