// src/components/game/host/podium/PodiumView.tsx
import React from 'react';
import { LivePlayerState, QuizStructureHost } from '@/src/lib/types';
import { PodiumPlatform } from './PodiumPlatform';
import { PodiumRunnerUpItem } from './PodiumRunnerUpItem';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { HighlightBanner } from '../scoreboard/HighlightBanner';
import { cn } from '@/src/lib/utils';

interface PodiumViewProps {
    players: Record<string, LivePlayerState>;
    quizData: QuizStructureHost | null;
    topNPodium?: number;
}

export const PodiumView: React.FC<PodiumViewProps> = ({
    players,
    quizData,
    topNPodium = 3,
}) => {
    // ... (sorting and player selection logic remains the same)
    const sortedPlayers = Object.values(players)
        .filter(p => p.isConnected && p.playerStatus !== 'KICKED' && p.rank > 0)
        .sort((a, b) => {
            if (a.rank === b.rank) return b.totalScore - a.totalScore;
            return a.rank - b.rank;
        });

    const podiumPlayersList = sortedPlayers.slice(0, topNPodium);
    const runnersUpList = sortedPlayers.slice(topNPodium);

    const playerWithLongestStreak = React.useMemo(() => {
        if (sortedPlayers.length === 0) return null;
        return sortedPlayers.reduce((prev, current) => {
            const prevMaxStreak = prev.maxStreak || 0;
            const currentMaxStreak = current.maxStreak || 0;
            return (prevMaxStreak > currentMaxStreak) ? prev : current;
        });
    }, [sortedPlayers]);

    const podiumDisplayOrder: (LivePlayerState | undefined)[] = [];
    podiumDisplayOrder[0] = podiumPlayersList.find(p => p.rank === 2);
    podiumDisplayOrder[1] = podiumPlayersList.find(p => p.rank === 1);
    podiumDisplayOrder[2] = podiumPlayersList.find(p => p.rank === 3);

    if (podiumPlayersList.length < topNPodium) {
        if (podiumPlayersList.length === 0) {
            podiumDisplayOrder[0] = undefined;
            podiumDisplayOrder[1] = undefined;
            podiumDisplayOrder[2] = undefined;
        } else if (podiumPlayersList.length === 1) {
            podiumDisplayOrder[0] = undefined;
            podiumDisplayOrder[1] = podiumPlayersList.find(p => p.rank === 1);
            podiumDisplayOrder[2] = undefined;
        } else if (podiumPlayersList.length === 2) {
            const playerRank1 = podiumPlayersList.find(p => p.rank === 1);
            const playerRank2 = podiumPlayersList.find(p => p.rank === 2);
            if (playerRank1 && playerRank2) {
                podiumDisplayOrder[0] = playerRank2;
                podiumDisplayOrder[1] = playerRank1;
                podiumDisplayOrder[2] = undefined;
            } else {
                podiumDisplayOrder[1] = podiumPlayersList[0];
                podiumDisplayOrder[0] = podiumPlayersList[1];
                podiumDisplayOrder[2] = undefined;
            }
        }
    }

    return (
        // This main div will be a flex column. Its height will be determined by its content.
        // HostView's <main> (with overflow-y-auto) will handle scrolling if this div gets too tall.
        <div className={cn(
            "flex flex-col w-full items-center p-3 md:p-4 gap-3 md:gap-4",
            // "bg-gradient-to-br from-purple-700 via-indigo-800 to-pink-600 text-white"
        )}>
            {/* Top Section: Quiz Title & Cover - Will not shrink or grow, takes its natural height */}
            <div className="text-center pt-1 md:pt-2 flex-shrink-0 w-full">
                {/* {quizData?.cover && (
                    <img src={quizData.cover} alt={`${quizData.title} cover`} className="w-24 h-14 md:w-32 md:h-[72px] object-cover rounded-md mx-auto mb-2 shadow-lg border border-white/20" />
                )} */}
                <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
                    {quizData?.title || "Quiz Champions!"}
                </h1>
            </div>

            {/* Middle Section: Podium Platforms - Will not shrink or grow */}
            {podiumPlayersList.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-2 md:gap-3 w-full max-w-xs sm:max-w-sm md:max-w-3xl lg:max-w-4xl mx-auto my-2 flex-shrink-0">
                    <div className={cn("md:order-1", podiumDisplayOrder[0] ? 'opacity-100' : 'opacity-0 md:opacity-100 md:invisible')}>
                        {podiumDisplayOrder[0] ? <PodiumPlatform player={podiumDisplayOrder[0]} position={2} /> : <div className="min-h-[12rem] md:min-h-[16rem] w-full"></div>}
                    </div>
                    <div className={cn("order-first md:order-2", podiumDisplayOrder[1] ? 'opacity-100' : 'opacity-0 md:opacity-100 md:invisible')}>
                        {podiumDisplayOrder[1] ? <PodiumPlatform player={podiumDisplayOrder[1]} position={1} /> : <div className="min-h-[14rem] md:min-h-[18rem] w-full"></div>}
                    </div>
                    <div className={cn("md:order-3", podiumDisplayOrder[2] ? 'opacity-100' : 'opacity-0 md:opacity-100 md:invisible')}>
                        {podiumDisplayOrder[2] ? <PodiumPlatform player={podiumDisplayOrder[2]} position={3} /> : <div className="min-h-[10rem] md:min-h-[14rem] w-full"></div>}
                    </div>
                </div>
            )}
            {/* Empty States for Podium - Will not shrink or grow excessively */}
            {podiumPlayersList.length === 0 && sortedPlayers.length > 0 && (
                <div className="text-center text-md text-white/70 p-4 bg-black/10 rounded-md min-h-[100px] my-2 flex items-center justify-center flex-shrink-0">
                    No players achieved a podium rank.
                </div>
            )}
            {podiumPlayersList.length === 0 && sortedPlayers.length === 0 && (
                <div className="text-center text-lg text-white/80 p-8 bg-black/20 rounded-lg min-h-[150px] my-2 flex items-center justify-center flex-shrink-0">
                    No players finished the game.
                </div>
            )}

            {/* Optional Longest Streak Banner - Will not shrink or grow */}
            {playerWithLongestStreak && (playerWithLongestStreak.maxStreak || 0) > 1 && (
                <div className="w-full max-w-sm md:max-w-md my-2 md:my-3 flex-shrink-0">
                    <HighlightBanner
                        highlightedPlayer={playerWithLongestStreak}
                        statName="Longest Streak"
                        statValue={`${playerWithLongestStreak.maxStreak || 0} 🔥`}
                        iconType="streak"
                    />
                </div>
            )}

            {/* Bottom Section: Runners-Up List */}
            {runnersUpList.length > 0 && (
                // This container will try to grow and then its child ScrollArea will handle internal scroll.
                // min-h-0 is key for flex children that need to scroll.
                <div className="w-full max-w-sm md:max-w-md mt-2 md:mt-3 flex flex-col flex-grow min-h-0 pb-1 flex-shrink"> {/* Added flex-shrink here too */}
                    <h3 className="text-md font-semibold text-center mb-1.5 text-white/80 flex-shrink-0">
                        {podiumPlayersList.length > 0 ? "Runners-Up" : "Leaderboard"}
                    </h3>
                    <ScrollArea className="flex-grow p-0.5 bg-black/10 rounded-md"> {/* ScrollArea takes the grown space */}
                        <div className="space-y-1.5 pr-2">
                            {runnersUpList.map(player => (
                                <PodiumRunnerUpItem key={player.cid} player={player} />
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}

            {podiumPlayersList.length === 0 && runnersUpList.length === 0 && sortedPlayers.length > 0 && (
                <div className="text-center text-md text-white/70 p-4 bg-black/10 rounded-md min-h-[100px] my-2 flex items-center justify-center flex-shrink-0">
                    No players achieved a rank for the podium or runners-up.
                </div>
            )}
        </div>
    );
};