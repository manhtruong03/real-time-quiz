// src/components/game/host/podium/PodiumRunnerUpItem.tsx
import React from 'react';
import { LivePlayerState } from '@/src/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { useGameAssets } from '@/src/context/GameAssetsContext';
import { cn } from '@/src/lib/utils';

interface PodiumRunnerUpItemProps {
    player: LivePlayerState;
}

export const PodiumRunnerUpItem: React.FC<PodiumRunnerUpItemProps> = ({ player }) => {
    const { avatars, isLoading: assetsLoading } = useGameAssets();

    const avatarUrl = React.useMemo(() => {
        if (assetsLoading || !player.avatarId || !avatars || avatars.length === 0) {
            return null;
        }
        return avatars.find(a => a.avatar_id === player.avatarId)?.image_file_path ?? null;
    }, [player.avatarId, avatars, assetsLoading]);

    return (
        <div className={cn(
            "flex items-center gap-3 p-3 bg-black/20 backdrop-blur-sm rounded-lg shadow-md w-full"
        )}>
            <span className="text-lg font-semibold text-white/80 w-10 text-center">{player.rank}th</span>
            <Avatar className="h-10 w-10 border-2 border-white/30">
                {assetsLoading ? (
                    <div className="h-full w-full rounded-full bg-muted/50 animate-pulse"></div>
                ) : (
                    <>
                        <AvatarImage src={avatarUrl ?? undefined} alt={player.nickname} />
                        <AvatarFallback className="bg-white/20 text-white/90">
                            {player.nickname?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                    </>
                )}
            </Avatar>
            <span className="text-base font-medium text-white/90 truncate flex-grow" title={player.nickname}>
                {player.nickname}
            </span>
            <span className="text-lg font-bold text-white">
                {player.totalScore.toLocaleString()}
            </span>
        </div>
    );
};