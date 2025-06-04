// src/components/game/host/scoreboard/HighlightBanner.tsx
import React from 'react';
import { LivePlayerState } from '@/src/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { useGameAssets } from '@/src/context/GameAssetsContext';
import { Star, TrendingUp, Zap, Flame } from 'lucide-react'; // Added Flame
import { cn } from '@/src/lib/utils';

interface HighlightBannerProps {
    highlightedPlayer: LivePlayerState | null;
    statName: string;
    statValue: string | number;
    className?: string;
    iconType?: 'streak' | 'climber' | 'default';
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
        if (assetsLoading || !highlightedPlayer?.avatarId || !avatars || avatars.length === 0) return null;
        return avatars.find(a => a.avatar_id === highlightedPlayer.avatarId)?.image_file_path ?? null;
    }, [highlightedPlayer?.avatarId, avatars, assetsLoading]);

    let MainIcon = Star;
    let iconColorClass = "text-yellow-300"; // Default for Star

    if (iconType === 'streak') {
        MainIcon = Flame; // Using Flame for streak
        iconColorClass = "text-orange-400";
    } else if (iconType === 'climber') {
        MainIcon = TrendingUp;
        iconColorClass = "text-green-400";
    }

    if (!highlightedPlayer) {
        return (
            <div className={cn(
                "flex items-center justify-center gap-3 p-3 rounded-lg bg-purple-800/50 text-purple-300 border border-purple-700/70 h-[60px]",
                className
            )}>
                <p className="text-sm italic">Không có điểm nổi bật đặc biệt nào trong vòng này.</p>
            </div>
        );
    }

    return (
        <div className={cn(
            "flex items-center justify-center gap-3 md:gap-4 p-3 rounded-lg text-white border shadow-lg",
            // Keeping the Kahoot-like gradient for general highlights
            iconType === 'default' && "bg-gradient-to-r from-yellow-600/80 via-orange-500/80 to-red-600/80 border-yellow-500/70 backdrop-blur-sm",
            // Specific style for streak
            iconType === 'streak' && "bg-gradient-to-r from-orange-500/80 via-red-500/80 to-pink-600/80 border-orange-400/70 backdrop-blur-sm",
            // Add more specific styles for other iconTypes if needed
            "min-h-[60px]",
            className
        )}>
            <MainIcon className={cn("h-7 w-7 md:h-8 md:w-8 flex-shrink-0", iconColorClass)} />
            <Avatar className="h-10 w-10 md:h-12 md:h-12 flex-shrink-0 border-2 border-white/70 shadow-md">
                <AvatarImage src={avatarUrl ?? undefined} alt={highlightedPlayer.nickname} />
                <AvatarFallback className={cn(
                    "font-semibold",
                    iconType === 'streak' ? 'bg-orange-400/80 text-orange-900' : 'bg-yellow-400/80 text-yellow-800'
                )}>
                    {highlightedPlayer.nickname?.charAt(0)?.toUpperCase() ?? '?'}
                </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left">
                <p className="text-sm md:text-base font-medium leading-tight">
                    <span className={cn(
                        "font-bold",
                        iconType === 'streak' ? 'text-orange-100' : 'text-yellow-200'
                    )}>{highlightedPlayer.nickname}</span>
                </p>
                <p className={cn(
                    "text-xs md:text-sm leading-tight",
                    iconType === 'streak' ? 'text-orange-50/90' : 'text-yellow-100/90'
                )}>
                    {statName}: <span className="font-bold">{statValue}</span>
                </p>
            </div>
        </div>
    );
};