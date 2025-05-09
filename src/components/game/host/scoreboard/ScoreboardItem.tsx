// src/components/game/host/scoreboard/ScoreboardItem.tsx
import React, { useMemo, useEffect, useState } from 'react'; // Added useState, useEffect
import { LivePlayerState, PlayerScoreRankSnapshot } from '@/src/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { Flame, ArrowUp, ArrowDown, Minus, Crown } from 'lucide-react';
import { useGameAssets } from '@/src/context/GameAssetsContext';
import { cn } from '@/src/lib/utils';
import { AnimatedScore } from './AnimatedScore';
import { motion } from 'framer-motion';

interface ScoreboardItemProps {
    player: LivePlayerState; // This is the LATEST player state (score/rank AFTER the last question)
    previousState: PlayerScoreRankSnapshot | null | undefined; // This is player state BEFORE the last question
    animationStep: 'initial' | 'scores_done' | 'sorting';
}

const SCORE_ANIMATION_DURATION_TOTAL_1 = 0.3; // Duration for score count-up
const SCORE_ANIMATION_DURATION_TOTAL_2 = 1.0; // Duration for score count-up

export const ScoreboardItem: React.FC<ScoreboardItemProps> = ({
    player,
    previousState,
    animationStep,
}) => {
    const { avatars, isLoading: assetsLoading } = useGameAssets();
    const [currentDisplayRank, setCurrentDisplayRank] = useState<number | string | React.ReactElement>(player.rank);
    const [itemBgClass, setItemBgClass] = useState("bg-purple-700/80 hover:bg-purple-600/80");


    const avatarUrl = useMemo(() => { /* ... same ... */
        if (assetsLoading || !player.avatarId || !avatars) return null;
        return avatars.find(a => a.avatar_id === player.avatarId)?.image_file_path ?? null;
    }, [player.avatarId, avatars, assetsLoading]);

    const scoreBeforeThisRound = previousState?.score ?? 0;
    // For initial rank display, if no previous state, we can show a dash or new rank directly
    const rankBeforeThisRound = previousState?.rank ?? player.rank;

    const pointsEarnedThisRound = player.totalScore - scoreBeforeThisRound;
    // rankChange determines the background and icon
    const rankChange = previousState ? (player.rank - rankBeforeThisRound) : 0;

    const isFinalRankOne = player.rank === 1;

    useEffect(() => {
        // Update display rank based on animation step
        if (animationStep === 'initial') {
            setCurrentDisplayRank(rankBeforeThisRound > 0 ? ((previousState?.rank === 1) ? <Crown className="h-5 w-5 text-yellow-400" /> : rankBeforeThisRound) : player.rank);
        } else { // 'scores_done' or 'sorting'
            setCurrentDisplayRank(isFinalRankOne ? <Crown className="h-5 w-5 text-yellow-400" /> : player.rank);
        }

        // Determine background based on final outcome, apply it when scores are done
        if (animationStep === 'scores_done' || animationStep === 'sorting') {
            if (isFinalRankOne) {
                setItemBgClass("bg-yellow-500/30 border-2 border-yellow-400/80 hover:bg-yellow-500/40");
            } else if (rankChange < 0) {
                setItemBgClass("bg-blue-700/50 hover:bg-blue-600/50");
            } else if (rankChange > 0) {
                setItemBgClass("bg-red-700/50 hover:bg-red-600/50");
            } else {
                setItemBgClass("bg-purple-700/80 hover:bg-purple-600/80");
            }
        } else { // Initial state background (neutral)
            setItemBgClass("bg-purple-700/80 hover:bg-purple-600/80");
        }

    }, [animationStep, player.rank, rankBeforeThisRound, isFinalRankOne, rankChange, previousState]);


    const rankChangeIcon =
        rankChange < 0 ? <ArrowUp className="h-4 w-4 text-green-300" /> :
            rankChange > 0 ? <ArrowDown className="h-4 w-4 text-red-300" /> :
                previousState ? <Minus className="h-4 w-4 text-gray-400" /> : null;


    return (
        <motion.li
            layout // Let Framer Motion handle the sort animation smoothly
            initial={{ opacity: 0 }} // Initial animation for item appearance
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "flex items-center p-3 rounded-lg shadow-md text-white gap-3 min-h-[60px]",
                itemBgClass // Apply dynamic background class
            )}
        >
            {/* Rank: Displays old rank initially, then new rank after sort */}
            <span className={cn(
                "text-xl font-bold w-10 text-center flex-shrink-0 flex items-center justify-center",
                (isFinalRankOne && animationStep !== 'initial') && "text-yellow-300"
            )}>
                {currentDisplayRank}
            </span>

            {/* Avatar */}
            <Avatar className={cn(
                "h-10 w-10 flex-shrink-0 border-2",
                isFinalRankOne ? "border-yellow-400" : "border-purple-400/50"
            )}> {/* Avatar styling unchanged */}
                <AvatarImage src={avatarUrl ?? undefined} alt={player.nickname} />
                <AvatarFallback className={cn((isFinalRankOne && animationStep !== 'initial') ? "bg-yellow-500 text-yellow-900" : "bg-purple-600")}>
                    {player.nickname?.charAt(0)?.toUpperCase() ?? '?'}
                </AvatarFallback>
            </Avatar>

            {/* Nickname & Streak */}
            <div className="flex-grow flex items-center gap-1.5 overflow-hidden min-w-0">
                <span className={cn(
                    "font-semibold text-base md:text-lg truncate",
                    (isFinalRankOne && animationStep !== 'initial') && "text-yellow-100"
                )}>
                    {player.nickname}
                </span>
                {player.currentStreak >= 2 && ( /* Streak icon styling unchanged */
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring", stiffness: 300 }}>
                        <Flame className={cn("h-5 w-5 text-orange-400 flex-shrink-0", (isFinalRankOne && animationStep !== 'initial') && "text-orange-300")} />
                    </motion.div>
                )}
            </div>

            {/* Score Info */}
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 ml-auto text-right">
                <div className="flex items-center justify-center w-6 h-6">
                    {/* Rank change icon appears when scores are done updating */}
                    {(animationStep === 'scores_done' || animationStep === 'sorting') && rankChangeIcon}
                </div>

                {/* Points Gained: Animates when item mounts/becomes visible */}
                <div className="text-sm font-medium w-14 tabular-nums">
                    {pointsEarnedThisRound > 0 && (
                        <AnimatedScore
                            fromValue={0}
                            toValue={pointsEarnedThisRound}
                            prefix="+"
                            duration={SCORE_ANIMATION_DURATION_TOTAL_1 * 0.6}
                            delay={0.1} // Start slightly after item appears
                            className="text-green-300"
                        />
                    )}
                    {pointsEarnedThisRound === 0 && previousState && (
                        <span className="text-gray-400">+0</span>
                    )}
                    {pointsEarnedThisRound < 0 && (
                        <span className="text-red-400">{pointsEarnedThisRound.toLocaleString()}</span>
                    )}
                    {/* Placeholder for new players with 0 points gained this round */}
                    {pointsEarnedThisRound === 0 && !previousState && player.totalScore === 0 && (
                        <span className="text-gray-400">+0</span>
                    )}
                </div>

                {/* Total Score: Animates when item mounts/becomes visible */}
                <AnimatedScore
                    fromValue={scoreBeforeThisRound}
                    toValue={player.totalScore}
                    duration={SCORE_ANIMATION_DURATION_TOTAL_2}
                    className={cn(
                        "font-bold text-lg md:text-xl w-24 tabular-nums",
                        (isFinalRankOne && animationStep !== 'initial') && "text-yellow-200"
                    )}
                />
            </div>
        </motion.li>
    );
};