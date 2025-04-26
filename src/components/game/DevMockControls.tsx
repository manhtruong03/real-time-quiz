// src/components/game/DevMockControls.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
// --- Imports for new mock data ---
import mockContent from '@/src/__mocks__/websockets/question_0_content';
import mockQuizTF from '@/src/__mocks__/websockets/question_1_quiz_2choice';
import mockQuiz4Choice from '@/src/__mocks__/websockets/question_2_quiz_4choice';
import mockQuizImage from '@/src/__mocks__/websockets/question_3_quiz_image';
import mockJumble from '@/src/__mocks__/websockets/question_4_jumble';
import mockSurvey from '@/src/__mocks__/websockets/question_5_survey';
import mockOpenEnded from '@/src/__mocks__/websockets/question_6_open_ended';
import mockResultCorrect from '@/src/__mocks__/websockets/result_1_quiz_correct';
import mockResultIncorrect from '@/src/__mocks__/websockets/result_2_quiz_incorrect';
// --- END ADD ---
// --- UPDATED Type Imports ---
import { GameBlock, QuestionResultPayload } from '@/src/lib/types';
// --- END UPDATE ---
import { Settings, EyeOff } from 'lucide-react';
import { cn } from '@/src/lib/utils';

// --- UPDATED Props Interface ---
interface DevMockControlsProps {
  loadMockBlock: (block: GameBlock | null) => void; // Renamed from loadMockQuestion
  setMockResult: (result: QuestionResultPayload | null) => void; // Added
  // Remove old/redundant props if they are no longer needed by the parent
  // setFeedback?: (feedback: 'correct' | 'incorrect' | 'timeup' | null) => void;
  // setIsWaiting?: (waiting: boolean) => void;
  // setIsSubmitting?: (submitting: boolean) => void;
}
// --- END UPDATE ---

const DevMockControls: React.FC<DevMockControlsProps> = ({
  loadMockBlock,
  setMockResult,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // load function remains the same as previous step
  const load = (block: GameBlock | null) => {
    setMockResult(null); // Clear any previous result/feedback
    loadMockBlock(block);
  };

  // showResult function remains the same as previous step
  const showResult = (resultType: 'correct' | 'incorrect' | 'timeup') => {
    loadMockBlock(null); // Clear the question block
    let resultPayload: QuestionResultPayload | null = null;
    switch (resultType) {
      case 'correct':
        resultPayload = mockResultCorrect as QuestionResultPayload;
        break;
      case 'incorrect':
        resultPayload = mockResultIncorrect as QuestionResultPayload;
        break;
      case 'timeup':
        resultPayload = { ...mockResultIncorrect, text: "Time's Up!", isCorrect: false, points: 0 } as QuestionResultPayload; // Ensure correct type and state
        break;
    }
    setMockResult(resultPayload);
  };

  // showState function remains the same as previous step
  const showState = (state: 'waiting' | 'submitting') => {
    loadMockBlock(null);
    setMockResult(null);
    console.log(`DEV: Triggering state change to ${state} in parent`);
    // Parent component needs to handle this, maybe via the load/set functions setting nulls
    // Or keep setIsWaiting/setIsSubmitting props if needed for direct control
  };


  return (
    <div className="fixed bottom-4 right-4 z-[100]">
      <Button
        variant="secondary"
        size="icon"
        onClick={() => setIsOpen(true)}
        className={cn(
          "shadow-lg",
          isOpen ? 'hidden' : 'absolute -top-12 right-0'
        )}
        aria-label="Show Dev Controls"
      >
        <Settings className="h-5 w-5" />
      </Button>

      {isOpen && (
        <Card className={cn("w-64 shadow-lg animate-in fade-in slide-in-from-bottom-5 duration-300")}>
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-sm font-medium">Dev Controls</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="absolute top-1 right-1 h-6 w-6"
              aria-label="Hide Dev Controls"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-2">
            <h4 className="text-xs font-semibold mb-1">Load Block Type:</h4>
            <Button size="sm" variant="outline" onClick={() => load(mockContent as GameBlock)}>Load Content</Button>
            <Button size="sm" variant="outline" onClick={() => load(mockQuizTF as GameBlock)}>Load Quiz T/F</Button>
            <Button size="sm" variant="outline" onClick={() => load(mockQuiz4Choice as GameBlock)}>Load Quiz 4Choice</Button>
            <Button size="sm" variant="outline" onClick={() => load(mockQuizImage as GameBlock)}>Load Quiz Image</Button>
            <Button size="sm" variant="outline" onClick={() => load(mockJumble as GameBlock)}>Load Jumble</Button>
            <Button size="sm" variant="outline" onClick={() => load(mockSurvey as GameBlock)}>Load Survey</Button>
            <Button size="sm" variant="outline" onClick={() => load(mockOpenEnded as GameBlock)}>Load Open Ended</Button>

            <h4 className="text-xs font-semibold mt-2 mb-1">Show Result/State:</h4>
            <Button size="sm" variant="outline" onClick={() => showResult('correct')}>Show Correct</Button>
            <Button size="sm" variant="outline" onClick={() => showResult('incorrect')}>Show Incorrect</Button>
            <Button size="sm" variant="outline" onClick={() => showResult('timeup')}>Show Time Up</Button>
            <Button size="sm" variant="outline" onClick={() => showState('waiting')}>Show Waiting</Button>
            <Button size="sm" variant="outline" onClick={() => showState('submitting')}>Show Submitting</Button>
            <Button size="sm" variant="destructive" onClick={() => load(null)}>Clear All</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DevMockControls;