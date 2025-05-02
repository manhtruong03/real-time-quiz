// src/components/game/player/PlayerGameScreen.tsx
import React from 'react';
import PlayerView from '@/src/components/game/views/PlayerView';
import DevMockControls, { MockWebSocketMessage } from '@/src/components/game/DevMockControls';

import { GameBlock, PlayerAnswerPayload, QuestionResultPayload, Avatar as AvatarType } from '@/src/lib/types'; // Import AvatarType

interface PlayerGameScreenProps {
    currentBlock: GameBlock | null;

    currentResult: QuestionResultPayload | null;

    isSubmitting: boolean;
    playerInfoForStatusBar: { // Keep this structure for status bar
        name: string;
        avatarUrl: string | null;
        avatarId: string | null; // *** Add avatarId here ***
        score: number;
        rank?: number;
    };
    onSubmitAnswer: (payload: PlayerAnswerPayload) => void;
    handleSimulatedMessage?: (message: MockWebSocketMessage) => void;

    currentBackgroundId: string | null;

    // --- Add new props ---
    avatars: AvatarType[];
    onAvatarChange: (avatarId: string | null) => void;
    // --- End new props ---
}

export const PlayerGameScreen: React.FC<PlayerGameScreenProps> = ({
    currentBlock,
    currentResult,
    isSubmitting,
    playerInfoForStatusBar,
    onSubmitAnswer,
    handleSimulatedMessage,
    currentBackgroundId,
    avatars, // Destructure new props
    onAvatarChange, // Destructure new props
}) => {
    const isWaiting = !currentBlock && !currentResult && !isSubmitting;

    return (
        <>
            <PlayerView
                questionData={currentBlock}
                feedbackPayload={currentResult}
                onSubmitAnswer={onSubmitAnswer}
                // isWaiting prop removed, PlayerView determines state internally
                isSubmitting={isSubmitting}

                playerInfo={{ // Pass info needed by PlayerView and its children
                    name: playerInfoForStatusBar.name,
                    avatarUrl: playerInfoForStatusBar.avatarUrl ?? undefined,
                    avatarId: playerInfoForStatusBar.avatarId ?? null, // Pass avatarId
                    score: playerInfoForStatusBar.score,
                    rank: playerInfoForStatusBar.rank
                }}

                currentBackgroundId={currentBackgroundId}
                // --- Pass new props down ---
                avatars={avatars}
                onAvatarChange={onAvatarChange}

            // --- End pass new props ---
            />
            {process.env.NODE_ENV === 'development' && handleSimulatedMessage && (

                <DevMockControls
                    simulateReceiveMessage={handleSimulatedMessage}
                    loadMockBlock={() => { /* Host responsibility */ }}
                    setMockResult={() => { /* Host responsibility */ }}

                />
            )}
        </>
    );

};