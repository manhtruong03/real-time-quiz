// src/components/game/host/scoreboard/HighlightBanner.tsx
import React from 'react';
import { LivePlayerState } from '@/src/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { useGameAssets } from '@/src/context/GameAssetsContext';
import { Star, TrendingUp, Zap } from 'lucide-react'; // Example icons
import { cn } from '@/src/lib/utils';

interface HighlightBannerProps {
    highlightedPlayer: LivePlayerState | null;
    statName: string; // e.g., "Highest Streak", "Biggest Climber"
    statValue: string | number;
    className?: string;
    iconType?: 'streak' | 'climber' | 'default'; // To vary the main icon
}

export const HighlightBanner: React.FC<HighlightBannerProps> = ({
    highlightedPlayer,
    statName,
    statValue,
    className,
    iconType = 'default',
}) => {
    const { avatars, isLoading: assetsLoading } = useGameAssets();

    const avatarUrl = React.useMemo(() => {
        if (assetsLoading || !highlightedPlayer?.avatarId || !avatars) return null;
        return avatars.find(a => a.avatar_id === highlightedPlayer.avatarId)?.image_file_path ?? null;
    }, [highlightedPlayer?.avatarId, avatars, assetsLoading]);

    let MainIcon = Star;
    if (iconType === 'streak') MainIcon = Zap; // Or Flame
    else if (iconType === 'climber') MainIcon = TrendingUp;

    if (!highlightedPlayer) {
        // Optionally render a subtle placeholder or nothing if no highlight
        return (
            <div className={cn(
                "flex items-center justify-center gap-3 p-3 rounded-lg bg-purple-800/50 text-purple-300 border border-purple-700/70 h-[60px]", // Defined height
                className
            )}>
                <p className="text-sm italic">No special highlights this round.</p>
            </div>
        );
    }

    return (
        <div className={cn(
            "flex items-center justify-center gap-3 md:gap-4 p-3 rounded-lg text-white border shadow-lg",
            "bg-gradient-to-r from-yellow-600/80 via-orange-500/80 to-red-600/80 border-yellow-500/70 backdrop-blur-sm", // Kahoot-like gradient
            "min-h-[60px]", // Ensure a minimum height
            className
        )}>
            <MainIcon className="h-7 w-7 md:h-8 md:w-8 text-yellow-300 flex-shrink-0" />
            <Avatar className="h-10 w-10 md:h-12 md:h-12 flex-shrink-0 border-2 border-yellow-200 shadow-md">
                <AvatarImage src={avatarUrl ?? undefined} alt={highlightedPlayer.nickname} />
                <AvatarFallback className="bg-yellow-400 text-yellow-800 font-semibold">
                    {highlightedPlayer.nickname?.charAt(0)?.toUpperCase() ?? '?'}
                </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left">
                <p className="text-sm md:text-base font-medium leading-tight">
                    <span className="font-bold text-yellow-200">{highlightedPlayer.nickname}</span>
                </p>
                <p className="text-xs md:text-sm text-yellow-100/90 leading-tight">
                    {statName}: <span className="font-bold">{statValue}</span>
                </p>
            </div>
        </div>
    );
};