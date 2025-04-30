// src/hooks/game/usePlayerManagement.ts
import { useState, useCallback } from "react";
import { LiveGameState, LivePlayerState } from "@/src/lib/types";

// This hook assumes it receives the full gameState and a function to update it.
// Alternatively, it could manage just the 'players' slice internally.
// Using the full state setter is often simpler for coordination.
export function usePlayerManagement(
  // No longer takes gameState directly, relies on setLiveGameState closure
  setLiveGameState: React.Dispatch<React.SetStateAction<LiveGameState | null>>
) {
  const addOrUpdatePlayer = useCallback(
    (cid: string, nickname: string, joinTimestamp: number) => {
      //   console.log(`[PlayerMgmtHook] Adding/Updating player - CID: ${cid}, Nickname: ${nickname}`);
      setLiveGameState((prev) => {
        if (!prev) return null; // Should not happen if initialized correctly

        const existingPlayer = prev.players[cid];
        let updatedPlayer: LivePlayerState;

        if (existingPlayer) {
          // Update existing player (e.g., reconnected with same CID or nickname change allowed)
          updatedPlayer = {
            ...existingPlayer,
            nickname: nickname, // Update nickname
            isConnected: true, // Mark as connected
            playerStatus: "PLAYING", // Reset status on rejoin maybe?
            lastActivityAt: joinTimestamp,
          };
        } else {
          // Create new player state
          updatedPlayer = {
            cid: cid,
            nickname: nickname,
            avatar: { type: 1800, item: 3100 }, // Default avatar
            isConnected: true,
            joinedAt: joinTimestamp, // Use provided timestamp
            userId: undefined, // Assuming guest for now
            lastActivityAt: joinTimestamp,
            playerStatus: "PLAYING", // Player is active immediately after join logic
            joinSlideIndex: prev.currentQuestionIndex, // Record when they joined
            waitingSince: null,
            deviceInfoJson: null,
            totalScore: 0,
            rank: 0, // Initial rank
            currentStreak: 0,
            maxStreak: 0,
            lastAnswerTimestamp: null,
            answers: [], // Initialize empty answers
            correctCount: 0,
            incorrectCount: 0,
            unansweredCount: 0,
            answersCount: 0,
            totalReactionTimeMs: 0,
          };
        }

        const updatedPlayers = { ...prev.players, [cid]: updatedPlayer };

        // Return the new state object
        return { ...prev, players: updatedPlayers };
      });
    },
    [setLiveGameState] // Dependency on the state setter function
  );

  const updatePlayerAvatar = useCallback(
    (playerId: string, avatarId: number, timestamp: number) => {
      //   console.log(`[PlayerMgmtHook] Updating avatar for player ${playerId} to ${avatarId}`);
      setLiveGameState((prev) => {
        if (!prev) return null;
        const playerToUpdate = prev.players[playerId];
        if (!playerToUpdate) {
          //   console.warn(`(PlayerMgmtHook) Avatar change for unknown player CID: ${playerId}`);
          return prev;
        }

        // Logic to determine type/item from ID (assuming convention)
        const avatarType = Math.floor(avatarId / 1000) * 1000;
        const avatarItem = avatarId;

        const updatedPlayer: LivePlayerState = {
          ...playerToUpdate,
          avatar: { type: avatarType, item: avatarItem },
          lastActivityAt: timestamp,
        };

        return {
          ...prev,
          players: { ...prev.players, [playerId]: updatedPlayer },
        };
      });
    },
    [setLiveGameState]
  );

  // Example: Function to update connection status (could be expanded)
  const updatePlayerConnectionStatus = useCallback(
    (playerId: string, isConnected: boolean, timestamp: number) => {
      // console.log(`[PlayerMgmtHook] Updating connection status for ${playerId} to ${isConnected}`);
      setLiveGameState((prev) => {
        if (!prev || !prev.players[playerId]) return prev;
        const updatedPlayer = {
          ...prev.players[playerId],
          isConnected: isConnected,
          lastActivityAt: timestamp,
          playerStatus: isConnected
            ? prev.players[playerId].playerStatus
            : ("DISCONNECTED" as const),
        };
        return {
          ...prev,
          players: { ...prev.players, [playerId]: updatedPlayer },
        };
      });
    },
    [setLiveGameState]
  );

  // Note: Calculating totalPlayers might be better done in the coordinator or page
  // based on the latest liveGameState.players object.

  return {
    addOrUpdatePlayer,
    updatePlayerAvatar,
    updatePlayerConnectionStatus,
    // Expose functions needed by other hooks or the coordinator
  };
}
