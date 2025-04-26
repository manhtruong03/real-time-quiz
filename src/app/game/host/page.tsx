// src/app/game/host/page.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import HostView from '@/src/components/game/views/HostView';
// --- UPDATED Import ---
import { GameBlock, PlayerAnswerPayload, isQuizQuestion, isJumbleQuestion, isOpenEndedQuestion, isSurveyQuestion, isContentBlock } from '@/src/lib/types'; // Use GameBlock
import DevMockControls from '@/src/components/game/DevMockControls';
// --- REMOVE Old mock import ---
// import { getMockData } from '@/src/mockData';

// --- ADD Imports for new mock data (as needed for simulation) ---
import mockContent from '@/src/__mocks__/websockets/question_0_content';
import mockQuizTF from '@/src/__mocks__/websockets/question_1_quiz_2choice';
import mockQuiz4Choice from '@/src/__mocks__/websockets/question_2_quiz_4choice';
import mockQuizImage from '@/src/__mocks__/websockets/question_3_quiz_image';
import mockJumble from '@/src/__mocks__/websockets/question_4_jumble';
import mockSurvey from '@/src/__mocks__/websockets/question_5_survey';
import mockOpenEnded from '@/src/__mocks__/websockets/question_6_open_ended';
import { QuestionResultPayload } from '@/src/lib/types'; // Import if needed for DevMockControls

// --- END ADD ---

export default function HostPage() {
  // --- UPDATED State Type ---
  const [currentBlock, setCurrentBlock] = useState<GameBlock | null>(null);
  const [currentResult, setCurrentResult] = useState<QuestionResultPayload | null>(null); // Add state for results if DevControls needs it
  // --- END UPDATE ---

  const [isLoading, setIsLoading] = useState(false);
  const [answerCount, setAnswerCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(50); // Example player count
  const [gamePin] = useState('123456'); // Example game pin
  const [accessUrl] = useState('bytebattle.quiz'); // Example access URL

  // --- UPDATED Mock Interaction ---
  const loadBlock = useCallback((block: GameBlock | null) => {
    setIsLoading(true);
    setCurrentResult(null); // Clear result when loading new block
    setAnswerCount(0); // Reset answer count for new block
    // Simulate loading delay
    setTimeout(() => {
      setCurrentBlock(block);
      setIsLoading(false);
    }, 500); // 0.5 second delay
  }, []);

  // --- ADDED: Function to handle setting results (for DevMockControls) ---
  const setMockResult = useCallback((result: QuestionResultPayload | null) => {
    setCurrentBlock(null); // Clear block when showing result
    setCurrentResult(result);
    // Potentially handle loading/waiting states here too
    setIsLoading(false);
  }, []);
  // --- END ADD ---


  // Simulate receiving answers (adjust logic if needed)
  useEffect(() => {
    if (currentBlock && !isLoading) {
      const interval = setInterval(() => {
        setAnswerCount(prev => {
          if (prev >= totalPlayers) {
            clearInterval(interval);
            return prev;
          }
          // Simulate more realistic answer count increase
          const remainingPlayers = totalPlayers - prev;
          const newAnswers = Math.min(remainingPlayers, Math.floor(Math.random() * (totalPlayers * 0.1)) + 1); // Simulate up to 10% answering per interval
          return prev + newAnswers;
        });
      }, 1200); // Slightly longer interval

      return () => clearInterval(interval);
    }
  }, [currentBlock, isLoading, totalPlayers]);

  // Load initial block on mount (using new mock data)
  useEffect(() => {
    loadBlock(mockContent as GameBlock); // Start with the content block
  }, [loadBlock]);
  // --- End Mock Interaction ---

  const handleTimeUp = () => {
    console.log('Host detected time up!');
    // In a real app, host would calculate results and send Phase 4 messages
    // For mock: Maybe move to next after a delay? Or show a "Time Up" state locally?
    // Example: setTimeout(() => handleNext(), 2000);
  };

  // Simple cycle through mock block types for Skip/Next
  const getNextMockBlock = (): GameBlock => {
    if (!currentBlock) return mockContent as GameBlock; // Default if no current block

    switch (currentBlock.type) {
      case 'content': return mockQuizTF as GameBlock;
      case 'quiz':
        // Alternate between different quiz types if needed
        if (currentBlock.choices.length === 2) return mockQuiz4Choice as GameBlock;
        if (currentBlock.choices.some(c => c.image)) return mockJumble as GameBlock; // Check if it was image quiz
        return mockQuizImage as GameBlock; // Otherwise load image quiz
      case 'jumble': return mockSurvey as GameBlock;
      case 'survey': return mockOpenEnded as GameBlock;
      case 'open_ended': return mockContent as GameBlock; // Loop back
      default: return mockContent as GameBlock;
    }
  }

  const handleSkip = () => {
    console.log('Host skipped question');
    loadBlock(getNextMockBlock());
  }

  const handleNext = () => {
    console.log('Host clicked next');
    loadBlock(getNextMockBlock());
  }

  return (
    <>
      {/* --- UPDATED Prop Name --- */}
      <HostView
        questionData={currentBlock} // Pass currentBlock
        currentAnswerCount={answerCount}
        totalPlayers={totalPlayers}
        gamePin={gamePin}
        accessUrl={accessUrl}
        onTimeUp={handleTimeUp}
        onSkip={handleSkip}
        onNext={handleNext} // Keep next if you want a manual advance button
        isLoading={isLoading}
      />
      {/* --- END UPDATE --- */}

      {/* Dev controls - only shown in development */}
      {/* --- UPDATED Props Passed --- */}
      <DevMockControls
        loadMockBlock={loadBlock}
        setMockResult={setMockResult}
      />
      {/* --- END UPDATE --- */}
    </>
  );
}