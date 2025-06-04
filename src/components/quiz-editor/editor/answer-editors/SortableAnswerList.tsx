// src/components/quiz-editor/editor/answer-editors/SortableAnswerList.tsx
"use client";

import React, { useCallback } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    UniqueIdentifier, // Import UniqueIdentifier
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useFormContext, useFieldArray } from "react-hook-form";
import DraggableEditorAnswerItem from "./DraggableEditorAnswerItem";
import type { QuestionHostSchemaType } from '@/src/lib/schemas/quiz-question.schema';
import { cn } from "@/src/lib/utils";

interface SortableAnswerListProps {
    className?: string;
}

const SortableAnswerList: React.FC<SortableAnswerListProps> = ({ className }) => {
    const { control } = useFormContext<QuestionHostSchemaType>();
    const { fields, move } = useFieldArray({
        control,
        name: "choices",
        keyName: "fieldId"
    });

    console.log('[SortableAnswerList Render] Mảng trường RHF:', JSON.stringify(fields, null, 2));
    console.log(`[SortableAnswerList Render] Số lượng trường: ${fields.length}`);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = fields.findIndex((field) => field.fieldId === active.id);
            const newIndex = fields.findIndex((field) => field.fieldId === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                move(oldIndex, newIndex);
            }
        }
    }, [fields, move]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={fields.map(field => field.fieldId)}
                strategy={verticalListSortingStrategy}
            >
                <div className={cn("space-y-2", className)}>
                    {fields.length === 0 && (
                        <p className="text-muted-foreground italic text-center p-4">
                            Đang tải các lựa chọn hoặc chưa có lựa chọn nào được định nghĩa...
                        </p>
                    )}
                    {fields.map((field, index) => {
                        // *** FIX: Pass current index as originalIndex for now ***
                        const originalIndexForStyling = (field as any).originalIndex !== undefined ? (field as any).originalIndex : index; // Attempt to get it from field, fallback to current index

                        return (
                            <DraggableEditorAnswerItem
                                key={field.fieldId}
                                id={field.fieldId} // This is correct for dnd-kit
                                index={index}    // This is the current visual index in the list
                                originalIndex={originalIndexForStyling} // <<<< THIS IS CRUCIAL for stable styling
                                fieldNamePrefix={`choices.${index}`}
                            />
                        );
                    })}
                </div>
            </SortableContext>
        </DndContext>
    );
};

export default SortableAnswerList;