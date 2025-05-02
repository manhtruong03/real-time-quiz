// src/components/game/player/views/PlayerResultView.tsx
import React from 'react';
import { QuestionResultPayload } from '@/src/lib/types'; // Adjust path if needed
import { cn } from '@/src/lib/utils';
import { Loader2, CheckCircle, XCircle, Hourglass, Info, TimerOff, AlertCircle, Smile, Frown } from 'lucide-react'; // Keep relevant icons

interface PlayerResultViewProps {
    result: QuestionResultPayload;
}

export const PlayerResultView: React.FC<PlayerResultViewProps> = ({ result }) => {
    let FeedbackIcon = AlertCircle; // Default icon
    let message = "Result";
    let bgColor = "bg-background/80 dark:bg-black/70 backdrop-blur-sm";
    let textColor = "text-foreground";
    let pointsEarned: number | null = null;
    let correctAnswerText: string | null = null;
    let streakText: string | null = null;

    // Determine feedback based on result payload
    if (!result.hasAnswer) {
        FeedbackIcon = TimerOff;
        message = "Time's Up!";
        bgColor = "bg-yellow-600/80 dark:bg-yellow-800/80 backdrop-blur-sm";
        textColor = "text-white";
        pointsEarned = 0;
    } else {
        if ('isCorrect' in result) { // Quiz, Jumble, OpenEnded
            if (result.isCorrect) {
                FeedbackIcon = CheckCircle;
                message = "Correct!";
                bgColor = "bg-green-600/80 dark:bg-green-800/80 backdrop-blur-sm";
                textColor = "text-white";
                pointsEarned = result.points ?? 0;
                if (result.pointsData.answerStreakPoints.streakLevel > result.pointsData.answerStreakPoints.previousStreakLevel && result.pointsData.answerStreakPoints.streakLevel > 1) {
                    streakText = `Streak: ${result.pointsData.answerStreakPoints.streakLevel} 🔥`;
                } else if (result.pointsData.answerStreakPoints.streakLevel === 1 && result.pointsData.answerStreakPoints.previousStreakLevel === 0) {
                    streakText = `Streak started! 🔥`;
                }
            } else {
                FeedbackIcon = XCircle;
                message = "Incorrect";
                bgColor = "bg-red-600/80 dark:bg-red-800/80 backdrop-blur-sm";
                textColor = "text-white";
                pointsEarned = 0;
                if (result.pointsData.answerStreakPoints.streakLevel === 0 && result.pointsData.answerStreakPoints.previousStreakLevel > 0) {
                    streakText = `Streak lost! 💧`;
                }
                // Show correct answer for incorrect submissions
                if (result.type === 'quiz' && result.correctChoices) {
                    // Example: just indicate, detailed display might need host question data
                    correctAnswerText = `Correct choice${result.correctChoices.length > 1 ? 's' : ''} marked on host screen.`;
                } else if (result.type === 'jumble' && result.correctChoices) {
                    correctAnswerText = 'Correct order shown on host screen.';
                } else if (result.type === 'open_ended' && result.correctTexts) {
                    correctAnswerText = `Correct: ${result.correctTexts.join(' / ')}`;
                }
            }
        } else if (result.type === 'survey') {
            FeedbackIcon = Smile;
            message = "Thanks for your opinion!";
            bgColor = "bg-blue-600/80 dark:bg-blue-800/80 backdrop-blur-sm";
            textColor = "text-white";
        }
    }

    return (
        <div className={cn("flex flex-col items-center justify-center text-center p-6 md:p-10 rounded-lg flex-grow shadow-lg", bgColor, textColor)}>
            <FeedbackIcon className="h-16 w-16 mb-4" />
            <h3 className="text-2xl font-bold mb-1">{message}</h3>
            {pointsEarned !== null && (
                <p className="text-xl mt-1 font-semibold">
                    {pointsEarned >= 0 ? `+${pointsEarned.toLocaleString()}` : pointsEarned.toLocaleString()} points
                </p>
            )}
            {streakText && (
                <p className="text-md mt-2 font-medium opacity-90">{streakText}</p>
            )}
            {correctAnswerText && !('isCorrect' in result && result.isCorrect) && result.hasAnswer && (
                <p className="text-sm mt-3 opacity-80 max-w-md">{correctAnswerText}</p>
            )}
            <div className="mt-4 text-lg font-medium opacity-95">
                <span>Rank: {result.rank}</span>
                <span className="mx-2">|</span>
                <span>Score: {result.totalScore.toLocaleString()}</span>
            </div>
            <p className="text-xs mt-4 opacity-70">Waiting for next question...</p>
        </div>
    );
};