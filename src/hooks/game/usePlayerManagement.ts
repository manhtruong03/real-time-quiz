// src/hooks/game/usePlayerManagement.ts
import { useState, useCallback } from "react";
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
            // --- MODIFIED: Update avatarId if provided ---
            avatarId: avatarId ?? existingPlayer.avatarId, // Use new one, fallback to existing
            // --- END MODIFIED ---

            playerStatus: "PLAYING",
            lastActivityAt: joinTimestamp,
          };
        } else {
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
            rank: 0,
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
          // --- MODIFIED: Directly set avatarId ---
          avatarId: newAvatarId,
          // --- END MODIFIED ---
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

  return {
    addOrUpdatePlayer,
    updatePlayerAvatar,
    updatePlayerConnectionStatus,
  };
}
