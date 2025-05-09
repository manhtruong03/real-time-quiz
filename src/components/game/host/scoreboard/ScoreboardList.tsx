// src/components/game/host/scoreboard/ScoreboardList.tsx
import React from 'react';
import { LivePlayerState, PlayerScoreRankSnapshot } from '@/src/lib/types'; // Adjust path
import { ScoreboardItem } from './ScoreboardItem';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { cn } from '@/src/lib/utils';
// --- ADD Framer Motion Import ---
import { motion } from 'framer-motion';

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
    console.log("[ScoreboardList] Rendering list with", rankedPlayers.length, "players.");
    return (
        <ScrollArea className={cn(
            "h-full w-full rounded-md border border-purple-600/50 p-2 bg-black/40 backdrop-blur-sm shadow-inner", // Enhanced styling
            className
        )} style={{ background: '#221A4E' }}>
            {/* --- WRAP ul with motion.ul for animations in Phase 3 --- */}
            <motion.ul layout className="space-y-2"> {/* Added layout prop */}
                {rankedPlayers.length > 0 ? (
                    rankedPlayers.map((player) => {
                        // Find the previous state for this player
                        const previousState = previousPlayerStates?.[player.cid] ?? null;
                        // console.log(`[ScoreboardList] Rendering item for ${player.nickname}, prev state:`, previousState);
                        return (
                            <ScoreboardItem
                                key={player.cid} // Crucial: Use player.cid for stable key
                                player={player}
                                previousState={previousState} // Pass the potentially null previous state
                            />
                        );
                    })
                ) : (
                    <li className="text-center text-purple-300 italic p-4">
                        Waiting for players to score...
                    </li>
                )}
            </motion.ul>
            {/* --- END WRAP --- */}
        </ScrollArea>
    );
};