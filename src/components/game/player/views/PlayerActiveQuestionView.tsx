// src/components/game/player/views/PlayerActiveQuestionView.tsx
'use client'; // Add if not present

import React, { useState, useEffect, useRef } from 'react'; // Import useRef
// --- Type Imports remain the same ---
import {
    GameBlock,
    PlayerAnswerPayload,
    ContentBlock,
    QuestionQuiz,
    QuestionJumble,
    QuestionOpenEnded,
    QuestionSurvey
} from '@/src/lib/types';
import QuestionDisplay from '../../display/QuestionDisplay';
import MediaDisplay from '../../display/MediaDisplay';
import AnswerInputArea from '../../inputs/AnswerInputArea';
import { Progress } from '@/src/components/ui/progress';

type ActiveBlock = QuestionQuiz | QuestionJumble | QuestionOpenEnded | QuestionSurvey;

interface PlayerActiveQuestionViewProps {
    block: ActiveBlock;
    onSubmitAnswer: (payload: PlayerAnswerPayload) => void;
    isSubmitting: boolean;
}

export const PlayerActiveQuestionView: React.FC<PlayerActiveQuestionViewProps> = ({
    block,
    onSubmitAnswer,
    isSubmitting
}) => {
    // State for displaying time, updated frequently
    const [timeLeft, setTimeLeft] = useState(block.timeAvailable ?? 0);
    // Ref to store the absolute start time of the current question timer
    const startTimeRef = useRef<number | null>(null);
    // Ref to store the interval ID
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // --- Timer Initialization & Update Logic ---
        if (block.timeAvailable > 0 && !isSubmitting) {
            console.log(`[Player Timer] Initializing for Q${block.gameBlockIndex}, time: ${block.timeAvailable}`);
            // Record the start time when the block changes or submission ends
            startTimeRef.current = Date.now();
            // Initialize display time
            setTimeLeft(block.timeAvailable);

            // Clear any existing interval from previous question/state
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            // Set up the interval to update the display
            intervalRef.current = setInterval(() => {
                if (!startTimeRef.current) {
                    // Safety check - stop if start time isn't set
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    return;
                }

                const currentTime = Date.now();
                const elapsedTime = currentTime - startTimeRef.current;
                const actualTimeLeft = Math.max(0, block.timeAvailable - elapsedTime);

                setTimeLeft(actualTimeLeft); // Update display state

                // Stop the interval if time runs out
                if (actualTimeLeft <= 0) {
                    console.log(`[Player Timer] Time ran out for Q${block.gameBlockIndex}`);
                    if (intervalRef.current) clearInterval(intervalRef.current);
                }
            }, 100); // Update roughly every 100ms

        } else {
            // If question has no time or answer is submitted, ensure timer shows 0 and interval is cleared
            setTimeLeft(0);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            startTimeRef.current = null; // Clear start time
        }

        // --- Cleanup Function ---
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                // console.log(`[Player Timer] Cleared interval on cleanup/change for Q${block.gameBlockIndex}`);
            }
        };
        // Dependencies: Re-run when the question block changes or submission status changes
    }, [block, isSubmitting]);

    // --- Render Logic ---
    const showTimer = timeLeft > 0 && block.timeAvailable > 0 && !isSubmitting;
    // Calculate percentage based on the potentially non-zero initial time
    const timePercentage = block.timeAvailable > 0 ? Math.max(0, (timeLeft / block.timeAvailable) * 100) : 0;
    const secondsLeft = showTimer ? Math.ceil(timeLeft / 1000) : 0;

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col flex-grow justify-start">
            <div className="mb-3 md:mb-4">
                <MediaDisplay questionData={block} className="w-full max-w-xs md:max-w-sm mx-auto mb-3 md:mb-4" />
                <QuestionDisplay
                    title={block.title}
                    className="text-base md:text-xl bg-background/80 dark:bg-black/60 backdrop-blur-sm p-3 rounded-md shadow"
                />
            </div>

            {/* --- Timer Display (uses state updated by timestamp logic) --- */}
            {block.timeAvailable > 0 && ( // Only show progress bar if the question is timed
                <div className="relative w-full h-3 md:h-4 mb-3 md:mb-4">
                    <Progress
                        // Use block.gameBlockIndex as key ONLY if you want animation reset on *every* question
                        // Using timeLeft directly might cause rapid updates but reflects true progress
                        key={`timer-progress-${block.gameBlockIndex}`}
                        value={timePercentage}
                        className="absolute inset-0 h-full"
                    />
                    {showTimer && ( // Only show seconds if timer should be visible
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-[10px] md:text-xs font-bold text-primary-foreground px-1 bg-primary/70 rounded-sm">
                                {secondsLeft}
                            </span>
                        </div>
                    )}
                </div>
            )}
            {/* --- End Timer Display --- */}

            <div className="mt-auto">
                <AnswerInputArea
                    questionData={block}
                    onAnswerSubmit={onSubmitAnswer}
                    isSubmitting={isSubmitting}
                    isInteractive={!isSubmitting} // Input area is interactive only if not submitting
                />
            </div>
        </div>
    );
};