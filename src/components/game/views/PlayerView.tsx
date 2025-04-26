// src/components/game/views/PlayerView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
    GameBlock, PlayerAnswerPayload, QuestionResultPayload,
    isQuizQuestion, isJumbleQuestion, isOpenEndedQuestion, isSurveyQuestion, isContentBlock
} from '@/src/lib/types';
import QuestionDisplay from '../display/QuestionDisplay';
import AnswerInputArea from '../inputs/AnswerInputArea';
import PlayerStatusBar from '../status/PlayerStatusBar';
import ProgressTracker from '../status/ProgressTracker';
import MediaDisplay from '../display/MediaDisplay';
import { cn } from '@/src/lib/utils';
// Added TimerOff, AlertCircle, Smile, Frown icons
import { Loader2, CheckCircle, XCircle, Hourglass, Info, TimerOff, AlertCircle, Smile, Frown } from 'lucide-react';
import { Progress } from '@/src/components/ui/progress';
import { useGameBackground } from '@/src/lib/hooks/useGameBackground'; // Correct path assumed

interface PlayerViewProps {
    questionData: GameBlock | null;
    feedbackPayload: QuestionResultPayload | null;
    onSubmitAnswer: (payload: PlayerAnswerPayload) => void;
    isWaiting?: boolean;
    isSubmitting?: boolean;
    playerInfo: {
        name: string;
        avatarUrl?: string;
        score: number;
        rank?: number;
    };
    className?: string;
}

const PlayerView: React.FC<PlayerViewProps> = ({
    questionData: currentBlock,
    feedbackPayload: currentResult,
    onSubmitAnswer,
    isWaiting = false,
    isSubmitting = false,
    playerInfo,
    className,
}) => {
    const { style: backgroundStyle, hasCustomBackground } = useGameBackground(currentBlock);

    const viewClasses = cn(
        "min-h-screen h-screen flex flex-col text-foreground relative",
        !hasCustomBackground && "default-quiz-background",
        className
    );

    const [timeLeft, setTimeLeft] = useState(currentBlock?.timeAvailable ?? 0);
    const [timerKey, setTimerKey] = useState(0);

    // Timer logic remains the same
    useEffect(() => {
        if (currentBlock && currentBlock.timeAvailable > 0 && !isSubmitting && !isWaiting && !currentResult) {
            const initialTime = currentBlock.timeAvailable;
            setTimeLeft(initialTime);
            setTimerKey(currentBlock.gameBlockIndex);

            const interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 100) {
                        clearInterval(interval);
                        // Potential place to automatically trigger a 'no answer' state if needed,
                        // but usually the backend determines this based on timeout.
                        return 0;
                    }
                    return prev - 100;
                });
            }, 100);
            return () => clearInterval(interval);
        } else {
            setTimeLeft(0);
        }
    }, [currentBlock, isSubmitting, isWaiting, currentResult]);

    // --- UPDATED renderContent function for better feedback ---
    const renderContent = () => {
        if (isWaiting) {
            // Waiting state remains the same
            return (
                <div className="flex flex-col items-center justify-center text-center p-10 flex-grow">
                    <Hourglass className="h-12 w-12 animate-spin text-primary mb-4" />
                    <h3 className="text-xl font-semibold">Get Ready!</h3>
                    <p className="text-muted-foreground">Next question is coming up...</p>
                </div>
            );
        }

        // RENDER BASED ON RESULT PAYLOAD (currentResult)
        if (currentResult) {
            let FeedbackIcon = AlertCircle; // Default icon
            let message = "Result";
            let bgColor = "bg-background/80 dark:bg-black/70 backdrop-blur-sm";
            let textColor = "text-foreground";
            let pointsEarned: number | null = null;
            let correctAnswerText: string | null = null;
            let streakText: string | null = null;

            // --- Check if the player answered ---
            if (!currentResult.hasAnswer) {
                FeedbackIcon = TimerOff;
                message = "Time's Up!";
                bgColor = "bg-yellow-600/80 dark:bg-yellow-800/80 backdrop-blur-sm";
                textColor = "text-white";
                pointsEarned = 0; // No points if no answer
            } else {
                // Player answered, now check correctness (if applicable)
                if ('isCorrect' in currentResult) { // Quiz, Jumble, OpenEnded
                    if (currentResult.isCorrect) {
                        FeedbackIcon = CheckCircle;
                        message = "Correct!";
                        bgColor = "bg-green-600/80 dark:bg-green-800/80 backdrop-blur-sm";
                        textColor = "text-white";
                        pointsEarned = currentResult.points ?? 0;
                        // Check for streak increase
                        if (currentResult.pointsData.answerStreakPoints.streakLevel > currentResult.pointsData.answerStreakPoints.previousStreakLevel && currentResult.pointsData.answerStreakPoints.streakLevel > 1) {
                            streakText = `Streak: ${currentResult.pointsData.answerStreakPoints.streakLevel} 🔥`;
                        } else if (currentResult.pointsData.answerStreakPoints.streakLevel === 1 && currentResult.pointsData.answerStreakPoints.previousStreakLevel === 0) {
                            streakText = `Streak started! 🔥`;
                        }

                    } else {
                        FeedbackIcon = XCircle;
                        message = "Incorrect";
                        bgColor = "bg-red-600/80 dark:bg-red-800/80 backdrop-blur-sm";
                        textColor = "text-white";
                        pointsEarned = 0;
                        // Check if streak was lost
                        if (currentResult.pointsData.answerStreakPoints.streakLevel === 0 && currentResult.pointsData.answerStreakPoints.previousStreakLevel > 0) {
                            streakText = `Streak lost! 💧`;
                        }

                        // Show correct answer for incorrect submissions
                        if (currentResult.type === 'quiz' || currentResult.type === 'jumble') {
                            // Simple text for now, enhance later if needed
                            correctAnswerText = `Correct answer hidden.`;
                        } else if (currentResult.type === 'open_ended' && currentResult.correctTexts) {
                            correctAnswerText = `Correct: ${currentResult.correctTexts.join(' / ')}`;
                        }
                    }
                } else if (currentResult.type === 'survey') {
                    FeedbackIcon = Smile; // Different icon for survey
                    message = "Thanks for your opinion!";
                    bgColor = "bg-blue-600/80 dark:bg-blue-800/80 backdrop-blur-sm";
                    textColor = "text-white";
                    // No points or correctness for surveys
                }
            }

            // --- Enhanced Result Display ---
            return (
                <div className={cn("flex flex-col items-center justify-center text-center p-6 md:p-10 rounded-lg flex-grow shadow-lg", bgColor, textColor)}>
                    <FeedbackIcon className="h-16 w-16 mb-4" />
                    <h3 className="text-2xl font-bold mb-1">{message}</h3>
                    {/* Display Points */}
                    {pointsEarned !== null && (
                        <p className="text-xl mt-1 font-semibold">
                            {pointsEarned >= 0 ? `+${pointsEarned.toLocaleString()}` : pointsEarned.toLocaleString()} points
                        </p>
                    )}
                    {/* Display Streak */}
                    {streakText && (
                        <p className="text-md mt-2 font-medium opacity-90">{streakText}</p>
                    )}
                    {/* Display Correct Answer (if applicable and incorrect) */}
                    {correctAnswerText && !currentResult.isCorrect && currentResult.hasAnswer && (
                        <p className="text-sm mt-3 opacity-80 max-w-md">{correctAnswerText}</p>
                    )}
                    {/* Always show rank and total score */}
                    <div className="mt-4 text-lg font-medium opacity-95">
                        <span>Rank: {currentResult.rank}</span>
                        <span className="mx-2">|</span>
                        <span>Score: {currentResult.totalScore.toLocaleString()}</span>
                    </div>

                    <p className="text-xs mt-4 opacity-70">Waiting for next question...</p>
                </div>
            );
        }
        // --- END Result Display Update ---


        if (isSubmitting) {
            // Submitting state remains the same
            return (
                <div className="flex flex-col items-center justify-center text-center p-10 flex-grow">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <h3 className="text-xl font-semibold">Answer Submitted!</h3>
                    <p className="text-muted-foreground">Waiting for results...</p>
                </div>
            );
        }

        if (!currentBlock) {
            // Waiting for game state remains the same
            return (
                <div className="flex flex-col items-center justify-center text-center p-10 flex-grow">
                    <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Waiting for game to start...</p>
                </div>
            );
        }

        if (isContentBlock(currentBlock)) {
            // Content block display remains the same
            return (
                <div className="flex-grow flex flex-col items-center justify-center gap-4 text-center p-4 bg-background/80 dark:bg-black/70 backdrop-blur-sm rounded-lg shadow">
                    <Info className="h-10 w-10 text-primary mb-3" />
                    <QuestionDisplay
                        title={currentBlock.title}
                        className="mb-2 bg-transparent shadow-none p-0 text-xl md:text-2xl"
                    />
                    {currentBlock.description && (
                        <p className="text-md md:text-lg mt-1 max-w-lg text-muted-foreground">{currentBlock.description}</p>
                    )}
                    <MediaDisplay questionData={currentBlock} priority className="mt-3 max-w-sm" />
                    <p className="text-sm mt-4 text-muted-foreground">Get ready for the next question!</p>
                </div>
            );
        }

        // Active question display (Quiz, Jumble, Survey, OpenEnded) - remains the same
        const showTimer = timeLeft > 0 && currentBlock.timeAvailable > 0;
        const timePercentage = showTimer ? (timeLeft / currentBlock.timeAvailable) * 100 : 0;
        const secondsLeft = showTimer ? Math.ceil(timeLeft / 1000) : 0;

        return (
            <div className="w-full max-w-2xl mx-auto flex flex-col flex-grow justify-start">
                <div className="mb-3 md:mb-4">
                    <MediaDisplay questionData={currentBlock} className="w-full max-w-xs md:max-w-sm mx-auto mb-3 md:mb-4" />
                    <QuestionDisplay
                        title={currentBlock.title}
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
                    <AnswerInputArea
                        questionData={currentBlock}
                        onAnswerSubmit={onSubmitAnswer}
                        isSubmitting={isSubmitting}
                        isInteractive={true}
                    />
                </div>
            </div>
        );
    }; // End of renderContent


    // Main component return structure remains the same
    return (
        <div
            className={viewClasses}
            style={backgroundStyle}
        >
            {!hasCustomBackground && <div className="stars-layer"></div>}
            {hasCustomBackground && <div className="absolute inset-0 bg-black/60 z-0"></div>}

            <header className="p-2 border-b border-border/50 relative z-10 bg-background/50 backdrop-blur-sm">
                <div className="container mx-auto flex justify-end">
                    {currentBlock && !isContentBlock(currentBlock) &&
                        <ProgressTracker current={currentBlock.gameBlockIndex + 1} total={currentBlock.totalGameBlockCount} />
                    }
                </div>
            </header>

            <main className="flex-grow flex flex-col justify-center items-stretch p-3 md:p-4 overflow-y-auto relative z-10">
                {renderContent()}
            </main>

            {/* PlayerStatusBar now reflects score/rank updated in PlayerPage via setPlayerInfo */}
            <PlayerStatusBar
                playerName={playerInfo.name}
                playerAvatarUrl={playerInfo.avatarUrl}
                currentScore={playerInfo.score}
                rank={playerInfo.rank}
                className="relative z-10"
            />
        </div>
    );
};


export default PlayerView;