// src/components/game/inputs/AnswerInputArea.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

// --- UPDATED Imports ---
import {
  GameBlock, PlayerAnswerPayload, JumbleChoicePlayer, QuizChoicePlayer, SurveyChoicePlayer,
  isQuizQuestion, isJumbleQuestion, isOpenEndedQuestion, isSurveyQuestion, isContentBlock
} from '@/src/lib/types';
import AnswerButton from './AnswerButton';
import DraggableAnswerItem from './DraggableAnswerItem';
import OpenEndedInput from './OpenEndedInput';
import { Button } from '@/src/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
// --- END UPDATE ---

interface AnswerInputAreaProps {
  // --- UPDATED Prop Type ---
  questionData: GameBlock | null;
  // --- END UPDATE ---
  onAnswerSubmit: (payload: PlayerAnswerPayload) => void;
  isSubmitting: boolean;
  isInteractive?: boolean; // Added: Control interactivity (for Host vs Player)
  className?: string;
}

// Jumble Item now uses the Player choice type
interface JumbleItem extends JumbleChoicePlayer {
  id: UniqueIdentifier; // Use UniqueIdentifier from dnd-kit
  originalIndex: number; // Still needed to map back for submission logic potentially
}


const AnswerInputArea: React.FC<AnswerInputAreaProps> = ({
  questionData: currentBlock, // Rename prop internally
  onAnswerSubmit,
  isSubmitting,
  isInteractive = true, // Default to interactive (for Player view)
  className,
}) => {
  const [jumbleItems, setJumbleItems] = useState<JumbleItem[]>([]);

  useEffect(() => {
    // --- UPDATED: Use type guard ---
    if (currentBlock && isJumbleQuestion(currentBlock)) {
      // Randomize choices *before* setting state for dnd-kit
      const shuffledChoices = [...currentBlock.choices]
        .map((choice, index) => ({ ...choice, originalIndex: index })) // Tag with original index
        .sort(() => Math.random() - 0.5); // Shuffle

      const initialItems = shuffledChoices.map((choice, index) => ({
        ...choice,
        // Generate unique ID based on block index and its *original* index
        id: `jumble-${currentBlock.gameBlockIndex}-${choice.originalIndex}`,
        // Keep track of the originalIndex from before shuffle
        originalIndex: choice.originalIndex,
      }));
      setJumbleItems(initialItems);
    } else {
      setJumbleItems([]);
    }
  }, [currentBlock]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require the mouse to move by 10 pixels before activating
      // Improves compatibility with clickable elements in items
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setJumbleItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // --- Stabilize this handler with useCallback ---
  const handleQuizSurveySelection = useCallback((index: number) => {
    // Add checks inside useCallback to ensure it uses the latest state/props
    if (!currentBlock || isSubmitting || !isInteractive || !(isQuizQuestion(currentBlock) || isSurveyQuestion(currentBlock))) {
      console.warn("[AnswerInputArea] handleQuizSurveySelection called with invalid state/props. CurrentBlock:", currentBlock, "isSubmitting:", isSubmitting, "isInteractive:", isInteractive);
      return;
    }
    // console.log(`[AnswerInputArea] Submitting answer for index ${index}, QIndex: ${currentBlock.questionIndex}, Type: ${currentBlock.type}`);
    onAnswerSubmit({
      type: currentBlock.type, // 'quiz' or 'survey'
      choice: index,
      questionIndex: currentBlock.questionIndex,
    });
  }, [currentBlock, isSubmitting, isInteractive, onAnswerSubmit]); // Add dependencies

  const handleJumbleSubmit = () => {
    // --- UPDATED: Use type guard ---
    if (!currentBlock || isSubmitting || !isInteractive || !isJumbleQuestion(currentBlock) || jumbleItems.length === 0) return;
    // The payload requires the *original* indices in the player's chosen order.
    // Our jumbleItems already store the originalIndex.
    const submittedOriginalIndices = jumbleItems.map(item => item.originalIndex);
    onAnswerSubmit({
      type: 'jumble',
      choice: submittedOriginalIndices,
      questionIndex: currentBlock.questionIndex,
    });
  };

  const handleOpenEndedSubmit = (text: string) => {
    // --- UPDATED: Use type guard ---
    if (!currentBlock || isSubmitting || !isInteractive || !isOpenEndedQuestion(currentBlock)) return;
    onAnswerSubmit({
      type: 'open_ended',
      text: text,
      questionIndex: currentBlock.questionIndex,
    });
  };

  // --- Rendering Logic ---

  if (!currentBlock) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Waiting for question...</span>
      </div>
    );
  }

  // --- ADDED: Handle Content Block ---
  if (isContentBlock(currentBlock)) {
    // Players don't interact with content blocks
    return null; // Or return a minimal placeholder if needed
  }
  // --- END ADD ---

  // --- UPDATED: Use type guards for rendering ---
  if (isQuizQuestion(currentBlock) || isSurveyQuestion(currentBlock)) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3", className)}>
        {currentBlock.choices.map((choice, index) => (
          <AnswerButton
            key={index}
            choice={choice as QuizChoicePlayer | SurveyChoicePlayer} // Type assertion
            index={index}
            onClick={handleQuizSurveySelection}
            isDisabled={isSubmitting || !isInteractive}
            isInteractive={isInteractive} // Pass down interactivity
          />
        ))}
      </div>
    );
  }

  if (isJumbleQuestion(currentBlock)) {
    return (
      <div className={cn("flex flex-col items-stretch gap-4", className)}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={jumbleItems.map(item => item.id)} // Use the unique ID for items
            strategy={verticalListSortingStrategy}
          >
            {jumbleItems.map((item) => (
              <DraggableAnswerItem
                key={item.id}
                id={item.id}
                content={item.answer}
                originalIndex={item.originalIndex} // Pass originalIndex if needed by DraggableItem itself
                isDisabled={isSubmitting || !isInteractive}
              />
            ))}
          </SortableContext>
        </DndContext>
        {/* Only show submit button if interactive */}
        {isInteractive && (
          <Button onClick={handleJumbleSubmit} disabled={isSubmitting || jumbleItems.length === 0} size="lg">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit Order
          </Button>
        )}
      </div>
    );
  }

  if (isOpenEndedQuestion(currentBlock)) {
    return (
      <OpenEndedInput
        onSubmit={handleOpenEndedSubmit}
        isDisabled={isSubmitting || !isInteractive}
        className={className}
      />
    );
  }
  // --- END UPDATE ---


  // Fallback for unknown types (shouldn't happen with type guards)
  // console.warn("Unknown question type in AnswerInputArea:", currentBlock?.type);
  return <div className="text-center text-red-500">Unsupported question type.</div>;
};

export default AnswerInputArea;