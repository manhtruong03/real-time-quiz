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
import { HostAnswerStatsView } from "../host/views/HostAnswerStatsView"; // Import the stats view

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
    currentBlock,
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
    if (!liveGameState || !currentBlock) {
      // Show loading or specific message if state/block isn't ready during an active game phase
      if (status && status !== "LOBBY") {
        return <HostLoadingView message="Loading question data..." />;
      }
      return <HostLoadingView message="Waiting..." />; // Fallback
    }

    switch (status) {
      case "QUESTION_GET_READY": // Combine with QUESTION_SHOW or add specific Get Ready overlay
      case "QUESTION_SHOW":
        if (isContentBlock(currentBlock)) {
          return <HostContentBlockView block={currentBlock} />;
        } else {
          // Pass only necessary props to HostInteractiveQuestionView
          return (
            <HostInteractiveQuestionView
              block={currentBlock} // Already checked it's not ContentBlock
              timerKey={timerKey}
              currentAnswerCount={currentAnswerCount}
              totalPlayers={totalPlayers}
              onTimeUp={onTimeUp}
            />
          );
        }
      case "SHOWING_STATS":
        // Render the stats view
        return (
          <HostAnswerStatsView
            currentBlock={currentBlock}
            quizData={quizData} // Pass full quiz data
            answerStats={liveGameState.currentQuestionStats} // Pass calculated stats
          />
        );
      case "PODIUM":
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-2xl">Podium Screen (TODO)</p>
          </div>
        );
      case "ENDED":
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-2xl">Game Ended Screen (TODO)</p>
          </div>
        );
      // LOBBY is handled by HostPage directly
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
        <div className="absolute inset-0 bg-black/40 z-0"></div>
      )}

      {/* Main area renders the selected view */}
      <main className="flex-grow flex flex-col justify-center items-stretch p-4 md:p-6 relative z-10 overflow-y-auto">
        {mainContent}
      </main>

      {/* Footer is always present in HostView */}
      <FooterBar
        currentQuestionIndex={liveGameState?.currentQuestionIndex ?? -1}
        totalQuestions={quizData?.questions?.length ?? 0} // Get total from quizData
        gamePin={gamePin}
        accessUrl={accessUrl}
        onSkip={onSkip}
        onNext={onNext}
        onSettingsClick={onSettingsClick}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
        className="relative z-10 flex-shrink-0" // Ensure footer doesn't grow
      />
    </div>
  );
};

const HostView = memo(HostViewComponent);
export default HostView;
