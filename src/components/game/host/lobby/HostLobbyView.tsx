// src/components/game/host/lobby/HostLobbyView.tsx
import React from 'react';
import { LobbyHeader } from './LobbyHeader';
import { ParticipantList } from './ParticipantList';
import { JoinInfoPanel } from './JoinInfoPanel';
import { LivePlayerState } from '@/src/lib/types';
import { cn } from '@/src/lib/utils';
import { useGameViewBackground } from '@/src/hooks/game/useGameViewBackground';
import { buttonVariants } from '@/src/components/ui/button';

interface HostLobbyViewProps {
    quizTitle: string;
    gamePin: string | null;
    accessUrl: string;
    participants: LivePlayerState[];
    selectedBackgroundId: string | null;
    onStartGame: () => void;
    onEndGame: () => void;
    onKickPlayer: (playerId: string) => void;
    // Add Mute/Fullscreen state and handlers
    onSettingsClick: () => void;
    isMuted: boolean;
    onToggleMute: () => void;
    isFullScreen: boolean;
    onToggleFullScreen: () => void;
    // Auto-Start Props
    isAutoStartEnabled: boolean;
    onAutoStartToggle: (enabled: boolean) => void;
    autoStartTimeSeconds: number | null;
    onAutoStartTimeChange: (seconds: number | null) => void;
    autoStartCountdown: number | null;
}

export const HostLobbyView: React.FC<HostLobbyViewProps> = ({
    quizTitle,
    gamePin,
    accessUrl,
    participants,
    selectedBackgroundId,
    onStartGame,
    onEndGame,
    onKickPlayer,
    // Destructure Setting/Fullscreen
    onSettingsClick,
    isMuted,
    onToggleMute,
    isFullScreen,
    onToggleFullScreen,
    // Destructure auto-start props
    isAutoStartEnabled,
    onAutoStartToggle,
    autoStartTimeSeconds,
    onAutoStartTimeChange,
    autoStartCountdown,
}) => {
    const { style: backgroundStyle, hasCustomBackground } = useGameViewBackground({
        selectedBackgroundId: selectedBackgroundId,
        currentBlock: null,
    });

    const viewClasses = cn(
        "min-h-screen h-screen flex flex-col text-foreground relative overflow-hidden",
        !hasCustomBackground && "default-quiz-background"
    );

    return (
        <div className={viewClasses} style={backgroundStyle}>
            {/* Background overlay/effects */}
            {!hasCustomBackground && <div className="stars-layer"></div>}
            {hasCustomBackground && backgroundStyle.backgroundImage && (
                <div className="absolute inset-0 bg-black/60 z-0"></div>
            )}

            {/* Header */}
            <LobbyHeader
                quizTitle={quizTitle}
                onEndGame={onEndGame}
                // Pass Mute/Fullscreen state and handlers
                onSettingsClick={onSettingsClick}
                isMuted={isMuted}
                onToggleMute={onToggleMute}
                isFullScreen={isFullScreen}
                onToggleFullScreen={onToggleFullScreen}
                participantCount={participants.length}
                onStartGame={onStartGame}
                // Pass auto-start props
                isAutoStartEnabled={isAutoStartEnabled}
                onAutoStartToggle={onAutoStartToggle}
                autoStartTimeSeconds={autoStartTimeSeconds}
                onAutoStartTimeChange={onAutoStartTimeChange}
                autoStartCountdown={autoStartCountdown}
                className="relative z-20 flex-shrink-0"
            />

            {/* Main Content Area */}
            <main className="flex-grow flex flex-col items-center p-3 md:p-4 gap-3 md:gap-4 relative z-10 overflow-hidden">
                {/* Top/Center Section (Join Info ONLY) */}
                <div className="w-full max-w-lg md:max-w-xl lg:max-w-2xl flex flex-col items-center gap-3 md:gap-4 flex-shrink-0 mb-3">
                    <JoinInfoPanel
                        gamePin={gamePin}
                        accessUrl={accessUrl}
                        className="w-full"
                    />
                </div>
                {/* Bottom Section (Participant List) */}
                <div className="w-full flex-grow min-h-0">
                    <ParticipantList
                        participants={participants}
                        onKickPlayer={onKickPlayer} // Already passing this
                        className="h-full"
                    />
                </div>
            </main>
        </div>
    );
};