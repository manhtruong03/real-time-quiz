// src/components/game/player/PlayerGameScreen.tsx
import React from 'react';
import PlayerView from '@/src/components/game/views/PlayerView'; // Import the original view
import DevMockControls, { MockWebSocketMessage } from '@/src/components/game/DevMockControls';
import { GameBlock, PlayerAnswerPayload, QuestionResultPayload, LivePlayerState } from '@/src/lib/types'; // Adjust imports as needed

interface PlayerGameScreenProps {
    currentBlock: GameBlock | null;
    currentResult: QuestionResultPayload | null;
    isSubmitting: boolean;
    playerInfo: LivePlayerState; // Use LivePlayerState or a simplified version
    onSubmitAnswer: (payload: PlayerAnswerPayload) => void;
    handleSimulatedMessage?: (message: MockWebSocketMessage) => void; // Optional for dev controls
}

export const PlayerGameScreen: React.FC<PlayerGameScreenProps> = ({
    currentBlock,
    currentResult,
    isSubmitting,
    playerInfo,
    onSubmitAnswer,
    handleSimulatedMessage,
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
                playerInfo={{ // Map LivePlayerState to PlayerView's expected props
                    name: playerInfo.nickname,
                    avatarUrl: undefined, // Add avatar URL logic later if needed
                    score: playerInfo.totalScore,
                    rank: playerInfo.rank
                }}
            />
            {process.env.NODE_ENV === 'development' && handleSimulatedMessage && (
                <DevMockControls
                    simulateReceiveMessage={handleSimulatedMessage}
                    loadMockBlock={() => { }} // Host responsibility
                    setMockResult={() => { }}  // Host responsibility
                />
            )}
        </>
    );
};