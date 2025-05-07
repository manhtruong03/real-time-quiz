// src/components/quiz-editor/editor/answer-editors/DraggableEditorAnswerItem.tsx
"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useFormContext } from 'react-hook-form';
import type { Path } from 'react-hook-form';
import { GripVertical, Triangle, Diamond, Circle, Square, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { RHFTextAreaField } from '@/src/components/rhf/RHFTextAreaField';
import { Button } from '@/src/components/ui/button';
import type { QuestionHostSchemaType } from '@/src/lib/schemas/quiz-question.schema';

// Mapping for colors and icons
const playerButtonMapping = [
    { Icon: Triangle, colorClasses: 'border-red-500 bg-red-500/5', iconColor: 'text-red-500' },
    { Icon: Diamond, colorClasses: 'border-blue-500 bg-blue-500/5', iconColor: 'text-blue-500' },
    { Icon: Circle, colorClasses: 'border-yellow-500 bg-yellow-500/5', iconColor: 'text-yellow-500' },
    { Icon: Square, colorClasses: 'border-green-500 bg-green-500/5', iconColor: 'text-green-500' },
];

interface DraggableEditorAnswerItemProps {
    id: string; // Unique ID for dnd-kit (field.fieldId from useFieldArray)
    index: number; // Current index in the sorted list
    // *** ADD BACK originalIndex PROP ***
    originalIndex: number; // Index for determining consistent styling
    fieldNamePrefix: Path<QuestionHostSchemaType>; // e.g., "choices.0", "choices.1"
}

const DraggableEditorAnswerItemComponent: React.FC<DraggableEditorAnswerItemProps> = ({
    id,
    index,
    originalIndex, // <<< Use this prop
    fieldNamePrefix,
}) => {
    const { control } = useFormContext<QuestionHostSchemaType>();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 'auto',
        opacity: isDragging ? 0.8 : 1,
    };

    // *** FIX: Style based on originalIndex ***
    const { Icon, colorClasses, iconColor } = playerButtonMapping[originalIndex % playerButtonMapping.length] || playerButtonMapping[0];
    const answerFieldName = `${fieldNamePrefix}.answer` as Path<QuestionHostSchemaType>;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative flex items-center gap-2 p-2 border rounded-lg bg-background shadow-sm transition-colors",
                colorClasses, // Apply color border based on original index
                isDragging ? 'shadow-lg scale-[1.01]' : '',
                'touch-none'
            )}
        >
            {/* Drag Handle */}
            <button
                type="button"
                {...attributes}
                {...listeners}
                aria-label="Drag to reorder answer"
                className={cn(
                    "p-1 cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground flex-shrink-0",
                    isDragging && 'cursor-grabbing'
                )}
            >
                <GripVertical className="h-5 w-5" />
            </button>

            {/* Shape Indicator */}
            <div className={cn("flex-shrink-0", iconColor)}>
                <Icon className="h-5 w-5" />
            </div>

            {/* Main Content Area */}
            <div className="flex-grow flex flex-col gap-1">
                <RHFTextAreaField<QuestionHostSchemaType>
                    key={answerFieldName}
                    name={answerFieldName}
                    placeholder={`Option ${index + 1}...`} // Label uses current index
                    className="text-sm border-none focus-visible:ring-0 p-1 bg-transparent min-h-[30px]"
                    rows={1}
                />
                {/* Image Button Placeholder */}
                <Button variant="ghost" size="icon" className="h-6 w-6 self-start text-muted-foreground hover:text-foreground" disabled title="Add image (Not implemented)">
                    <ImageIcon className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
};

const DraggableEditorAnswerItem = React.memo(DraggableEditorAnswerItemComponent); // Wrap with React.memo
export default DraggableEditorAnswerItem;