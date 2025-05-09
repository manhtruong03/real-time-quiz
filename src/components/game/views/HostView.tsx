// src/components/game/views/HostView.tsx
"use client";

import React, { memo, useMemo, useEffect } from "react";
// Import specific block types and state types
import {
  GameBlock,
  isContentBlock,
  LiveGameState, // Import LiveGameState
  QuizStructureHost, // Import QuizStructureHost
} from "@/src/lib/types";
import FooterBar from "../status/FooterBar";
import { cn } from "@/src/lib/utils";
import { useGameAssets } from "@/src/context/GameAssetsContext";
import { Button } from "@/src/components/ui/button";
import { useGameViewBackground } from "@/src/hooks/game/useGameViewBackground";
// Import the specific view components
import { HostLoadingView } from "../host/views/HostLoadingView";
import { HostContentBlockView } from "../host/views/HostContentBlockView";
import { HostInteractiveQuestionView } from "../host/views/HostInteractiveQuestionView";
import { HostAnswerStatsView } from "../host/views/HostAnswerStatsView";
import { ScoreboardView } from "../host/scoreboard/ScoreboardView";
import { PodiumView } from "../host/podium/PodiumView";

interface HostViewProps {
  // Replace questionData with liveGameState and quizData
  liveGameState: LiveGameState | null;
  quizData: QuizStructureHost | null; // Needed for HostAnswerStatsView
  currentBlock: GameBlock | null; // The player-formatted block for display
  timerKey: string | number;
  currentAnswerCount: number;
  totalPlayers: number;
  gamePin?: string;
  accessUrl?: string;
  onTimeUp?: () => void;
  onSkip?: () => void;
  onNext?: () => void;
  isLoading?: boolean; // For overall loading state if needed
  className?: string;
  selectedSoundId: string | null; // Keep sound/bg props
  selectedBackgroundId: string | null;
  onSettingsClick?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

const HostViewComponent: React.FC<HostViewProps> = ({
  liveGameState,
  quizData, // Receive quizData
  currentBlock, // Use the passed formatted block
  timerKey,
  currentAnswerCount,
  totalPlayers,
  gamePin,
  accessUrl,
  onTimeUp,
  onSkip,
  onNext,
  isLoading = false,
  className,
  selectedSoundId,
  selectedBackgroundId,
  onSettingsClick,
  isMuted,
  onToggleMute,
}) => {
  const { isLoading: assetsLoading, error: assetsError } = useGameAssets();
  const {
    style: finalBackgroundStyle,
    hasCustomBackground: hasFinalCustomBackground,
  } = useGameViewBackground({
    selectedBackgroundId,
    currentBlock: liveGameState?.status === 'PODIUM' ? null : currentBlock, // Don't use block background for podium
  });

  const hostViewClasses = cn(
    "min-h-screen h-screen flex flex-col text-foreground relative overflow-hidden", // Added overflow-hidden
    !hasFinalCustomBackground && "default-quiz-background",
    className
  );

  // --- Internal Rendering Logic based on Game State ---
  const mainContent = useMemo(() => {
    const status = liveGameState?.status;

    if (isLoading || assetsLoading) {
      return (
        <HostLoadingView
          message={assetsLoading ? "Loading Assets..." : "Loading..."}
        />
      );
    }
    if (assetsError) {
      return (
        <HostLoadingView message={`Error loading assets: ${assetsError}`} />
      );
    }
    if (!liveGameState) {
      // If no game state at all, show initial loading/waiting
      return <HostLoadingView message="Waiting for game session..." />;
    }
    // If we have game state, but no currentBlock during an active phase, show loading
    if (!currentBlock && status && status !== "LOBBY" && status !== "PODIUM" && status !== "ENDED" && status !== "SHOWING_SCOREBOARD") {
      return <HostLoadingView message="Loading question data..." />;
    }

    switch (status) {
      case "QUESTION_GET_READY":
      case "QUESTION_SHOW":
        if (!currentBlock) return <HostLoadingView message="Loading question..." />; // Should be caught above, but safe fallback
        if (isContentBlock(currentBlock)) {
          return <HostContentBlockView block={currentBlock} />;
        } else {
          return (
            <HostInteractiveQuestionView
              block={currentBlock}
              timerKey={timerKey}
              currentAnswerCount={currentAnswerCount}
              totalPlayers={totalPlayers}
              onTimeUp={onTimeUp}
            />
          );
        }
      case "SHOWING_STATS":
        if (!currentBlock) return <HostLoadingView message="Loading stats..." />; // Need block context for stats
        return (
          <HostAnswerStatsView
            currentBlock={currentBlock}
            quizData={quizData}
            answerStats={liveGameState.currentQuestionStats}
          />
        );
      // --- ADD CASE FOR SCOREBOARD ---
      case "SHOWING_SCOREBOARD":
        return (
          <ScoreboardView
            players={liveGameState.players}
            previousPlayerStates={liveGameState.previousPlayerStateForScoreboard}
            quizTitle={quizData?.title}
          />
        );
      // --- END ADDED CASE ---
      case "PODIUM":
        return (
          <PodiumView
            players={liveGameState.players}
            quizData={quizData}
          />
        );
      case "ENDED":
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-2xl text-white">Game Ended Screen (TODO)</p>
          </div>
        );
      case "LOBBY": // Lobby view is handled by HostPage, HostView shouldn't render in LOBBY
        console.warn("HostView rendered during LOBBY state - this should ideally not happen.");
        return <HostLoadingView message="Returning to lobby..." />;
      default:
        console.warn("HostView encountered unexpected state:", status);
        return <HostLoadingView message="Waiting for game state..." />;
    }
  }, [
    liveGameState,
    quizData,
    currentBlock,
    isLoading,
    assetsLoading,
    assetsError,
    timerKey,
    currentAnswerCount,
    totalPlayers,
    onTimeUp,
  ]);
  // --- End Internal Rendering Logic ---

  return (
    <div className={hostViewClasses} style={finalBackgroundStyle}>
      {!hasFinalCustomBackground && <div className="stars-layer"></div>}
      {hasFinalCustomBackground && finalBackgroundStyle.backgroundImage && (
        <div className="absolute inset-0 bg-black/60 z-0"></div>
      )}

      {/* Main area renders the selected view */}
      <main className="flex-grow flex flex-col justify-center items-stretch p-4 md:p-6 relative z-10 overflow-y-auto">
        {mainContent}
      </main>

      {/* Footer is always present in HostView */}
      {liveGameState && liveGameState.status !== 'LOBBY' && ( // Don't show footer in lobby
        <FooterBar
          currentQuestionIndex={liveGameState.currentQuestionIndex ?? -1}
          totalQuestions={quizData?.questions?.length ?? 0}
          gamePin={gamePin}
          accessUrl={accessUrl}
          // Only show Skip/Next buttons in relevant states
          onSkip={liveGameState.status === 'QUESTION_SHOW' ? onSkip : undefined}
          onNext={
            liveGameState.status === 'SHOWING_STATS' ||
              liveGameState.status === 'SHOWING_SCOREBOARD' ||
              liveGameState.status === 'PODIUM' ||
              (liveGameState.status === 'QUESTION_SHOW') // Allow next for content blocks  |  && currentBlock?.type === 'content'
              ? onNext
              : undefined
          }
          onSettingsClick={onSettingsClick}
          isMuted={isMuted}
          onToggleMute={onToggleMute}
          className="relative z-10 flex-shrink-0"
        />
      )}
    </div>
  );
};

const HostView = memo(HostViewComponent);
export default HostView;
