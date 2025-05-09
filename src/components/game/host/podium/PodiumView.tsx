// src/components/game/host/podium/PodiumView.tsx
import React from 'react';
import { LivePlayerState, QuizStructureHost } from '@/src/lib/types';
import { PodiumPlatform } from './PodiumPlatform';
import { cn } from '@/src/lib/utils';
// import { Gamepad2 } from 'lucide-react'; // Already commented out, good.

interface PodiumViewProps {
    players: Record<string, LivePlayerState>;
    quizData: QuizStructureHost | null;
    topN?: number; // How many players to feature on the main podium
}

export const PodiumView: React.FC<PodiumViewProps> = ({
    players,
    quizData,
    topN = 3,
}) => {
    const sortedPlayers = Object.values(players)
        .filter(p => p.isConnected && p.playerStatus !== 'KICKED')
        .sort((a, b) => {
            if (a.rank === 0 && b.rank === 0) return b.totalScore - a.totalScore;
            if (a.rank === 0) return 1;
            if (b.rank === 0) return -1;
            if (a.rank === b.rank) return b.totalScore - a.totalScore;
            return a.rank - b.rank;
        });

    const topPlayers = sortedPlayers.slice(0, topN);

    const podiumOrder: (LivePlayerState | undefined)[] = [];
    // Default order: 2nd, 1st, 3rd
    podiumOrder[0] = topPlayers.find(p => p.rank === 2); // For left slot (2nd place)
    podiumOrder[1] = topPlayers.find(p => p.rank === 1); // For center slot (1st place)
    podiumOrder[2] = topPlayers.find(p => p.rank === 3); // For right slot (3rd place)

    // Adjust for fewer than 3 players
    if (topPlayers.length === 2) {
        // If only two players, they are 1st and 2nd.
        // Assume player with rank 1 is 1st, rank 2 is 2nd.
        const player1 = topPlayers.find(p => p.rank === 1);
        const player2 = topPlayers.find(p => p.rank === 2);
        if (player1 && player2) {
            // If player1's score > player2's score, P1 is 1st, P2 is 2nd
            // This relies on ranks being correctly assigned (lower rank = better)
            podiumOrder[0] = player2; // 2nd place
            podiumOrder[1] = player1; // 1st place
            podiumOrder[2] = undefined;
        } else { // Fallback if ranks are unusual, just place them
            podiumOrder[0] = topPlayers[1];
            podiumOrder[1] = topPlayers[0];
            podiumOrder[2] = undefined;
        }
    } else if (topPlayers.length === 1) {
        podiumOrder[0] = undefined;
        podiumOrder[1] = topPlayers[0]; // The single player is 1st
        podiumOrder[2] = undefined;
    } else if (topPlayers.length === 0) {
        podiumOrder[0] = undefined;
        podiumOrder[1] = undefined;
        podiumOrder[2] = undefined;
    }


    return (
        <div className={cn(
            "flex flex-col h-full w-full items-center justify-center p-4 md:p-6 gap-6 md:gap-8",
            // Using a more celebratory gradient
            "bg-gradient-to-br from-purple-600 via-indigo-700 to-pink-500 text-white"
        )}>
            <div className="text-center mb-4 md:mb-8">
                {quizData?.cover && (
                    <img src={quizData.cover} alt={`${quizData.title} cover`} className="w-32 h-20 md:w-48 md:h-28 object-cover rounded-lg mx-auto mb-4 shadow-lg border-2 border-white/50" />
                )}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
                    {quizData?.title || "Quiz Champions!"}
                </h1>
            </div>

            {topPlayers.length === 0 ? (
                <div className="text-center text-xl text-white/80 p-10 bg-black/20 rounded-lg">
                    No players finished the game to show on the podium.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-4 md:gap-2 w-full max-w-5xl">
                    {/* 2nd Place Platform - Order 1 on small screens, Order 1 on medium+ */}
                    <div className={cn("md:order-1", podiumOrder[0] ? 'opacity-100' : 'opacity-0 md:opacity-100 md:invisible')}>
                        {podiumOrder[0] ? <PodiumPlatform player={podiumOrder[0]} position={2} /> : <div className="h-40 md:h-56"></div>}
                    </div>

                    {/* 1st Place Platform - Order 0 on small screens (top), Order 2 on medium+ */}
                    <div className={cn("order-first md:order-2", podiumOrder[1] ? 'opacity-100' : 'opacity-0 md:opacity-100 md:invisible')}>
                        {podiumOrder[1] ? <PodiumPlatform player={podiumOrder[1]} position={1} /> : <div className="h-48 md:h-64"></div>}
                    </div>

                    {/* 3rd Place Platform - Order 2 on small screens, Order 3 on medium+ */}
                    <div className={cn("md:order-3", podiumOrder[2] ? 'opacity-100' : 'opacity-0 md:opacity-100 md:invisible')}>
                        {podiumOrder[2] ? <PodiumPlatform player={podiumOrder[2]} position={3} /> : <div className="h-32 md:h-48"></div>}
                    </div>
                </div>
            )}
        </div>
    );
};