// src/components/game/host/scoreboard/ScoreboardView.tsx
import React from 'react';
import { LiveGameState, PlayerScoreRankSnapshot, LivePlayerState } from '@/src/lib/types'; // Adjust path as needed
import { ScoreboardList } from './ScoreboardList';
import { HighlightBanner } from './HighlightBanner';
import { cn } from '@/src/lib/utils';

interface ScoreboardViewProps {
    players: Record<string, LivePlayerState>;
    previousPlayerStates: Record<string, PlayerScoreRankSnapshot> | null;
    quizTitle?: string; // Optional: for header or context
    className?: string;
}

export const ScoreboardView: React.FC<ScoreboardViewProps> = ({
    players,
    previousPlayerStates,
    quizTitle,
    className,
}) => {
    // Basic structure, logic for sorting and finding highlight will be in Phase 2
    const rankedPlayers = Object.values(players).sort((a, b) => a.rank - b.rank);
    const highlightedPlayer = null; // Placeholder for Phase 2 logic

    console.log("[ScoreboardView] Rendering. Players:", rankedPlayers.length);

    return (
        <div className={cn("flex flex-col h-full w-full items-center p-4 md:p-6", className)}>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">Scoreboard</h2>

            {/* Highlight Banner Area (Placeholder) */}
            <div className="w-full max-w-3xl mb-4">
                <HighlightBanner
                    highlightedPlayer={highlightedPlayer}
                    statName="Placeholder Stat"
                    statValue="N/A"
                />
            </div>

            {/* Scoreboard List Area */}
            <div className="flex-grow w-full max-w-3xl overflow-hidden">
                <ScoreboardList
                    rankedPlayers={rankedPlayers}
                    previousPlayerStates={previousPlayerStates}
                />
            </div>
        </div>
    );
};