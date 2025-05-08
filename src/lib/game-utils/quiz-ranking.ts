// src/lib/game-utils/quiz-ranking.ts
import { LivePlayerState } from "@/src/lib/types";

/**
 * Calculates and updates the rank for each player based on their total score.
 * Players are sorted by score (descending). Handles ties by assigning the same rank.
 * @param currentPlayers - The current map of player states.
 * @returns A new map of player states with updated ranks.
 */
export function calculateUpdatedRankings(
  currentPlayers: Record<string, LivePlayerState>
): Record<string, LivePlayerState> {
  // Convert players map to an array and filter out potentially invalid/disconnected states if needed (optional)
  const playerList = Object.values(currentPlayers).filter(
    (p) => p.playerStatus !== "KICKED" && p.isConnected // Example: Only rank connected, non-kicked players
  );

  // Sort players by totalScore (highest first)
  // TODO: Add tie-breaker logic later if needed (e.g., totalReactionTimeMs ASC)
  playerList.sort((a, b) => b.totalScore - a.totalScore);

  // Assign ranks, handling ties
  let currentRank = 0;
  let playersAtCurrentRank = 0;
  let lastScore = Infinity; // Start higher than any possible score
  const rankedPlayers: Record<string, LivePlayerState> = {};

  playerList.forEach((player, index) => {
    if (player.totalScore < lastScore) {
      currentRank = index + 1; // Rank starts from 1
      playersAtCurrentRank = 1; // Reset count for this rank
    } else {
      // Score is the same as the previous player (tie)
      playersAtCurrentRank++;
    }
    lastScore = player.totalScore;

    rankedPlayers[player.cid] = {
      ...player,
      rank: currentRank, // Assign the calculated rank
    };
  });

  // Combine ranked players with any players who were filtered out (e.g., disconnected)
  // Ensure filtered-out players retain their original state or have rank set appropriately (e.g., 0 or null)
  const finalPlayersMap = { ...currentPlayers }; // Start with original map
  Object.values(rankedPlayers).forEach((player) => {
    finalPlayersMap[player.cid] = player; // Overwrite with ranked player data
  });

  // Optional: Handle ranks for players not included in sorting (e.g., disconnected)
  Object.keys(finalPlayersMap).forEach((cid) => {
    if (!rankedPlayers[cid]) {
      // Example: Set rank to 0 or null for players not actively ranked
      finalPlayersMap[cid] = { ...finalPlayersMap[cid], rank: 0 };
    }
  });

  // console.log("[RankingUtil] Calculated Ranks:", Object.values(finalPlayersMap).map(p => ({ nick: p.nickname, score: p.totalScore, rank: p.rank })));

  return finalPlayersMap;
}
