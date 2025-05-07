// src/components/quiz-editor/sidebar/QuestionConfigurationSidebar.tsx
"use client";

import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/src/lib/utils';
import type { QuestionHostSchemaType, ChoiceHostSchemaType } from '@/src/lib/schemas/quiz-question.schema';
import type { QuestionHost } from '@/src/lib/types';
import { RHFSelectField } from '@/src/components/rhf/RHFSelectField';
import SlideActions from '../sidebar/SlideActions'; // Corrected path
import { DEFAULT_TIME_LIMIT } from '@/src/lib/game-utils/quiz-creation';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    // AlertDialogTrigger, // We will trigger it manually
} from "@/src/components/ui/alert-dialog"; // Import AlertDialog components

interface QuestionConfigurationSidebarProps {
    onConfirmDelete: () => void;
    onConfirmDuplicate: () => void;
    className?: string;
}

// Options definitions remain the same...
const questionTypeOptions = [
    { value: 'quiz', label: 'Quiz (Multiple Choice)' },
    // { value: 'quiz-tf', label: 'True / False' }, // Keep for display selection in dropdown trigger
    { value: 'jumble', label: 'Jumble' },
    { value: 'survey', label: 'Poll / Survey' },
    { value: 'open_ended', label: 'Type Answer' },
    { value: 'content', label: 'Content Slide' },
];
const timeLimitOptions = [
    { value: '5000', label: '5 Seconds' },
    { value: '10000', label: '10 Seconds' },
    { value: '20000', label: '20 Seconds' },
    { value: '30000', label: '30 Seconds' },
    { value: '60000', label: '1 Minute' },
    { value: '90000', label: '1.5 Minutes' },
    { value: '120000', label: '2 Minutes' },
];
const pointsOptions = [
    { value: '0', label: 'No Points' },
    { value: '1', label: 'Standard Points (x1)' },
    { value: '2', label: 'Double Points (x2)' },
];
const answerOptions = [
    { value: 'single', label: 'Single Select' },
    { value: 'multi', label: 'Multi-select (Not implemented)' },
];


export const QuestionConfigurationSidebar: React.FC<QuestionConfigurationSidebarProps> = ({
    onConfirmDelete,
    onConfirmDuplicate,
    className
}) => {
    const { control, watch, setValue } = useFormContext<QuestionHostSchemaType>();// Added control, watch, setValue for completeness from previous steps
    const watchedType = watch('type');
    const choices = watch('choices');

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // State for dialog

    const isSurvey = watchedType === 'survey';
    const isContent = watchedType === 'content';
    const isLikelyTrueFalse = watchedType === 'quiz' &&
        choices?.length === 2 &&
        choices.some((c: ChoiceHostSchemaType) => c.answer === 'True') &&
        choices.some((c: ChoiceHostSchemaType) => c.answer === 'False');

    const handleValueChange = (value: string) => {
        let targetType: QuestionHost['type'];
        if (value === 'quiz-tf') {
            targetType = 'quiz';
        } else {
            targetType = value as QuestionHost['type'];
        }
        setValue('type', targetType, { shouldValidate: true, shouldDirty: true });
        console.log(`[Sidebar Select] RHF type set to: ${targetType}`);
    };

    const handleDeleteClick = () => {
        setIsDeleteDialogOpen(true); // Open confirmation dialog
    };

    const handleConfirmDeleteAction = () => {
        onConfirmDelete(); // Call the prop passed from parent
        setIsDeleteDialogOpen(false);
    };

    const handleDuplicateClick = () => {
        // Directly call the passed prop. No confirmation needed for duplicate by default,
        // but one could be added here if desired, similar to delete.
        onConfirmDuplicate();
    };
    return (
        <>
            <div className={cn("flex flex-col h-full space-y-6", className)}>
                {/* Question Type Select */}
                <div>
                    <RHFSelectField<QuestionHostSchemaType>
                        name="type"
                        label="Question Type"
                        options={questionTypeOptions}
                        placeholder="Select type..."
                        onValueChange={handleValueChange}
                    />
                </div>

                {/* Time Limit */}
                {!isContent && (
                    <div>
                        <RHFSelectField<QuestionHostSchemaType>
                            name="time"
                            label="Time Limit"
                            options={timeLimitOptions}
                            placeholder="Select time..."
                            onValueChange={(value) => setValue('time', parseInt(value, 10) || DEFAULT_TIME_LIMIT, { shouldValidate: true, shouldDirty: true })}
                        />
                    </div>
                )}

                {/* Points */}
                {!(isContent || isSurvey) && (
                    <div>
                        <RHFSelectField<QuestionHostSchemaType>
                            name="pointsMultiplier"
                            label="Points"
                            options={pointsOptions}
                            placeholder="Select points..."
                            onValueChange={(value) => setValue('pointsMultiplier', parseInt(value, 10), { shouldValidate: true, shouldDirty: true })}
                        />
                    </div>
                )}

                {/* Answer Options */}
                {/* {watchedType === 'quiz' && !isLikelyTrueFalse && (
                    <div>
                        <RHFSelectField<any>
                            name="answerOptionsConfig"
                            label="Answer Options"
                            options={answerOptions}
                            placeholder="Select options..."
                            disabled={true}
                        />
                        <p className="text-xs text-muted-foreground mt-1 italic">(Multi-select coming soon)</p>
                    </div>
                )} */}

                {/* Slide Actions */}
                <div className="mt-auto border-t pt-4">
                    <SlideActions
                        onDelete={handleDeleteClick} // Open dialog
                        onDuplicate={handleDuplicateClick}
                    />
                </div>
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the
                            current slide.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDeleteAction}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default QuestionConfigurationSidebar;