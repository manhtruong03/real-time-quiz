// src/components/game/host/scoreboard/ScoreboardList.tsx
import React from 'react';
import { LivePlayerState, PlayerScoreRankSnapshot } from '@/src/lib/types';
import { ScoreboardItem } from './ScoreboardItem';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { cn } from '@/src/lib/utils';
import { motion } from 'framer-motion';

interface ScoreboardListProps {
    rankedPlayers: LivePlayerState[];
    previousPlayerStates: Record<string, PlayerScoreRankSnapshot> | null;
    animationStep: 'initial' | 'scores_done' | 'sorting'; // Added prop
    className?: string;
}

export const ScoreboardList: React.FC<ScoreboardListProps> = ({
    rankedPlayers,
    previousPlayerStates,
    animationStep, // Use prop
    className,
}) => {
    return (
        <ScrollArea className={cn(
            "h-full w-full rounded-md border border-purple-600/50 p-2 bg-black/40 backdrop-blur-sm shadow-inner",
            className
        )} style={{ background: '#221A4E' }}>
            <motion.ul layout className="space-y-2"> {/* `layout` handles animation when `rankedPlayers` order changes */}
                {rankedPlayers.length > 0 ? (
                    rankedPlayers.map((player) => {
                        const previousState = previousPlayerStates?.[player.cid] ?? null;
                        return (
                            <ScoreboardItem
                                key={player.cid}
                                player={player} // Contains NEW rank and NEW score
                                previousState={previousState} // Contains OLD rank and OLD score
                                animationStep={animationStep} // Pass down
                            />
                        );
                    })
                ) : (
                    <li className="text-center text-purple-300 italic p-4">
                        Waiting for players to score...
                    </li>
                )}
            </motion.ul>
        </ScrollArea>
    );
};