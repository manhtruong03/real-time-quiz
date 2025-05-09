// src/components/game/host/scoreboard/ScoreboardItem.tsx
import React from 'react';
import { LivePlayerState, PlayerScoreRankSnapshot } from '@/src/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { Flame, ArrowUp, ArrowDown, Minus, Crown } from 'lucide-react';
import { useGameAssets } from '@/src/context/GameAssetsContext';
import { cn } from '@/src/lib/utils';
// --- IMPORT AnimatedScore ---
import { AnimatedScore } from './AnimatedScore';
// --- IMPORT motion from framer-motion ---
import { motion } from 'framer-motion';

interface ScoreboardItemProps {
    player: LivePlayerState;
    previousState: PlayerScoreRankSnapshot | null | undefined;
}

export const ScoreboardItem: React.FC<ScoreboardItemProps> = ({
    player,
    previousState,
}) => {
    const { avatars, isLoading: assetsLoading } = useGameAssets();

    const avatarUrl = React.useMemo(() => {
        if (assetsLoading || !player.avatarId || !avatars) return null;
        return avatars.find(a => a.avatar_id === player.avatarId)?.image_file_path ?? null;
    }, [player.avatarId, avatars, assetsLoading]);

    const initialScore = previousState?.score ?? 0; // Start from 0 if no previous state
    const pointsGained = player.totalScore - initialScore;

    const rankChange = previousState ? player.rank - previousState.rank : 0;
    const isRankOne = player.rank === 1;

    const itemClasses = cn(
        "flex items-center p-3 rounded-lg shadow-md transition-colors duration-300 ease-in-out text-white gap-3 min-h-[60px]",
        isRankOne
            ? "bg-yellow-500/30 border-2 border-yellow-400/80 hover:bg-yellow-500/40"
            : rankChange < 0
                ? "bg-blue-700/50 hover:bg-blue-600/50"
                : rankChange > 0
                    ? "bg-red-700/50 hover:bg-red-600/50"
                    : "bg-purple-700/80 hover:bg-purple-600/80"
    );

    const rankChangeIcon =
        rankChange < 0 ? <ArrowUp className="h-4 w-4 text-green-300" /> :
            rankChange > 0 ? <ArrowDown className="h-4 w-4 text-red-300" /> :
                previousState ? <Minus className="h-4 w-4 text-gray-400" /> : null;

    const rankDisplay = isRankOne ? <Crown className="h-5 w-5 text-yellow-400" /> : player.rank;

    return (
        // --- WRAP li with motion.li ---
        <motion.li
            layout="position" // Enables smooth reordering if the list changes
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={itemClasses}
        >
            {/* Rank */}
            <span className={cn(
                "text-xl font-bold w-10 text-center flex-shrink-0 flex items-center justify-center",
                isRankOne && "text-yellow-300"
            )}>
                {rankDisplay}
            </span>

            {/* Avatar */}
            <Avatar className={cn(
                "h-10 w-10 flex-shrink-0 border-2",
                isRankOne ? "border-yellow-400" : "border-purple-400/50"
            )}>
                <AvatarImage src={avatarUrl ?? undefined} alt={player.nickname} />
                <AvatarFallback className={cn(isRankOne ? "bg-yellow-500 text-yellow-900" : "bg-purple-600")}>
                    {player.nickname?.charAt(0)?.toUpperCase() ?? '?'}
                </AvatarFallback>
            </Avatar>

            {/* Nickname & Streak */}
            <div className="flex-grow flex items-center gap-1.5 overflow-hidden min-w-0">
                <span className={cn(
                    "font-semibold text-base md:text-lg truncate",
                    isRankOne && "text-yellow-100"
                )}>
                    {player.nickname}
                </span>
                {player.currentStreak >= 2 && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring", stiffness: 300 }}>
                        <Flame className={cn("h-5 w-5 text-orange-400 flex-shrink-0", isRankOne && "text-orange-300")} />
                    </motion.div>
                )}
            </div>

            {/* Score Info */}
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 ml-auto text-right">
                <div className="flex items-center justify-center w-6 h-6">
                    {rankChangeIcon}
                </div>

                {/* --- USE AnimatedScore for Points Gained --- */}
                <div className="text-sm font-medium text-green-300 w-14 tabular-nums">
                    {pointsGained > 0 && (
                        <AnimatedScore
                            fromValue={0}
                            toValue={pointsGained}
                            prefix="+"
                            duration={0.5}
                            delay={0.3} // Slight delay for gained points animation
                        />
                    )}
                    {pointsGained === 0 && previousState && ( // Show static +0 if no change for existing player
                        <span>+0</span>
                    )}
                    {/* Placeholder if pointsGained is 0 and it's first appearance, or negative */}
                    {(pointsGained < 0 || (pointsGained === 0 && !previousState)) && (
                        <span>{pointsGained !== 0 ? pointsGained.toLocaleString() : ''}</span>
                    )}
                </div>


                {/* --- USE AnimatedScore for Total Score --- */}
                <AnimatedScore
                    fromValue={initialScore}
                    toValue={player.totalScore}
                    duration={0.8}
                    className={cn(
                        "font-bold text-lg md:text-xl w-24 tabular-nums",
                        isRankOne && "text-yellow-200"
                    )}
                />
            </div>
        </motion.li>
    );
};