// src/components/game/player/PlayerGameScreen.tsx
import React from 'react';
import PlayerView from '@/src/components/game/views/PlayerView';
import DevMockControls, { MockWebSocketMessage } from '@/src/components/game/DevMockControls';

import { GameBlock, PlayerAnswerPayload, QuestionResultPayload } from '@/src/lib/types'; // Removed LivePlayerState import

interface PlayerGameScreenProps {
    currentBlock: GameBlock | null;

    currentResult: QuestionResultPayload | null;

    isSubmitting: boolean;
    // --- MODIFIED: Receive specific info needed for status bar ---
    playerInfoForStatusBar: {
        name: string;
        avatarUrl: string | null;
        score: number;
        rank?: number;
    };
    // --- END MODIFIED ---
    onSubmitAnswer: (payload: PlayerAnswerPayload) => void;
    handleSimulatedMessage?: (message: MockWebSocketMessage) => void;

    currentBackgroundId: string | null;

}

export const PlayerGameScreen: React.FC<PlayerGameScreenProps> = ({
    currentBlock,
    currentResult,
    isSubmitting,
    playerInfoForStatusBar, // Destructure new prop
    onSubmitAnswer,
    handleSimulatedMessage,
    currentBackgroundId,
}) => {
    const isWaiting = !currentBlock && !currentResult && !isSubmitting;

    return (
        <>
            <PlayerView
                questionData={currentBlock}
                feedbackPayload={currentResult}
                onSubmitAnswer={onSubmitAnswer}
                isWaiting={isWaiting}

                isSubmitting={isSubmitting}
                // --- MODIFIED: Pass the received status bar info directly ---
                playerInfo={{
                    name: playerInfoForStatusBar.name,
                    avatarUrl: playerInfoForStatusBar.avatarUrl ?? undefined, // Pass URL or undefined
                    score: playerInfoForStatusBar.score,
                    rank: playerInfoForStatusBar.rank
                }}

                currentBackgroundId={currentBackgroundId}

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