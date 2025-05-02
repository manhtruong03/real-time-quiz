// src/components/game/inputs/types/JumbleInput.tsx
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
import { JumbleChoicePlayer, PlayerAnswerPayload, QuestionJumble } from '@/src/lib/types'; // Adjust path
import DraggableAnswerItem from '../DraggableAnswerItem'; // Adjust path
import { Button } from '@/src/components/ui/button'; // Adjust path
import { Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

// Jumble Item state within this component
interface JumbleItemState extends JumbleChoicePlayer {
    id: UniqueIdentifier; // Use UniqueIdentifier from dnd-kit
    originalIndex: number; // Keep track of the original index from the *host* perspective
}

interface JumbleInputProps {
    // Pass the full Jumble question block to easily get index and choices
    questionData: QuestionJumble;
    onSubmit: (orderedOriginalIndices: number[]) => void; // Callback with the result
    isSubmitting: boolean;
    isInteractive: boolean;
    className?: string;
}

export const JumbleInput: React.FC<JumbleInputProps> = ({
    questionData,
    onSubmit,
    isSubmitting,
    isInteractive,
    className,
}) => {
    const [items, setItems] = useState<JumbleItemState[]>([]);

    // Initialize and shuffle items when questionData changes
    useEffect(() => {
        // Player receives already shuffled choices in questionData.choices for Jumble
        // We need to map them to state with stable IDs and track their original index relative to host definition
        // This assumes the host *doesn't* shuffle before sending, or we need another way to track original indices.
        // LET'S REVISIT JUMBLE LOGIC IF NEEDED - Assuming `questionData.choices` is what the player sees and needs to reorder.
        // We need a way to link these back to the *original* non-shuffled indices for the submission payload.
        // Option 1: Modify PlayerAnswerPayload to send the submitted text order (simpler)
        // Option 2: Add originalIndex to the choices sent in Phase 2 (better but requires backend change)
        // Option 3: Try to reconstruct based on text match (fragile)

        // Sticking with current structure: Assume player orders the items they received.
        // The 'originalIndex' here will refer to the index *within the received choices array*.
        // The onSubmit callback needs careful handling in AnswerInputArea to map back.
        const initialItems = questionData.choices.map((choice, index) => ({
            ...choice,
            id: `jumble-<span class="math-inline">\{questionData\.gameBlockIndex\}\-</span>{index}`, // ID based on received index
            originalIndex: index, // Index as received by player
        }));
        setItems(initialItems);

    }, [questionData]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setItems((currentItems) => {
                const oldIndex = currentItems.findIndex((item) => item.id === active.id);
                const newIndex = currentItems.findIndex((item) => item.id === over.id);
                // console.log(`Moving item from index ${oldIndex} to ${newIndex}`);
                return arrayMove(currentItems, oldIndex, newIndex);
            });
        }
    }, []); // No dependencies needed if setItems is stable

    const handleSubmit = () => {
        if (!isInteractive || isSubmitting || items.length === 0) return;
        // IMPORTANT: The payload needs the *original* indices from the HOST definition (Phase 1)
        // in the order the player arranged them. Since we only have the indices of the received
        // (potentially shuffled) choices, we need to map back.
        // THIS IS COMPLEX and requires knowing the mapping.
        // SIMPLIFICATION for now: Let's assume the `originalIndex` we stored somehow maps back,
        // OR we change the payload contract (e.g., send submitted text array).
        // Assuming `item.originalIndex` *IS* the original host index for now. Needs verification/adjustment.
        const submittedOriginalIndices = items.map(item => item.originalIndex); // THIS ASSUMPTION MIGHT BE WRONG
        console.warn("Jumble Submit: Assuming item.originalIndex maps correctly to host definition. Verify this mapping.");
        onSubmit(submittedOriginalIndices);
    };

    return (
        <div className={cn("flex flex-col items-stretch gap-4", className)}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={items.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {items.map((item) => (
                        <DraggableAnswerItem
                            key={item.id}
                            id={item.id}
                            content={item.answer}
                            originalIndex={item.originalIndex} // Pass original index (relative to received list)
                            isDisabled={isSubmitting || !isInteractive}
                        />
                    ))}
                </SortableContext>
            </DndContext>
            {isInteractive && (
                <Button onClick={handleSubmit} disabled={isSubmitting || items.length === 0} size="lg">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Submit Order
                </Button>
            )}
        </div>
    );
};