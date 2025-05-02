// src/components/game/views/PlayerView.tsx
'use client';

import React from 'react';
import {
    GameBlock, ContentBlock, PlayerAnswerPayload, QuestionResultPayload,
    isContentBlock, LivePlayerState // Assuming LivePlayerState is used for playerInfo prop consistency
} from '@/src/lib/types'; // Adjust path if needed
import PlayerStatusBar from '../status/PlayerStatusBar';
import ProgressTracker from '../status/ProgressTracker';
import { cn } from '@/src/lib/utils';
import { useGameBackground } from '@/src/lib/hooks/useGameBackground'; // Adjust path
import { Loader2 } from 'lucide-react'; // Keep for fallback

// --- Import the new view components ---
import { PlayerWaitingView } from '../player/views/PlayerWaitingView';
import { PlayerSubmittingView } from '../player/views/PlayerSubmittingView';
import { PlayerResultView } from '../player/views/PlayerResultView';
import { PlayerContentBlockView } from '../player/views/PlayerContentBlockView';
import { PlayerActiveQuestionView } from '../player/views/PlayerActiveQuestionView';
// ---

interface PlayerViewProps {
    questionData: GameBlock | null;
    feedbackPayload: QuestionResultPayload | null;
    onSubmitAnswer: (payload: PlayerAnswerPayload) => void;
    isWaiting?: boolean;
    isSubmitting?: boolean;
    // Use a more consistent type if possible, e.g., partial LivePlayerState or a dedicated PlayerInfo type
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
    // Background logic remains the same
    const { style: backgroundStyle, hasCustomBackground } = useGameBackground(currentBlock);
    const viewClasses = cn(
        "min-h-screen h-screen flex flex-col text-foreground relative",
        !hasCustomBackground && "default-quiz-background", // Add default background class if needed
        className
    );

    // --- Simplified renderContent function ---
    const renderContent = () => {
        if (isWaiting) {
            return <PlayerWaitingView />;
        }
        if (currentResult) {
            return <PlayerResultView result={currentResult} />;
        }
        if (isSubmitting) {
            return <PlayerSubmittingView />;
        }
        if (currentBlock) {
            if (isContentBlock(currentBlock)) {
                // Type is narrowed to ContentBlock here
                return <PlayerContentBlockView block={currentBlock} />;
            } else {
                // Type is narrowed to Exclude<GameBlock, ContentBlock> here
                // Use type assertion if TypeScript still complains
                return <PlayerActiveQuestionView
                    block={currentBlock as Exclude<GameBlock, ContentBlock>} // Type Assertion
                    onSubmitAnswer={onSubmitAnswer}
                    isSubmitting={isSubmitting}
                />;
            }
        }

        // Fallback / Waiting for game state
        return (
            <div className="flex flex-col items-center justify-center text-center p-10 flex-grow">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Waiting for game to start...</p>
            </div>
        );
    };
    // --- End simplified renderContent ---

    // Main component return structure remains largely the same
    return (
        <div className={viewClasses} style={backgroundStyle}>
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

export default PlayerView; // Export the main view