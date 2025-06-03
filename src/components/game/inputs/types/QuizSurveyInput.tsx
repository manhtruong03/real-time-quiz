// src/components/game/inputs/types/QuizSurveyInput.tsx
import React from 'react';
import { QuizChoicePlayer, SurveyChoicePlayer, PlayerAnswerPayload } from '@/src/lib/types'; // Adjust path
import AnswerButton from '../AnswerButton'; // Adjust path relative to this new file
import { cn } from '@/src/lib/utils';

interface QuizSurveyInputProps {
    choices: (QuizChoicePlayer | SurveyChoicePlayer)[];
    onSelect: (index: number) => void; // Simplified callback name
    isDisabled: boolean;
    isInteractive: boolean;
    className?: string;
}

export const QuizSurveyInput: React.FC<QuizSurveyInputProps> = ({
    choices,
    onSelect,
    isDisabled,
    isInteractive,
    className,
}) => (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3", className)}>
        {choices.map((choice, index) => (
            <AnswerButton
                key={index} // Assuming index is stable for the duration of the question
                choice={choice}
                index={index}
                onClick={onSelect} // Use the passed callback
                isDisabled={isDisabled}
                isInteractive={isInteractive}
            />
        ))}
    </div>
);