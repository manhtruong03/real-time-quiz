// src/app/game/player/views/PlayerNicknameInputView.tsx
'use client';

import React from 'react';
import { NicknameInputForm } from '@/src/components/game/player/NicknameInputForm'; //
// Avatar type might be needed if we pass avatar data through, but NicknameInputForm handles AvatarSelectionPopup internally for now.
// import { Avatar as AvatarType } from '@/src/lib/types';

interface PlayerNicknameInputViewProps {
    gamePin: string;
    nickname: string;
    onNicknameChange: (name: string) => void;
    onSubmit: () => Promise<boolean>; // Matches existing signature
    errorMessage: string | null;
    onAvatarSelected: (avatarId: string | null) => void;
    // avatars?: AvatarType[]; // Not directly used by NicknameInputForm, it uses useGameAssets
    // isLoadingAssets?: boolean; // Not directly used by NicknameInputForm
}

export function PlayerNicknameInputView({
    gamePin,
    nickname,
    onNicknameChange,
    onSubmit,
    errorMessage,
    onAvatarSelected,
}: PlayerNicknameInputViewProps) {
    return (
        <NicknameInputForm
            gamePin={gamePin}
            nickname={nickname}
            onNicknameChange={onNicknameChange}
            onSubmit={onSubmit}
            errorMessage={errorMessage}
            onAvatarSelected={onAvatarSelected} // NicknameInputForm uses this for AvatarSelectionPopup
        />
    );
}