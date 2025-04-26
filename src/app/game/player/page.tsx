// src/app/game/player/page.tsx
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import PlayerView from '@/src/components/game/views/PlayerView';
import { GameBlock, PlayerAnswerPayload, QuestionResultPayload } from '@/src/lib/types';
import DevMockControls from '@/src/components/game/DevMockControls';
// Mock data imports (ensure these paths are correct)
import mockContent from '@/src/__mocks__/websockets/question_0_content';
import mockQuizTF from '@/src/__mocks__/websockets/question_1_quiz_2choice';
import mockJumble from '@/src/__mocks__/websockets/question_4_jumble';
import mockResultCorrect from '@/src/__mocks__/websockets/result_1_quiz_correct';
import mockResultIncorrect from '@/src/__mocks__/websockets/result_2_quiz_incorrect';

interface PlayerInfoState {
  name: string;
  avatarUrl?: string;
  score: number;
  rank?: number;
}

export default function PlayerPage() {
  const [currentBlock, setCurrentBlock] = useState<GameBlock | null>(null);
  const [currentResult, setCurrentResult] = useState<QuestionResultPayload | null>(null);
  const [isWaiting, setIsWaiting] = useState(true); // Start waiting
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playerInfo, setPlayerInfo] = useState<PlayerInfoState>({
    name: 'Player One',
    score: 0,
    rank: undefined,
    avatarUrl: undefined
  });
  // Ref to track if a submission process has started, to coordinate effects
  const submissionTriggered = useRef(false);

  const loadBlock = useCallback((block: GameBlock | null) => {
    submissionTriggered.current = false; // Reset on new block load
    setCurrentResult(null);
    setIsWaiting(false);
    setIsSubmitting(false);
    setCurrentBlock(block);
    console.log("DEV: Loaded block:", block?.type);
  }, []);

  const setMockResult = useCallback((result: QuestionResultPayload | null) => {
    setCurrentBlock(null); // Clear block when showing result
    setIsSubmitting(false); // Ensure submitting state is off
    setCurrentResult(result);
    if (result) {
      setPlayerInfo(prev => ({
        ...prev,
        score: result.totalScore,
        rank: result.rank,
      }));
    }
    console.log("DEV: Showing result:", result?.type);
  }, [setPlayerInfo]); // Include setter in dependency array

  // Effect to start the initial game flow simulation ONCE
  useEffect(() => {
    console.log("DEV: Starting initial mock game flow simulation...");
    setIsWaiting(true); // Explicitly set waiting at the start

    let timer1: NodeJS.Timeout | number | undefined = undefined;
    let timer2: NodeJS.Timeout | number | undefined = undefined;

    // Sequence: Wait -> Content -> Wait -> QuizTF
    timer1 = setTimeout(() => {
      console.log("DEV: Simulating content block...");
      // Ensure mockContent matches GameBlock (or use 'as unknown as GameBlock' if certain)
      loadBlock(mockContent as GameBlock);

      timer2 = setTimeout(() => {
        console.log("DEV: Simulating quiz T/F block...");
        // Ensure mockQuizTF matches GameBlock
        loadBlock(mockQuizTF as GameBlock);
        // Now waiting for player interaction (handleAnswerSubmit)
      }, 5000); // Duration to show content block

    }, 1000); // Initial delay before showing content

    // --- Correct Cleanup Function ---
    return () => {
      console.log("DEV: Cleaning up initial simulation timers...");
      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
    };
    // --- End Cleanup ---

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array: Run only once on mount


  // --- Effect to handle the sequence AFTER a submission is triggered ---
  useEffect(() => {
    // Declare timer variables for this effect's scope
    let resultTimer: NodeJS.Timeout | number | undefined = undefined;
    let waitTimer: NodeJS.Timeout | number | undefined = undefined;
    let nextBlockTimer: NodeJS.Timeout | number | undefined = undefined;

    // Only run if isSubmitting is true AND the trigger ref is set
    if (isSubmitting && submissionTriggered.current) {
      console.log("DEV: Submission detected, simulating result display sequence...");
      submissionTriggered.current = false; // Consume the trigger

      // 1. Simulate backend processing delay
      resultTimer = setTimeout(() => {
        console.log("DEV: Simulating result display...");
        // Use a mock result (can randomize correct/incorrect for testing)
        const randomResult = Math.random() > 0.3 ? mockResultCorrect : mockResultIncorrect;
        setMockResult(randomResult as QuestionResultPayload); // Show the result

        // 2. Simulate duration result is shown
        waitTimer = setTimeout(() => {
          console.log("DEV: Simulating waiting state after result...");
          setCurrentResult(null); // Clear result
          setIsSubmitting(false); // IMPORTANT: Turn off submitting state
          setIsWaiting(true);     // Enter waiting state

          // 3. Simulate delay before next question
          nextBlockTimer = setTimeout(() => {
            console.log("DEV: Simulating next block (Jumble)...");
            // Ensure mockJumble matches GameBlock
            loadBlock(mockJumble as GameBlock); // Load next question
          }, 4000); // Wait duration

        }, 3000); // Result display duration

      }, 1500); // Result processing delay
    }

    // --- Correct Cleanup for THIS effect ---
    return () => {
      // Clear any timers set within this effect instance if the component
      // unmounts or dependencies change while timers are active.
      if (resultTimer) clearTimeout(resultTimer);
      if (waitTimer) clearTimeout(waitTimer);
      if (nextBlockTimer) clearTimeout(nextBlockTimer);
    };
    // --- End Cleanup ---

  }, [isSubmitting, loadBlock, setMockResult]); // Re-run ONLY when isSubmitting changes


  // This function is called by AnswerInputArea when the player submits
  const handleAnswerSubmit = (payload: PlayerAnswerPayload) => {
    console.log('Player submitted answer:', payload);
    // Avoid triggering submission logic if already submitting
    if (isSubmitting) return;

    setIsSubmitting(true);      // Show submitting UI state
    setCurrentBlock(null);      // Hide question UI
    submissionTriggered.current = true; // Set the flag to trigger the result simulation effect
    // NOTE: In a real app, you'd send the 'payload' via WebSocket here.
  };

  // --- Component Render ---
  // This part remains outside the useEffect hooks
  return (
    <>
      <PlayerView
        questionData={currentBlock}
        onSubmitAnswer={handleAnswerSubmit}
        isWaiting={isWaiting}
        isSubmitting={isSubmitting}
        feedbackPayload={currentResult} // Pass the result object
        playerInfo={playerInfo}
      />
      <DevMockControls
        loadMockBlock={loadBlock}
        setMockResult={setMockResult}
      />
    </>
  );
}