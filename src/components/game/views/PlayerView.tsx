// src/components/game/views/PlayerView.tsx
'use client';

import React, { useState } from 'react'; // Add useState
import {
    GameBlock, ContentBlock, PlayerAnswerPayload, QuestionResultPayload,
    isContentBlock, Avatar as AvatarType // Import AvatarType
} from '@/src/lib/types';

import PlayerStatusBar from '../status/PlayerStatusBar';

import ProgressTracker from '../status/ProgressTracker';
import { cn } from '@/src/lib/utils';

import { useGameViewBackground } from '@/src/hooks/game/useGameViewBackground';

import { PlayerWaitingView } from '../player/views/PlayerWaitingView';

import { PlayerSubmittingView } from '../player/views/PlayerSubmittingView';

import { PlayerResultView } from '../player/views/PlayerResultView';
import { PlayerContentBlockView } from '../player/views/PlayerContentBlockView';

import { PlayerActiveQuestionView } from '../player/views/PlayerActiveQuestionView';

// --- Import the new Lobby View and Avatar Popup ---
import { PlayerLobbyWaitingView } from '../player/views/PlayerLobbyWaitingView';
import { AvatarSelectionPopup } from '../player/AvatarSelectionPopup'; // Import the popup

interface PlayerViewProps {
    questionData: GameBlock | null;
    feedbackPayload: QuestionResultPayload | null;

    onSubmitAnswer: (payload: PlayerAnswerPayload) => void;
    // isWaiting?: boolean; // We'll use more specific conditions
    isSubmitting?: boolean;
    playerInfo: {
        name: string;

        avatarUrl?: string | null; // Allow null
        avatarId?: string | null; // Add avatarId to know current selection
        score: number;
        rank?: number;

    };
    currentBackgroundId: string | null;

    // --- Add new props ---
    avatars: AvatarType[]; // List of available avatars for the popup
    onAvatarChange: (avatarId: string | null) => void; // Callback when avatar changes
    // --- End new props ---
    className?: string;
}

const PlayerView: React.FC<PlayerViewProps> = ({
    questionData: currentBlock,
    feedbackPayload: currentResult,
    onSubmitAnswer,
    // isWaiting = false, // Remove generic waiting prop
    isSubmitting = false,
    playerInfo,
    currentBackgroundId,
    avatars, // Destructure new props
    onAvatarChange, // Destructure new props
    className,
}) => {
    const { style: backgroundStyle, hasCustomBackground } = useGameViewBackground({
        selectedBackgroundId: currentBackgroundId,

        currentBlock: currentBlock,
    });

    const [isAvatarPopupOpen, setIsAvatarPopupOpen] = useState(false); // State for popup

    const viewClasses = cn(
        "min-h-screen h-screen flex flex-col text-foreground relative",
        !hasCustomBackground && "default-quiz-background",
        className
    );


    // --- Determine the current view state ---
    const isLobbyWaiting = !currentBlock && !currentResult && !isSubmitting;
    const showFooter = !isLobbyWaiting; // Footer is hidden only during lobby waiting

    const handleAvatarSelectFromPopup = (avatar: AvatarType) => {
        onAvatarChange(avatar.avatar_id); // Call parent callback
        setIsAvatarPopupOpen(false); // Close popup
    };

    const renderContent = () => {
        // --- NEW: Render Lobby Waiting View ---
        if (isLobbyWaiting) {
            return <PlayerLobbyWaitingView
                nickname={playerInfo.name}
                avatarUrl={playerInfo.avatarUrl ?? null}
                onEditAvatar={() => setIsAvatarPopupOpen(true)} // Open popup on edit click
            />;
        }
        // --- END NEW ---
        if (currentResult) { return <PlayerResultView result={currentResult} />; }

        if (isSubmitting) { return <PlayerSubmittingView />; }

        if (currentBlock) {
            if (isContentBlock(currentBlock)) {
                return <PlayerContentBlockView block={currentBlock} />;

            } else {
                const activeBlock = currentBlock as Exclude<GameBlock, ContentBlock>;

                return <PlayerActiveQuestionView
                    block={activeBlock}
                    onSubmitAnswer={onSubmitAnswer}
                    isSubmitting={isSubmitting}
                />;

            }
        }
        // Fallback / Waiting between questions (after result)
        return <PlayerWaitingView />;

    };


    return (
        <>
            <div className={viewClasses} style={backgroundStyle}>
                {!hasCustomBackground && <div className="stars-layer"></div>}
                {hasCustomBackground && backgroundStyle.backgroundImage && (
                    <div className="absolute inset-0 bg-black/60 z-0"></div>

                )}

                <header className="p-2 border-b border-border/50 relative z-10 bg-background/50 backdrop-blur-sm">
                    <div className="container mx-auto flex justify-end">

                        {currentBlock && !isContentBlock(currentBlock) && !isLobbyWaiting && // Don't show progress in lobby
                            <ProgressTracker current={currentBlock.gameBlockIndex + 1} total={currentBlock.totalGameBlockCount} />
                        }
                    </div>
                </header>

                <main className="flex-grow flex flex-col justify-center items-stretch p-3 md:p-4 overflow-y-auto relative z-10">

                    {renderContent()}
                </main>

                {/* --- Conditionally render the footer --- */}
                {showFooter && (
                    <PlayerStatusBar
                        playerName={playerInfo.name}
                        playerAvatarUrl={playerInfo.avatarUrl ?? undefined}
                        currentScore={playerInfo.score}
                        rank={playerInfo.rank}

                        className="relative z-10"
                    />
                )}
            </div>

            {/* --- Render Avatar Popup (controlled by this component) --- */}
            <AvatarSelectionPopup
                open={isAvatarPopupOpen}
                onOpenChange={setIsAvatarPopupOpen}
                avatars={avatars} // Use avatars list passed as prop
                currentSelectedId={playerInfo.avatarId ?? null}
                onSelect={handleAvatarSelectFromPopup}
            />
        </>
    );

};

export default PlayerView;