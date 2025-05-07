// src/components/quiz-editor/editor/answer-editors/AnswerInput.tsx
"use client";

import React from 'react';
import { useFormContext, Controller, Path } from 'react-hook-form'; // Import Path
import { cn } from '@/src/lib/utils';
import { RHFTextAreaField } from '@/src/components/rhf/RHFTextAreaField';
import { Button } from '@/src/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group';
import { Label } from '@/src/components/ui/label';
import { Triangle, Diamond, Circle, Square, Image as ImageIcon, Trash2, Check } from 'lucide-react';
import type { QuestionHostSchemaType } from '@/src/lib/schemas/quiz-question.schema';

// Mapping remains the same
const answerOptionMapping = [
    // ... (mapping details)
    { Icon: Triangle, colorClasses: 'border-red-500 hover:bg-red-500/10', iconColor: 'text-red-500' },
    { Icon: Diamond, colorClasses: 'border-blue-500 hover:bg-blue-500/10', iconColor: 'text-blue-500' },
    { Icon: Circle, colorClasses: 'border-yellow-500 hover:bg-yellow-500/10', iconColor: 'text-yellow-500' },
    { Icon: Square, colorClasses: 'border-green-500 hover:bg-green-500/10', iconColor: 'text-green-500' },
];

interface AnswerInputProps {
    index: number;
    onRemove: (index: number) => void;
    fieldId: string;
    isSurvey: boolean;
}

export const AnswerInput: React.FC<AnswerInputProps> = ({
    index,
    onRemove,
    fieldId,
    isSurvey,
}) => {
    const { control, register, setValue, watch } = useFormContext<QuestionHostSchemaType>();
    const { Icon, colorClasses, iconColor } = answerOptionMapping[index % answerOptionMapping.length] || answerOptionMapping[0];
    // --- Explicitly type the field name ---
    const answerFieldName = `choices.${index}.answer` as Path<QuestionHostSchemaType>;

    const correctChoiceIndex = watch('correctChoiceIndex');
    const isCorrect = correctChoiceIndex === index;

    const handleCorrectChange = () => {
        setValue('correctChoiceIndex', index, { shouldValidate: true, shouldDirty: true });
    };

    return (
        <div
            key={fieldId}
            className={cn(
                "relative flex items-start gap-2 p-3 border rounded-lg bg-background shadow-sm transition-colors",
                colorClasses,
                isCorrect && !isSurvey && "ring-2 ring-offset-1 ring-green-500"
            )}
        >
            {/* Shape Indicator */}
            <div className={cn("mt-1 flex-shrink-0", iconColor)}>
                <Icon className="h-5 w-5" />
            </div>

            {/* Main Content Area */}
            <div className="flex-grow flex flex-col gap-2">
                {/* Answer Text Input */}
                <RHFTextAreaField<QuestionHostSchemaType>
                    // --- Use the typed field name ---
                    name={answerFieldName}
                    placeholder={`Answer ${index + 1}...`}
                    className="text-sm border-none focus-visible:ring-0 p-1 bg-transparent min-h-[40px]"
                    rows={2}
                />
                {/* Image Button Placeholder */}
                <Button variant="ghost" size="icon" className="h-7 w-7 self-start text-muted-foreground" disabled title="Add image (Phase 4)">
                    <ImageIcon className="h-4 w-4" />
                </Button>
            </div>

            {/* Controls Area */}
            <div className="flex flex-col items-center gap-2 ml-auto flex-shrink-0">
                {/* Correct Answer Selector */}
                {!isSurvey && (
                    <div title="Mark as correct answer" className="flex items-center justify-center h-7 w-7">
                        <input
                            type="radio"
                            id={`correct-choice-${fieldId}`}
                            name="correctChoiceIndex"
                            value={index}
                            checked={isCorrect}
                            onChange={handleCorrectChange}
                            className="sr-only peer"
                        />
                        <Label
                            htmlFor={`correct-choice-${fieldId}`}
                            className={cn(
                                "flex items-center justify-center h-6 w-6 rounded-full border border-muted-foreground cursor-pointer transition-colors",
                                "peer-checked:bg-green-500 peer-checked:border-green-600 peer-checked:text-white",
                                "hover:bg-accent hover:text-accent-foreground",
                                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                            )}
                        >
                            {isCorrect && <Check className="h-4 w-4" />}
                        </Label>
                    </div>
                )}
                {/* Delete Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(index)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    title="Remove answer"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export default AnswerInput;