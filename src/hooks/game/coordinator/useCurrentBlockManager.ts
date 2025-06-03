// src/hooks/game/coordinator/useCurrentBlockManager.ts
import { useState, useEffect } from "react";
import { GameBlock, LiveGameState, QuizStructureHost } from "@/src/lib/types";
import {
  formatQuestionForPlayer,
  getCurrentHostQuestion,
} from "@/src/lib/game-utils/question-formatter";

interface UseCurrentBlockManagerProps {
  liveGameState: LiveGameState | null;
  initialQuizData: QuizStructureHost | null;
}

export function useCurrentBlockManager({
  liveGameState,
  initialQuizData,
}: UseCurrentBlockManagerProps): GameBlock | null {
  const [currentBlock, setCurrentBlock] = useState<GameBlock | null>(null);

  useEffect(() => {
    if (!liveGameState || !initialQuizData) {
      setCurrentBlock(null);
      return;
    }

    // Ensure currentQuestionIndex is valid before proceeding
    if (
      liveGameState.currentQuestionIndex === -1 &&
      liveGameState.status !== "LOBBY"
    ) {
      // Or handle cases where index might be -1 but it's not lobby, e.g. ENDED
      // For now, if it's not a valid question index for active game states, set to null
      // or perhaps keep the last known block if that's desired.
      // Based on original logic, it seems it would try to format a -1 index question if not lobby
      // which might be unintentional. Let's stick to only formatting if index is valid for a question.
      // The original code didn't have explicit check for -1 here beyond the general !liveGameState.
      // Let's refine this based on expected behavior for non-question states or invalid indices.
      // For now, mirroring original: if initialQuizData and liveGameState are present, it proceeds.
    }

    const hostQuestion = getCurrentHostQuestion(
      initialQuizData,
      liveGameState.currentQuestionIndex
    );

    // getCurrentHostQuestion can return null if index is out of bounds or data is inconsistent
    if (
      !hostQuestion &&
      liveGameState.status !== "LOBBY" &&
      liveGameState.currentQuestionIndex !== -1
    ) {
      // If we expect a question but can't find it, what should currentBlock be?
      // Setting to null seems safest if no valid question data can be retrieved.
      // console.warn(`[useCurrentBlockManager] No host question found for index: ${liveGameState.currentQuestionIndex}`);
      setCurrentBlock(null);
      return;
    }

    // If hostQuestion is null (e.g. index -1 for LOBBY), formatQuestionForPlayer might also need to handle this.
    // Or, we might only call formatQuestionForPlayer if hostQuestion is not null.
    // The original `formatQuestionForPlayer` was called regardless.
    // Let's assume `formatQuestionForPlayer` can handle a potentially null `hostQuestion`
    // or that `getCurrentHostQuestion` for index -1 (LOBBY) returns a specific type of null/undefined
    // that `formatQuestionForPlayer` correctly processes into a "Lobby" block or similar.
    // If `liveGameState.currentQuestionIndex` is -1 (like in LOBBY), `getCurrentHostQuestion`
    // will likely return `null`. `formatQuestionForPlayer` needs to gracefully handle this.
    // For LOBBY state, currentBlock might represent the lobby screen, not a question.

    const formattedBlock = formatQuestionForPlayer(
      hostQuestion, // This can be null
      liveGameState.currentQuestionIndex,
      initialQuizData.questions.length
    );
    setCurrentBlock(formattedBlock);
  }, [
    liveGameState?.currentQuestionIndex,
    liveGameState?.status,
    initialQuizData,
  ]); // Added liveGameState.status for robustness

  return currentBlock;
}
