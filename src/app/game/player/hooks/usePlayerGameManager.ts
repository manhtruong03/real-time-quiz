// src/app/game/player/hooks/usePlayerGameManager.ts
import { useState, useCallback } from "react";
import {
  GameBlock,
  QuestionResultPayload,
  // Avatar as AvatarType, // This import seems unused in the provided file
  KickPlayerMessageContent, // Assuming KickPlayerMessageContent is exported from websocket-protocol.ts
} from "@/src/lib/types";

export interface MinimalPlayerInfo {
  cid: string | null;
  name: string;
  avatarId: string | null;
  totalScore: number;
  rank: number | undefined;
}

export interface UsePlayerGameManagerReturn {
  // State
  currentBlock: GameBlock | null;
  currentResult: QuestionResultPayload | null;
  isSubmitting: boolean;
  playerInfo: MinimalPlayerInfo;
  currentBackgroundId: string | null;
  isKicked: boolean;

  // Actions / Setters
  processGameMessage: (dataTypeId: number, content: any) => void;
  resetCoreGameState: () => void;
  setPlayerClientId: (cid: string | null) => void;
  setPlayerNickname: (name: string) => void;
  setPlayerAvatarId: (avatarId: string | null) => void;
  setIsPlayerSubmitting: (submitting: boolean) => void;
  clearCurrentBlock: () => void;
  clearCurrentResult: () => void;
}

export function usePlayerGameManager(
  initialPlayerInfo?: Partial<MinimalPlayerInfo>
): UsePlayerGameManagerReturn {
  const [currentBlock, setCurrentBlockInternal] = useState<GameBlock | null>(
    null
  );
  const [currentResult, setCurrentResultInternal] =
    useState<QuestionResultPayload | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playerInfo, setPlayerInfo] = useState<MinimalPlayerInfo>({
    cid: initialPlayerInfo?.cid || null,
    name: initialPlayerInfo?.name || "",
    avatarId: initialPlayerInfo?.avatarId || null,
    totalScore: initialPlayerInfo?.totalScore || 0,
    rank: initialPlayerInfo?.rank || undefined,
  });
  const [currentBackgroundId, setCurrentBackgroundId] = useState<string | null>(
    null
  );
  const [isKicked, setIsKicked] = useState(false);

  const setIsPlayerSubmitting = useCallback((submitting: boolean) => {
    setIsSubmitting(submitting);
  }, []);

  const clearCurrentBlock = useCallback(() => {
    setCurrentBlockInternal(null);
  }, []);

  const clearCurrentResult = useCallback(() => {
    setCurrentResultInternal(null);
  }, []);

  const _setCurrentBlockState = useCallback((block: GameBlock | null) => {
    setCurrentResultInternal(null); // Clear previous result
    setIsSubmitting(false); // Reset submitting state
    setCurrentBlockInternal(block);
  }, []);

  const _setCurrentResultState = useCallback(
    (result: QuestionResultPayload | null) => {
      setCurrentBlockInternal(null); // Clear block when result comes in
      setIsSubmitting(false); // Reset submitting state
      setCurrentResultInternal(result);
      if (result) {
        setPlayerInfo((prev) => ({
          ...prev,
          totalScore: result.totalScore,
          rank: result.rank,
        }));
      }
    },
    []
  );

  const processGameMessage = useCallback(
    (dataTypeId: number, content: any) => {
      // Content is already parsed by the caller
      if (isKicked) {
        // If player is already marked as kicked, ignore further game messages
        console.log(
          "[usePlayerGameManager] Player is kicked, ignoring message ID:",
          dataTypeId
        );
        return;
      }

      if (dataTypeId === 10) {
        // Kick Player Message ID
        const kickContent = content as KickPlayerMessageContent;
        console.log(
          `[usePlayerGameManager] Processing Kick Message (ID: ${dataTypeId}): Kick Code: ${kickContent?.kickCode}`
        );
        _setCurrentBlockState(null); // Clear any current question
        _setCurrentResultState(null); // Clear any current result
        setIsKicked(true);
      } else if (dataTypeId === 1 || dataTypeId === 2) {
        // Question data
        console.log(
          `[usePlayerGameManager] Processing Question Block (ID: ${dataTypeId}):`,
          content.type,
          `(Index: ${content.gameBlockIndex})`
        );
        _setCurrentBlockState(content as GameBlock);
      } else if (dataTypeId === 8 || dataTypeId === 13) {
        // Result or Podium data
        console.log(
          `[usePlayerGameManager] Processing Result/Podium (ID: ${dataTypeId}):`,
          content.type,
          `(Index: ${content.pointsData?.lastGameBlockIndex})`
        );
        _setCurrentResultState(content as QuestionResultPayload);
      } else if (dataTypeId === 35) {
        // Host Background Change
        console.log(
          `[usePlayerGameManager] Processing Background Change (ID: ${dataTypeId})`
        );
        const newBackgroundId = content?.background?.id;
        if (typeof newBackgroundId === "string" && newBackgroundId) {
          setCurrentBackgroundId(newBackgroundId);
        } else {
          console.warn(
            "[usePlayerGameManager] Received background change message but ID was missing or invalid:",
            content
          );
        }
      } else {
        // This function should only be called with game-specific messages.
        // console.log(`[usePlayerGameManager] Received unhandled data type ID: ${dataTypeId}`, content);
      }
    },
    [_setCurrentBlockState, _setCurrentResultState, isKicked] // Added isKicked to dependency array
  );

  const resetCoreGameState = useCallback(() => {
    setCurrentBlockInternal(null);
    setCurrentResultInternal(null);
    setIsSubmitting(false);
    setCurrentBackgroundId(null);
    setIsKicked(false);
    // Keep cid and name, reset game-specific parts of playerInfo
    setPlayerInfo((prev) => ({
      ...prev, // Keep cid and name
      avatarId: prev.avatarId, // Keep avatarId unless explicitly changed elsewhere
      totalScore: 0,
      rank: undefined,
    }));
  }, []);

  const setPlayerClientId = useCallback((cid: string | null) => {
    setPlayerInfo((prev) => ({ ...prev, cid }));
  }, []);

  const setPlayerNickname = useCallback((name: string) => {
    setPlayerInfo((prev) => ({ ...prev, name }));
  }, []);

  const setPlayerAvatarId = useCallback((avatarId: string | null) => {
    setPlayerInfo((prev) => ({ ...prev, avatarId }));
  }, []);

  return {
    currentBlock,
    currentResult,
    isSubmitting,
    playerInfo,
    currentBackgroundId,
    isKicked,
    processGameMessage,
    resetCoreGameState,
    setPlayerClientId,
    setPlayerNickname,
    setPlayerAvatarId,
    setIsPlayerSubmitting,
    clearCurrentBlock,
    clearCurrentResult,
  };
}
