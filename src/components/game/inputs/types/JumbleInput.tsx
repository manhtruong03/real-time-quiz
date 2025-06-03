// src/components/game/inputs/types/JumbleInput.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    UniqueIdentifier,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
    JumbleChoicePlayer,
    PlayerAnswerPayload,
    QuestionJumble,
} from "@/src/lib/types";
import DraggableAnswerItem from "../DraggableAnswerItem";
import { Button } from "@/src/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface JumbleItemState extends JumbleChoicePlayer {
    id: string; // Should be stable, e.g., `jumble-item-${questionIndex}-${originalReceivedIndex}`
    originalIndex: number; // Index within the initially received choices array
    answer: string;
}

interface JumbleInputProps {
    questionData: QuestionJumble;
    onSubmit: (orderedOriginalIndices: number[]) => void;
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

    useEffect(() => {
        // Generate stable IDs based on question index and the original index as received
        const initialItems = questionData.choices.map((choice, index) => ({
            ...choice,
            // --- Ensure ID is stable and unique per item ---
            id: `jumble-item-${questionData.gameBlockIndex}-${index}`, // Use original received index
            // --- End ID generation ---
            originalIndex: index,
            answer: choice.answer,
        }));
        setItems(initialItems);
    }, [questionData]); // Re-run only when the question data changes

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Reduced distance slightly
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setItems((currentItems) => {
                const oldIndex = currentItems.findIndex(
                    (item) => item.id === active.id
                );
                const newIndex = currentItems.findIndex((item) => item.id === over.id);
                if (oldIndex === -1 || newIndex === -1) return currentItems; // Safety check
                return arrayMove(currentItems, oldIndex, newIndex);
            });
        }
    }, []); // No dependencies needed as setItems uses functional update

    const handleSubmit = () => {
        if (!isInteractive || isSubmitting || items.length === 0) return;
        // The payload needs the original indices IN THE NEW order.
        const submittedOriginalIndices = items.map((item) => item.originalIndex);
        onSubmit(submittedOriginalIndices);
    };

    return (
        <div className={cn("flex flex-col items-stretch gap-2", className)}>
            {" "}
            {/* Reduced gap slightly */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                {/* --- FIX: Use item.id for the items array --- */}
                <SortableContext items={items.map(item => item.id)} /* ... */ >
                    {items.map((item, index) => ( // Get the current index from map
                        <DraggableAnswerItem
                            key={item.id}
                            id={item.id}
                            content={item.answer}
                            originalIndex={item.originalIndex}
                            indexInList={index} // <-- PASS CURRENT INDEX FOR STYLING
                            isDisabled={isSubmitting || !isInteractive}
                        />
                    ))}
                </SortableContext>
                {/* --- END FIX --- */}
            </DndContext>
            {isInteractive && (
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || items.length === 0}
                    size="lg"
                    className="mt-2"
                >
                    {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Submit Order
                </Button>
            )}
        </div>
    );
};
