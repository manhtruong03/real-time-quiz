// src/components/game/player/views/PlayerActiveQuestionView.tsx
import React, { useState, useEffect } from 'react';
// --- Corrected Imports ---
import {
    GameBlock,
    PlayerAnswerPayload,
    ContentBlock, // Import ContentBlock
    QuestionQuiz, // Import specific types if needed for clarity
    QuestionJumble,
    QuestionOpenEnded,
    QuestionSurvey
} from '@/src/lib/types'; // Adjust path if needed
// --- End Corrected Imports ---
import QuestionDisplay from '../../display/QuestionDisplay';
import MediaDisplay from '../../display/MediaDisplay';
import AnswerInputArea from '../../inputs/AnswerInputArea';
import { Progress } from '@/src/components/ui/progress';

// Define the specific type for the block prop more explicitly
type ActiveBlock = QuestionQuiz | QuestionJumble | QuestionOpenEnded | QuestionSurvey;

interface PlayerActiveQuestionViewProps {
    block: ActiveBlock; // Use the specific union type
    onSubmitAnswer: (payload: PlayerAnswerPayload) => void;
    isSubmitting: boolean;
}

export const PlayerActiveQuestionView: React.FC<PlayerActiveQuestionViewProps> = ({
    block, // Type is now ActiveBlock
    onSubmitAnswer,
    isSubmitting
}) => {
    // Use the specific type 'ActiveBlock' to ensure properties exist
    const [timeLeft, setTimeLeft] = useState(block.timeAvailable ?? 0);
    const [timerKey, setTimerKey] = useState(block.gameBlockIndex);

    useEffect(() => {
        // Type guard might not even be needed here as ContentBlock is excluded by prop type
        if (block.timeAvailable > 0 && !isSubmitting) {
            const initialTime = block.timeAvailable;
            setTimeLeft(initialTime);
            setTimerKey(block.gameBlockIndex);

            const interval = setInterval(() => {
                // --- Add type for prev ---
                setTimeLeft((prev: number) => {
                    if (prev <= 100) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 100;
                });
            }, 100);
            return () => clearInterval(interval);
        } else {
            setTimeLeft(0);
        }
    }, [block, isSubmitting]); // block has type ActiveBlock here

    // Accessing properties should now be safe due to ActiveBlock type
    const showTimer = timeLeft > 0 && block.timeAvailable > 0 && !isSubmitting;
    const timePercentage = showTimer ? (timeLeft / block.timeAvailable) * 100 : 0;
    const secondsLeft = showTimer ? Math.ceil(timeLeft / 1000) : 0;

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col flex-grow justify-start">
            <div className="mb-3 md:mb-4">
                {/* Pass block directly - MediaDisplay expects GameBlock | null, ActiveBlock is compatible */}
                <MediaDisplay questionData={block} className="w-full max-w-xs md:max-w-sm mx-auto mb-3 md:mb-4" />
                <QuestionDisplay
                    title={block.title} // block is ActiveBlock, which has title
                    className="text-base md:text-xl bg-background/80 dark:bg-black/60 backdrop-blur-sm p-3 rounded-md shadow"
                />
            </div>
            {showTimer && (
                <div className="relative w-full h-3 md:h-4 mb-3 md:mb-4">
                    <Progress
                        value={timePercentage}
                        className="absolute inset-0 h-full"
                        key={`timer-${timerKey}`}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-[10px] md:text-xs font-bold text-primary-foreground px-1 bg-primary/70 rounded-sm">
                            {secondsLeft}
                        </span>
                    </div>
                </div>
            )}
            <div className="mt-auto">
                {/* Pass block directly - AnswerInputArea expects GameBlock | null */}
                <AnswerInputArea
                    questionData={block}
                    onAnswerSubmit={onSubmitAnswer}
                    isSubmitting={isSubmitting}
                    isInteractive={!isSubmitting}
                />
            </div>
        </div>
    );
};