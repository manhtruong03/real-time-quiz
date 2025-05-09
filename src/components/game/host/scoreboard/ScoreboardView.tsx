// src/components/game/host/scoreboard/ScoreboardView.tsx
import React, { useMemo } from 'react'; // Import useMemo
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
    // --- ADDED: Sort players by rank ---
    const rankedPlayers = useMemo(() => {
        return Object.values(players)
            .filter(p => p.isConnected && p.playerStatus !== 'KICKED') // Only show connected, non-kicked players
            .sort((a, b) => a.rank - b.rank); // Sort ascending by rank
    }, [players]);

    // --- ADDED: Placeholder logic for highlighted player (e.g., highest streak) ---
    const highlightedPlayer = useMemo(() => {
        if (rankedPlayers.length === 0) return null;
        // Example: Find player with highest current streak > 1
        let maxStreak = 1; // Minimum streak to highlight (e.g., >= 2)
        let playerWithHighestStreak: LivePlayerState | null = null;
        for (const player of rankedPlayers) {
            if (player.currentStreak > maxStreak) {
                maxStreak = player.currentStreak;
                playerWithHighestStreak = player;
            }
        }
        return playerWithHighestStreak; // Can be null if no one meets criteria
    }, [rankedPlayers]);

    console.log(`[ScoreboardView] Rendering. Sorted Players: ${rankedPlayers.length}, Highlighted: ${highlightedPlayer?.nickname ?? 'None'}`);

    return (
        <div className={cn(
            "flex flex-col h-full w-full items-center p-4 md:p-6 gap-4", // Added gap
            // "bg-gradient-to-b from-purple-900 via-indigo-900 to-purple-900 text-white", // Example background
            className
        )}>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white drop-shadow-md">Scoreboard</h2>

            {/* Highlight Banner Area - Pass calculated player */}
            <div className="w-full max-w-3xl flex-shrink-0"> {/* Ensure banner doesn't grow */}
                {highlightedPlayer && ( // Conditionally render banner
                    <HighlightBanner
                        highlightedPlayer={highlightedPlayer}
                        statName="Highest Streak"
                        statValue={`${highlightedPlayer.currentStreak} 🔥`}
                    />
                )}
                {/* You might add other banners here later (e.g., biggest climber) */}
            </div>

            {/* Scoreboard List Area - Takes remaining space */}
            <div className="flex-grow w-full max-w-3xl overflow-hidden min-h-0"> {/* Added min-h-0 for flex-grow */}
                <ScoreboardList
                    rankedPlayers={rankedPlayers}
                    previousPlayerStates={previousPlayerStates}
                />
            </div>
        </div>
    );
};