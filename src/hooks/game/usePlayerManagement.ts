// src/hooks/game/usePlayerManagement.ts
import { useCallback } from "react";
import { LiveGameState, LivePlayerState } from "@/src/lib/types";

export function usePlayerManagement(
  setLiveGameState: React.Dispatch<React.SetStateAction<LiveGameState | null>>
) {
  const addOrUpdatePlayer = useCallback(
    // --- MODIFIED: Add avatarId parameter ---
    (
      cid: string,
      nickname: string,
      joinTimestamp: number,
      avatarId: string | null
    ) => {
      setLiveGameState((prev) => {
        if (!prev) return null;

        const existingPlayer = prev.players[cid];
        let updatedPlayer: LivePlayerState;

        if (existingPlayer) {
          updatedPlayer = {
            ...existingPlayer,
            nickname: nickname,
            isConnected: true,
            avatarId: avatarId ?? existingPlayer.avatarId,
            playerStatus: "PLAYING",
            lastActivityAt: joinTimestamp,
          };
        } else {
          // For a new player
          const newPlayerRank = Object.keys(prev.players).length + 1; // Assign a rank at the bottom initially
          updatedPlayer = {
            cid: cid,
            nickname: nickname,
            // --- MODIFIED: Set avatarId on creation ---
            avatarId: avatarId, // Use the provided avatarId
            // --- END MODIFIED ---
            isConnected: true,

            joinedAt: joinTimestamp,
            userId: undefined,
            lastActivityAt: joinTimestamp,
            playerStatus: "PLAYING",
            joinSlideIndex: prev.currentQuestionIndex,
            waitingSince: null,

            deviceInfoJson: null,
            totalScore: 0,
            rank: newPlayerRank,
            currentStreak: 0,
            maxStreak: 0,
            lastAnswerTimestamp: null,
            answers: [],
            correctCount: 0,

            incorrectCount: 0,
            unansweredCount: 0,
            answersCount: 0,
            totalReactionTimeMs: 0,
          };
        }

        const updatedPlayers = { ...prev.players, [cid]: updatedPlayer };

        return { ...prev, players: updatedPlayers };
      });
    },
    [setLiveGameState]
  );

  const updatePlayerAvatar = useCallback(
    // This function might become redundant if join handles the initial avatar,
    // but keep it for potential future avatar changes during the game.
    // We'll update it to use avatarId string now.
    (playerId: string, newAvatarId: string, timestamp: number) => {
      setLiveGameState((prev) => {
        if (!prev) return null;
        const playerToUpdate = prev.players[playerId];
        if (!playerToUpdate) {
          return prev;
        }

        const updatedPlayer: LivePlayerState = {
          ...playerToUpdate,
          avatarId: newAvatarId,
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

  const updatePlayerConnectionStatus = useCallback(
    (playerId: string, isConnected: boolean, timestamp: number) => {
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

  const markPlayerAsLeft = useCallback(
    (playerId: string, timestamp: number) => {
      setLiveGameState((prev) => {
        if (!prev) return null;

        const playerToUpdate = prev.players[playerId];
        if (!playerToUpdate) {
          console.warn(
            `[PlayerManagement] markPlayerAsLeft: Player with CID ${playerId} not found.`
          );
          return prev;
        }

        // Optional: Check if already in the desired state to prevent unnecessary updates
        // and potential re-renders, though React should handle the latter if data doesn't change.
        if (
          playerToUpdate.playerStatus === "LEFT" &&
          !playerToUpdate.isConnected
        ) {
          console.log(
            `[PlayerManagement] markPlayerAsLeft: Player ${playerId} is already marked as LEFT.`
          );
          return prev;
        }

        console.log(
          `[PlayerManagement] Marking player ${playerId} as LEFT. Current status: ${playerToUpdate.playerStatus}, isConnected: ${playerToUpdate.isConnected}`
        );

        const updatedPlayer: LivePlayerState = {
          ...playerToUpdate,
          isConnected: false, // Player is no longer connected
          playerStatus: "LEFT", // Set the specific "LEFT" status
          lastActivityAt: timestamp, // Update last activity timestamp
        };

        return {
          ...prev,
          players: { ...prev.players, [playerId]: updatedPlayer },
        };
      });
    },
    [setLiveGameState]
  );

  const kickPlayer = useCallback(
    (playerId: string, timestamp: number) => {
      setLiveGameState((prev) => {
        if (!prev) return null;

        const playerToUpdate = prev.players[playerId];
        if (!playerToUpdate) {
          console.warn(
            `[PlayerManagement] kickPlayer: Player with CID ${playerId} not found.`
          );
          return prev;
        }

        // Check if player is already kicked to avoid redundant updates
        if (playerToUpdate.playerStatus === "KICKED") {
          console.log(
            `[PlayerManagement] kickPlayer: Player ${playerId} is already marked as KICKED.`
          );
          return prev;
        }

        console.log(
          `[PlayerManagement] Kicking player ${playerId}. Current status: ${playerToUpdate.playerStatus}, isConnected: ${playerToUpdate.isConnected}`
        );

        const updatedPlayer: LivePlayerState = {
          ...playerToUpdate,
          isConnected: false,
          playerStatus: "KICKED",
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

  return {
    addOrUpdatePlayer,
    updatePlayerAvatar,
    updatePlayerConnectionStatus,
    markPlayerAsLeft,
    kickPlayer,
  };
}
