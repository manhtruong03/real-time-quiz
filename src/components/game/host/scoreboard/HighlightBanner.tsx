// src/components/game/host/scoreboard/HighlightBanner.tsx
import React from 'react';
import { LivePlayerState } from '@/src/lib/types'; // Adjust path
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { useGameAssets } from '@/src/context/GameAssetsContext'; // To get avatar URL
import { Star } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface HighlightBannerProps {
    highlightedPlayer: LivePlayerState | null;
    statName: string;
    statValue: string | number;
    className?: string;
}

export const HighlightBanner: React.FC<HighlightBannerProps> = ({
    highlightedPlayer,
    statName,
    statValue,
    className,
}) => {
    const { avatars, isLoading: assetsLoading } = useGameAssets();

    const avatarUrl = React.useMemo(() => {
        if (assetsLoading || !highlightedPlayer?.avatarId || !avatars) return null;
        return avatars.find(a => a.avatar_id === highlightedPlayer.avatarId)?.image_file_path ?? null;
    }, [highlightedPlayer?.avatarId, avatars, assetsLoading]);


    // In Phase 1, just show a placeholder structure
    return (
        <div className={cn(
            "flex items-center justify-center gap-3 p-3 rounded-lg bg-gradient-to-r from-yellow-500/30 via-orange-500/30 to-red-500/30 text-white border border-yellow-400/50",
            className
        )}>
            <Star className="h-6 w-6 text-yellow-300 flex-shrink-0" />
            {highlightedPlayer ? (
                <>
                    <Avatar className="h-8 w-8 flex-shrink-0 border-2 border-yellow-200">
                        <AvatarImage src={avatarUrl ?? undefined} alt={highlightedPlayer.nickname} />
                        <AvatarFallback>{highlightedPlayer.nickname?.charAt(0)?.toUpperCase() ?? '?'}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm md:text-base">
                        <span className="font-semibold">{highlightedPlayer.nickname}</span> has the {statName.toLowerCase()}: <span className="font-bold">{statValue}</span>!
                    </p>
                </>
            ) : (
                <p className="text-sm md:text-base italic">Highlight Banner Area</p>
            )}

        </div>
    );
};