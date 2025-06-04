// src/hooks/game/coordinator/useHostPlayerActions.ts
import { useCallback } from "react";
import { LiveGameState, LivePlayerState } from "@/src/lib/types"; // Ensure types are imported

interface UseHostPlayerActionsProps {
  setLiveGameState: React.Dispatch<React.SetStateAction<LiveGameState | null>>;
  // Add other dependencies if any, e.g., onSendMessage
}

export function useHostPlayerActions({
  setLiveGameState,
}: UseHostPlayerActionsProps) {
  const kickPlayerCid = useCallback(
    (cidToKick: string) => {
      setLiveGameState((prevState) => {
        if (!prevState) {
          console.warn(
            `[HostPlayerActions] Cannot kick player: LiveGameState is null.`
          );
          return null;
        }
        if (!prevState.players[cidToKick]) {
          console.warn(
            `[HostPlayerActions] Player ${cidToKick} not found for kicking.`
          );
          return prevState;
        }

        const playerToUpdate = prevState.players[cidToKick];

        // Avoid re-processing if already kicked to prevent unintended logs or state thrashing
        if (
          playerToUpdate.playerStatus === "KICKED" &&
          !playerToUpdate.isConnected
        ) {
          console.log(
            `[HostPlayerActions] Player ${cidToKick} is already kicked.`
          );
          return prevState;
        }

        const updatedPlayer: LivePlayerState = {
          ...playerToUpdate,
          isConnected: false,
          playerStatus: "KICKED", // Status is set to KICKED
          lastActivityAt: Date.now(), // Update activity timestamp
        };

        // <<< ADDED CONSOLE.LOG FOR DEBUGGING >>>
        console.log(
          `[HostPlayerActions Debug] Attempting to update status for kicked player ${cidToKick}. New player state data:`,
          updatedPlayer
        );

        return {
          ...prevState,
          players: {
            ...prevState.players,
            [cidToKick]: updatedPlayer,
          },
        };
      });
      // Note: Further actions like sending a WebSocket message to the kicked player
      // or notifying other services would typically happen here, outside setLiveGameState.
      // For example: onSendMessage(prepareKickMessage(cidToKick));
      console.log(
        `[HostPlayerActions] Kick action initiated for player CID: ${cidToKick}`
      );
    },
    [setLiveGameState /*, onSendMessage (if used) */]
  );

  // Add other actions like banPlayer, mutePlayer, etc. if needed

  return {
    kickPlayerCid,
  };
}
