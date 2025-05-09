// src/components/game/host/scoreboard/ScoreboardList.tsx
import React from 'react';
import { LivePlayerState, PlayerScoreRankSnapshot } from '@/src/lib/types'; // Adjust path
import { ScoreboardItem } from './ScoreboardItem';
import { ScrollArea } from '@/src/components/ui/scroll-area'; // Import ScrollArea
import { cn } from '@/src/lib/utils';

interface ScoreboardListProps {
    rankedPlayers: LivePlayerState[];
    previousPlayerStates: Record<string, PlayerScoreRankSnapshot> | null;
    className?: string;
}

export const ScoreboardList: React.FC<ScoreboardListProps> = ({
    rankedPlayers,
    previousPlayerStates,
    className,
}) => {
    return (
        // Use ScrollArea for vertical scrolling if list overflows
        <ScrollArea className={cn("h-full w-full rounded-md border border-white/20 p-2 bg-black/30", className)}>
            <ul className="space-y-2"> {/* Use ul for semantic list */}
                {rankedPlayers.length > 0 ? (
                    rankedPlayers.map((player) => (
                        <ScoreboardItem
                            key={player.cid} // Use stable player ID as key
                            player={player}
                            previousState={previousPlayerStates?.[player.cid] ?? null}
                        />
                    ))
                ) : (
                    <li className="text-center text-muted-foreground italic p-4">
                        No players to display.
                    </li>
                )}
            </ul>
        </ScrollArea>
    );
};