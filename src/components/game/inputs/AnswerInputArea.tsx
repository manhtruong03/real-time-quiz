// src/components/game/inputs/AnswerInputArea.tsx
'use client';

import React, { memo, useCallback } from 'react'; // Import memo, useCallback
import {
  GameBlock, PlayerAnswerPayload,
  isQuizQuestion, isJumbleQuestion, isOpenEndedQuestion, isSurveyQuestion, isContentBlock
} from '@/src/lib/types'; // Adjust path
import { Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

// --- Import the new specialized input components ---
import { QuizSurveyInput } from './types/QuizSurveyInput';
import { JumbleInput } from './types/JumbleInput';
// --- We reuse the existing OpenEndedInput ---
import OpenEndedInput from './OpenEndedInput'; // Assuming path is correct

interface AnswerInputAreaProps {
  questionData: GameBlock | null;
  onAnswerSubmit: (payload: PlayerAnswerPayload) => void;
  isSubmitting: boolean;
  isInteractive?: boolean;
  className?: string;
}

const AnswerInputArea: React.FC<AnswerInputAreaProps> = ({
  questionData: currentBlock,
  onAnswerSubmit,
  isSubmitting,
  isInteractive = true,
  className,
}) => {

  // --- Handler specifically for Quiz/Survey selection ---
  const handleQuizSurveySelection = useCallback((index: number) => {
    if (!currentBlock || !(isQuizQuestion(currentBlock) || isSurveyQuestion(currentBlock))) return;
    onAnswerSubmit({
      type: currentBlock.type,
      choice: index,
      questionIndex: currentBlock.questionIndex,
    });
  }, [currentBlock, onAnswerSubmit]); // Depends on currentBlock and the stable onAnswerSubmit

  // --- Handler specifically for Jumble submission ---
  const handleJumbleSubmit = useCallback((orderedOriginalIndices: number[]) => {
    // TODO: Verify the indices mapping logic here or in JumbleInput if needed
    if (!currentBlock || !isJumbleQuestion(currentBlock)) return;
    onAnswerSubmit({
      type: 'jumble',
      choice: orderedOriginalIndices,
      questionIndex: currentBlock.questionIndex,
    });
  }, [currentBlock, onAnswerSubmit]);

  // --- Handler specifically for OpenEnded submission ---
  const handleOpenEndedSubmit = useCallback((text: string) => {
    if (!currentBlock || !isOpenEndedQuestion(currentBlock)) return;
    onAnswerSubmit({
      type: 'open_ended',
      text: text,
      questionIndex: currentBlock.questionIndex,
    });
  }, [currentBlock, onAnswerSubmit]);


  // --- Rendering Logic (Router) ---
  if (!currentBlock) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Waiting for question...</span>
      </div>
    );
  }

  if (isContentBlock(currentBlock)) {
    return null; // No input for content blocks
  }

  // Use type guards to render the correct input component
  if (isQuizQuestion(currentBlock) || isSurveyQuestion(currentBlock)) {
    return (
      <QuizSurveyInput
        choices={currentBlock.choices}
        onSelect={handleQuizSurveySelection} // Pass the specific handler
        isDisabled={isSubmitting || !isInteractive}
        isInteractive={isInteractive}
        className={className}
      />
    );
  }

  if (isJumbleQuestion(currentBlock)) {
    return (
      <JumbleInput
        questionData={currentBlock} // Pass the whole block
        onSubmit={handleJumbleSubmit} // Pass the specific handler
        isSubmitting={isSubmitting}
        isInteractive={isInteractive}
        className={className}
      />
    );
  }

  if (isOpenEndedQuestion(currentBlock)) {
    // Reuse the existing OpenEndedInput component directly
    return (
      <OpenEndedInput
        onSubmit={handleOpenEndedSubmit} // Pass the specific handler
        isDisabled={isSubmitting || !isInteractive}
        className={className}
      // maxLength={...} // Pass maxLength if needed
      />
    );
  }

  // Fallback for unknown types
  console.warn("Unknown or unexpected question block type encountered in AnswerInputArea.", currentBlock); // Log the whole block if possible
  return <div className={cn("text-center text-red-500", className)}>Unsupported question type.</div>;
};

// Memoize the component
const MemoizedAnswerInputArea = memo(AnswerInputArea);
export default MemoizedAnswerInputArea; // Export the memoized version