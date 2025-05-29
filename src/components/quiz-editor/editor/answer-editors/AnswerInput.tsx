// src/components/quiz-editor/editor/answer-editors/AnswerInput.tsx
"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/src/lib/utils';
import type { QuestionHostSchemaType } from '@/src/lib/schemas/quiz-question.schema';
import { RHFTextAreaField } from '@/src/components/rhf/RHFTextAreaField';
import { Button } from '@/src/components/ui/button';
import { Image as ImageIcon, Trash2, Check } from 'lucide-react'; // Added Check for toggle
import { getAnswerOptionStyle } from '@/src/lib/mappings/answerOptionMapping'; // Import the new mapping

interface AnswerInputProps {
    index: number;
    onRemove: () => void;
    isSurvey?: boolean; // To hide/disable correct answer toggle
    className?: string;
}

const AnswerInput: React.FC<AnswerInputProps> = ({
    index,
    onRemove,
    isSurvey = false,
    className,
}) => {
    const { control, watch, setValue } = useFormContext<QuestionHostSchemaType>();
    const { Icon, colorClass } = getAnswerOptionStyle(index);
    const watchedCorrectIndex = watch('correctChoiceIndex');
    const isCorrect = watchedCorrectIndex === index;

    const handleSetCorrect = () => {
        if (!isSurvey) {
            setValue('correctChoiceIndex', index, {
                shouldValidate: true,
                shouldDirty: true,
            });
        }
    };

    return (
        <div
            className={cn(
                'flex items-center gap-2.5 p-2.5 rounded-lg border', // Gap 10px, Padding 10px, Rounded 8px
                'bg-editor-answer-option-bg border-editor-border-color', // Background and default border
                'transition-all duration-150 ease-in-out', // Smooth transition
                isCorrect && !isSurvey ? 'border-l-4 border-l-editor-correct-answer-highlight border-editor-border-color' : 'border-editor-border-color', // Highlight if correct
                className
            )}
        >
            {/* Shape Icon */}
            <div
                className={cn(
                    'w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0',
                    colorClass
                )}
            >
                <Icon className="h-5 w-5 text-white" />
            </div>

            {/* Answer Text Input */}
            <RHFTextAreaField<QuestionHostSchemaType>
                name={`choices.${index}.answer`}
                placeholder={`Đáp án ${index + 1}`}
                className="flex-grow bg-transparent border-none text-editor-text-primary p-2 focus-visible:ring-0 resize-none text-sm placeholder:text-editor-text-placeholder"
                rows={1} // Start with 1 row, auto-grows
                aria-label={`Answer option ${index + 1}`}
            />

            {/* Controls */}
            <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-editor-text-secondary hover:text-white hover:bg-editor-secondary-bg h-8 w-8"
                    aria-label={`Add image to answer ${index + 1}`}
                    onClick={() => console.log('Add image clicked - TBD')} // Placeholder
                >
                    <ImageIcon className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-editor-text-secondary hover:text-editor-danger-color hover:bg-editor-secondary-bg h-8 w-8"
                    onClick={onRemove}
                    aria-label={`Remove answer ${index + 1}`}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {/* Correct Answer Toggle */}
            {!isSurvey && (
                <button
                    type="button" // Important: Prevent form submission if inside a form
                    onClick={handleSetCorrect}
                    className={cn(
                        'w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                        isCorrect
                            ? 'bg-editor-correct-answer-highlight border-editor-correct-answer-highlight'
                            : 'bg-transparent border-editor-border-color hover:bg-editor-secondary-bg'
                    )}
                    aria-label={`Mark answer ${index + 1} as correct`}
                >
                    {isCorrect && <Check className="h-4 w-4 text-white" />}
                </button>
            )}
        </div>
    );
};

export default AnswerInput;