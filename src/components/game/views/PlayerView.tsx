// src/components/game/views/PlayerView.tsx
'use client';

import React from 'react';
import {
    GameBlock, ContentBlock, PlayerAnswerPayload, QuestionResultPayload,
    isContentBlock, LivePlayerState // Assuming LivePlayerState is used for playerInfo prop consistency
} from '@/src/lib/types';
import PlayerStatusBar from '../status/PlayerStatusBar';
import ProgressTracker from '../status/ProgressTracker';
import { cn } from '@/src/lib/utils';
// --- Ensure the correct background hook is imported ---
import { useGameViewBackground } from '@/src/hooks/game/useGameViewBackground'; // Corrected path if needed
// ---
import { Loader2 } from 'lucide-react';
import { PlayerWaitingView } from '../player/views/PlayerWaitingView';
import { PlayerSubmittingView } from '../player/views/PlayerSubmittingView';
import { PlayerResultView } from '../player/views/PlayerResultView';
import { PlayerContentBlockView } from '../player/views/PlayerContentBlockView';
import { PlayerActiveQuestionView } from '../player/views/PlayerActiveQuestionView';

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
    // +++ Add prop for background ID +++
    currentBackgroundId: string | null;
    className?: string;
}

const PlayerView: React.FC<PlayerViewProps> = ({
    questionData: currentBlock,
    feedbackPayload: currentResult,
    onSubmitAnswer,
    isWaiting = false,
    isSubmitting = false,
    playerInfo,
    currentBackgroundId, // Destructure the new prop
    className,
}) => {
    // --- Use the background hook with the received ID ---
    // It takes an object with selectedBackgroundId and currentBlock
    const { style: backgroundStyle, hasCustomBackground } = useGameViewBackground({
        selectedBackgroundId: currentBackgroundId, // Pass the prop here
        currentBlock: currentBlock, // Pass current block for potential overrides
    });
    // --- END ---

    const viewClasses = cn(
        "min-h-screen h-screen flex flex-col text-foreground relative",
        !hasCustomBackground && "default-quiz-background", // Apply default if hook returns no custom BG
        className
    );

    // --- renderContent function (no changes needed here) ---
    const renderContent = () => {
        if (isWaiting) { return <PlayerWaitingView />; }
        if (currentResult) { return <PlayerResultView result={currentResult} />; }
        if (isSubmitting) { return <PlayerSubmittingView />; }
        if (currentBlock) {
            if (isContentBlock(currentBlock)) {
                return <PlayerContentBlockView block={currentBlock} />;
            } else {
                // Use type assertion to satisfy the stricter type of PlayerActiveQuestionView
                const activeBlock = currentBlock as Exclude<GameBlock, ContentBlock>;
                return <PlayerActiveQuestionView
                    block={activeBlock}
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
    // --- End renderContent ---

    return (
        // Apply the dynamic style from the hook
        <div className={viewClasses} style={backgroundStyle}>
            {!hasCustomBackground && <div className="stars-layer"></div>}
            {/* Add overlay only if it's an image (style has backgroundImage) */}
            {hasCustomBackground && backgroundStyle.backgroundImage && (
                <div className="absolute inset-0 bg-black/60 z-0"></div>
            )}

            <header className="p-2 border-b border-border/50 relative z-10 bg-background/50 backdrop-blur-sm">
                <div className="container mx-auto flex justify-end">
                    {/* Show progress only for non-content blocks */}
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

export default PlayerView;