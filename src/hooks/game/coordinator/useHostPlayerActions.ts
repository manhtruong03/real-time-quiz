// src/hooks/game/coordinator/useHostPlayerActions.ts
import { useCallback } from "react";
import { LiveGameState } from "@/src/lib/types";

// Define the type for setLiveGameState more explicitly if not already globally available
type SetLiveGameState = React.Dispatch<
  React.SetStateAction<LiveGameState | null>
>;

interface UseHostPlayerActionsProps {
  setLiveGameState: SetLiveGameState;
}

interface HostPlayerActions {
  kickPlayerCid: (playerIdToKick: string) => void;
}

export function useHostPlayerActions({
  setLiveGameState,
}: UseHostPlayerActionsProps): HostPlayerActions {
  const kickPlayerCid = useCallback(
    (playerIdToKick: string) => {
      console.log(`[HostPlayerActions] Kicking player CID: ${playerIdToKick}`);
      setLiveGameState((prevLiveGameState) => {
        if (!prevLiveGameState) return null;

        const newPlayers = { ...prevLiveGameState.players };
        if (newPlayers[playerIdToKick]) {
          newPlayers[playerIdToKick] = {
            ...newPlayers[playerIdToKick],
            playerStatus: "KICKED",
            isConnected: false, // Typically, a kicked player is marked as not connected
            lastActivityAt: Date.now(),
          };
        }
        return { ...prevLiveGameState, players: newPlayers };
      });
    },
    [setLiveGameState]
  );

  return {
    kickPlayerCid,
  };
}
