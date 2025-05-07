// src/components/quiz-editor/sidebar/QuestionConfigurationSidebar.tsx
"use client";

import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/src/lib/utils';
import type { QuestionHostSchemaType, ChoiceHostSchemaType } from '@/src/lib/schemas/quiz-question.schema';
import type { QuestionHost } from '@/src/lib/types';
import { RHFSelectField } from '@/src/components/rhf/RHFSelectField';
import SlideActions from '../sidebar/SlideActions'; // Corrected path
import { DEFAULT_TIME_LIMIT } from '@/src/lib/game-utils/quiz-creation';

interface QuestionConfigurationSidebarProps {
    // <<< FIX: Make prop optional >>>
    onTypeChange?: (newType: QuestionHost['type'], isTrueFalseOverride?: boolean) => void;
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
    // onTypeChange, // Prop is now optional, no direct call needed here
    className
}) => {
    const { control, watch, setValue } = useFormContext<QuestionHostSchemaType>();
    const watchedType = watch('type'); // The actual type stored in RHF state ('quiz', 'jumble', etc.)
    const choices = watch('choices'); // Watch choices to help determine T/F visually

    const isSurvey = watchedType === 'survey';
    const isContent = watchedType === 'content';

    // This logic helps determine if the *current* state *looks* like T/F,
    // primarily to adjust the visual display in the Select Trigger if needed.
    const isLikelyTrueFalse = watchedType === 'quiz' &&
        choices?.length === 2 &&
        choices.some((c: ChoiceHostSchemaType) => c.answer === 'True') &&
        choices.some((c: ChoiceHostSchemaType) => c.answer === 'False');

    // The value to visually *show* in the SelectTrigger.
    // We still bind RHFSelectField to 'type', which holds the actual value ('quiz', 'jumble', etc.).
    // But the SelectTrigger can display a different label temporarily.
    // NOTE: RHFSelectField doesn't directly support changing the displayed text separate from the value easily.
    // A simpler approach is to just let RHF handle the display based on the actual 'type' value.
    // The 'quiz-tf' option in the dropdown allows the *user* to signal intent,
    // and the handleTypeChange logic in the parent handles the T/F structure creation.
    const handleValueChange = (value: string) => {
        // This function is called when the user selects *any* item from the dropdown.
        // We need to figure out the actual type and the T/F override flag.
        let targetType: QuestionHost['type'];
        let isTFOverride = false;

        if (value === 'quiz-tf') {
            targetType = 'quiz'; // Actual RHF type is 'quiz'
            isTFOverride = true; // Signal that T/F structure is desired
        } else {
            targetType = value as QuestionHost['type'];
            isTFOverride = false;
        }

        // Update RHF state. The useEffect in QuestionEditorView will detect this change
        // and call handleTypeChange with the correct targetType and isTFOverride flag.
        setValue('type', targetType, { shouldValidate: true, shouldDirty: true });
        console.log(`[Sidebar Select] RHF type set to: ${targetType}`);
    };


    return (
        <div className={cn("flex flex-col h-full space-y-6", className)}>
            {/* Question Type Select */}
            <div>
                <RHFSelectField<QuestionHostSchemaType>
                    name="type" // RHF binds this to the form state
                    label="Question Type"
                    options={questionTypeOptions} // Includes 'quiz-tf' for user selection
                    placeholder="Select type..."
                    // Use the custom onValueChange to handle 'quiz-tf' selection
                    onValueChange={handleValueChange}
                // Use the RHF value for the Select's internal state, but allow visual override potentially?
                // For now, keep it simple: RHF controls the value.
                // value={watchedType} // Let RHF Controller handle value
                />
                {/* Debugging output */}
                {/* <p className="text-xs mt-1 text-muted-foreground">RHF Type: {watchedType} | isLikelyTF: {isLikelyTrueFalse ? 'Yes' : 'No'}</p> */}
            </div>

            {/* Time Limit */}
            {!isContent && (
                <div>
                    <RHFSelectField<QuestionHostSchemaType>
                        name="time"
                        label="Time Limit"
                        options={timeLimitOptions}
                        placeholder="Select time..."
                        // Use custom handler to ensure value is parsed correctly
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
                        // Parse value before setting
                        onValueChange={(value) => setValue('pointsMultiplier', parseInt(value, 10), { shouldValidate: true, shouldDirty: true })}
                    />
                </div>
            )}

            {/* Answer Options (Only show for standard Quiz) */}
            {watchedType === 'quiz' && !isLikelyTrueFalse && (
                <div>
                    <RHFSelectField<any> // Use 'any' for now, not directly tied to schema
                        name="answerOptionsConfig" // Temporary name
                        label="Answer Options"
                        options={answerOptions}
                        placeholder="Select options..."
                        disabled={true} // Multi-select not implemented
                    />
                    <p className="text-xs text-muted-foreground mt-1 italic">(Multi-select coming soon)</p>
                </div>
            )}


            {/* Slide Actions */}
            <div className="mt-auto border-t pt-4">
                <SlideActions
                    onDelete={() => console.log("Delete Clicked (Not Implemented)")}
                    onDuplicate={() => console.log("Duplicate Clicked (Not Implemented)")}
                />
            </div>
        </div>
    );
};

export default QuestionConfigurationSidebar;