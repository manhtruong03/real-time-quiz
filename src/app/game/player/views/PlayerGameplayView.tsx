// src/app/game/player/views/PlayerGameplayView.tsx
'use client';

import React from 'react';
import { PlayerGameScreen } from '@/src/components/game/player/PlayerGameScreen'; //
import { GameBlock, PlayerAnswerPayload, QuestionResultPayload, Avatar as AvatarType } from '@/src/lib/types'; //
import { MockWebSocketMessage } from '@/src/components/game/DevMockControls'; //

interface PlayerInfoForStatusBar {
    name: string;
    avatarUrl: string | null;
    avatarId: string | null;
    score: number;
    rank: number | undefined;
}

interface PlayerGameplayViewProps {
    currentBlock: GameBlock | null;
    currentResult: QuestionResultPayload | null;
    isSubmitting: boolean;
    playerInfoForStatusBar: PlayerInfoForStatusBar;
    onSubmitAnswer: (answerDetailPayload: PlayerAnswerPayload) => void;
    handleSimulatedMessage: (mockMessage: MockWebSocketMessage) => void; // For DevControls
    currentBackgroundId: string | null;
    avatars: AvatarType[] | undefined; // Prop from page, can be undefined
    onAvatarChange: (avatarId: string | null) => void;
}

export function PlayerGameplayView({
    currentBlock,
    currentResult,
    isSubmitting,
    playerInfoForStatusBar,
    onSubmitAnswer,
    handleSimulatedMessage,
    currentBackgroundId,
    avatars, // Can be undefined here
    onAvatarChange,
}: PlayerGameplayViewProps) {
    return (
        <PlayerGameScreen
            currentBlock={currentBlock}
            currentResult={currentResult}
            isSubmitting={isSubmitting}
            playerInfoForStatusBar={playerInfoForStatusBar}
            onSubmitAnswer={onSubmitAnswer}
            handleSimulatedMessage={handleSimulatedMessage}
            currentBackgroundId={currentBackgroundId}
            // Ensure `avatars` is always an array when passed to PlayerGameScreen
            avatars={avatars || []}
            onAvatarChange={onAvatarChange}
        />
    );
}