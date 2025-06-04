// src/components/game/host/scoreboard/ScoreboardView.tsx
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { LiveGameState, PlayerScoreRankSnapshot, LivePlayerState } from '@/src/lib/types';
import { ScoreboardList } from './ScoreboardList';
import { HighlightBanner } from './HighlightBanner';
import { cn } from '@/src/lib/utils';

interface ScoreboardViewProps {
    players: Record<string, LivePlayerState>;
    previousPlayerStates: Record<string, PlayerScoreRankSnapshot> | null;
    quizTitle?: string;
    className?: string;
}

const SCORE_ANIMATION_DURATION_TOTAL = 1.0; // Duration for score count-up
const BACKGROUND_CHANGE_DELAY = 500; // ms, delay after scores before background truly applies or is noticed
const SORT_ANIMATION_DELAY = 1000;  // ms, delay after background change before sorting starts

export const ScoreboardView: React.FC<ScoreboardViewProps> = ({
    players,
    previousPlayerStates,
    quizTitle,
    className,
}) => {
    const [animationStep, setAnimationStep] = useState<'initial' | 'scores_done' | 'sorting'>('initial');

    // Memoize sorted lists
    const { initialOrderPlayers, finalOrderPlayers } = useMemo(() => {
        const allPlayersArray = Object.values(players).filter(
            (p) => p.playerStatus !== 'KICKED');

        const sortedByOldRank = [...allPlayersArray].sort((a, b) => {
            const prevRankA = previousPlayerStates?.[a.cid]?.rank ?? (allPlayersArray.length + 100 + a.rank); // Push new players way down
            const prevRankB = previousPlayerStates?.[b.cid]?.rank ?? (allPlayersArray.length + 100 + b.rank);
            if (prevRankA === prevRankB) {
                return (previousPlayerStates?.[b.cid]?.score ?? -1) - (previousPlayerStates?.[a.cid]?.score ?? -1);
            }
            return prevRankA - prevRankB;
        });

        const sortedByNewRank = [...allPlayersArray].sort((a, b) => {
            if (a.rank === b.rank) return b.totalScore - a.totalScore;
            return a.rank - b.rank;
        });
        return { initialOrderPlayers: sortedByOldRank, finalOrderPlayers: sortedByNewRank };
    }, [players, previousPlayerStates]);

    const highlightedPlayer = useMemo(() => {
        if (finalOrderPlayers.length === 0) return null;
        // Example: Find player with highest current streak > 1
        let maxStreak = 1; // Minimum streak to highlight (e.g., >= 2)
        let playerWithHighestStreak: LivePlayerState | null = null;
        for (const player of finalOrderPlayers) {
            if (player.currentStreak > maxStreak) {
                maxStreak = player.currentStreak;
                playerWithHighestStreak = player;
            }
        }
        return playerWithHighestStreak; // Can be null if no one meets criteria
    }, [finalOrderPlayers]);

    // Animation sequencing
    useEffect(() => {
        if (animationStep === 'initial') {
            // Scores start animating when ScoreboardItem mounts.
            // We need to wait for them to finish.
            // Using a timeout that covers the longest score animation.
            const timerId = setTimeout(() => {
                setAnimationStep('scores_done');
            }, (SCORE_ANIMATION_DURATION_TOTAL * 1000) + BACKGROUND_CHANGE_DELAY); // Wait for scores + bg delay
            return () => clearTimeout(timerId);
        } else if (animationStep === 'scores_done') {
            // After scores are done and backgrounds *should* have updated based on final ranks,
            // trigger the sort animation.
            const timerId = setTimeout(() => {
                setAnimationStep('sorting');
            }, SORT_ANIMATION_DELAY);
            return () => clearTimeout(timerId);
        }
    }, [animationStep]);


    const playersToDisplay = animationStep === 'sorting' ? finalOrderPlayers : initialOrderPlayers;

    return (
        <div className={cn(
            "flex flex-col h-full w-full items-center p-4 md:p-6 gap-4",
            // "bg-gradient-to-b from-purple-900 via-indigo-900 to-purple-900 text-white",
            className
        )}>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white drop-shadow-md">Scoreboard</h2>
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
            <div className="flex-grow w-full max-w-3xl overflow-hidden min-h-0">
                <ScoreboardList
                    rankedPlayers={playersToDisplay}
                    previousPlayerStates={previousPlayerStates}
                    animationStep={animationStep} // Pass the current step
                />
            </div>
        </div>
    );
};