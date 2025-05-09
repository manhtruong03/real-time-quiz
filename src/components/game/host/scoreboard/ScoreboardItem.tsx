// src/components/game/host/scoreboard/ScoreboardItem.tsx
import React from 'react';
import { LivePlayerState, PlayerScoreRankSnapshot } from '@/src/lib/types'; // Adjust path
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { Flame, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useGameAssets } from '@/src/context/GameAssetsContext'; // To get avatar URL
import { cn } from '@/src/lib/utils';

interface ScoreboardItemProps {
    player: LivePlayerState;
    previousState: PlayerScoreRankSnapshot | null | undefined;
}

export const ScoreboardItem: React.FC<ScoreboardItemProps> = ({
    player,
    previousState,
}) => {
    const { avatars, isLoading: assetsLoading } = useGameAssets();

    // Find avatar URL (Logic moved here from ScoreboardView)
    const avatarUrl = React.useMemo(() => {
        if (assetsLoading || !player.avatarId || !avatars) return null;
        return avatars.find(a => a.avatar_id === player.avatarId)?.image_file_path ?? null;
    }, [player.avatarId, avatars, assetsLoading]);

    // Placeholder for Phase 2 logic
    const rankChange = previousState ? player.rank - previousState.rank : 0; // 0 = no change or first appearance
    const pointsGained = previousState ? player.totalScore - previousState.score : player.totalScore;

    // Base styling, rank-based styling will be added in Phase 2
    const itemClasses = cn(
        "flex items-center p-2 rounded-md bg-purple-800/70 text-white gap-3",
        // Add specific rank styling later
    );

    return (
        <li className={itemClasses}>
            {/* Rank */}
            <span className="text-lg font-bold w-8 text-center flex-shrink-0">{player.rank}</span>

            {/* Avatar */}
            <Avatar className="h-8 w-8 flex-shrink-0 border border-purple-400">
                <AvatarImage src={avatarUrl ?? undefined} alt={player.nickname} />
                <AvatarFallback>{player.nickname?.charAt(0)?.toUpperCase() ?? '?'}</AvatarFallback>
            </Avatar>

            {/* Nickname & Streak */}
            <div className="flex-grow flex items-center gap-1 overflow-hidden">
                <span className="font-medium truncate">{player.nickname}</span>
                {player.currentStreak >= 2 && ( // Example threshold for streak icon
                    <Flame className="h-4 w-4 text-orange-400 flex-shrink-0" />
                )}
            </div>

            {/* Score Info */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto text-right">
                {/* Rank Change Indicator (Static) */}
                <div className="flex items-center w-8 justify-end">
                    {rankChange < 0 && <ArrowUp className="h-4 w-4 text-green-400" />}
                    {rankChange > 0 && <ArrowDown className="h-4 w-4 text-red-400" />}
                    {rankChange === 0 && <Minus className="h-4 w-4 text-gray-400" />}
                    {/* Optionally show number |rankChange| if not 0 */}
                </div>
                {/* Points Gained (Static) */}
                <span className="text-sm text-green-300 w-12 text-right">
                    {pointsGained > 0 ? `+${pointsGained.toLocaleString()}` : ''}
                </span>
                {/* Total Score (Static) */}
                <span className="font-bold text-lg w-20 text-right tabular-nums">
                    {player.totalScore.toLocaleString()}
                </span>
            </div>
        </li>
    );
};