// src/app/game/player/views/PlayerPinInputView.tsx
'use client';

import React from 'react';
import { PinInputForm } from '@/src/components/game/player/PinInputForm'; //

interface PlayerPinInputViewProps {
    gamePin: string;
    onGamePinChange: (pin: string) => void;
    onSubmit: () => void;
    errorMessage: string | null;
    isConnecting: boolean;
}

export function PlayerPinInputView({
    gamePin,
    onGamePinChange,
    onSubmit,
    errorMessage,
    isConnecting,
}: PlayerPinInputViewProps) {
    return (
        <PinInputForm
            gamePin={gamePin}
            onGamePinChange={onGamePinChange}
            onSubmit={onSubmit}
            errorMessage={errorMessage}
            isConnecting={isConnecting}
        />
    );
}