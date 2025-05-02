// src/components/game/views/HostView.tsx
"use client";

import React, { memo, useMemo, useRef, useEffect, useState } from "react";
// Import specific block types if needed
import { GameBlock, isContentBlock } from "@/src/lib/types"; // Adjust path
import FooterBar from "../status/FooterBar";
import { cn } from "@/src/lib/utils";
import { Volume2, VolumeX } from "lucide-react"; // Keep Volume icons
import { useGameAssets } from "@/src/context/GameAssetsContext"; // Adjust path
import { Button } from "@/src/components/ui/button";

import { useGameViewBackground } from '@/src/hooks/game/useGameViewBackground';
import { useHostAudioManager } from '@/src/hooks/game/useHostAudioManager';
import { HostLoadingView } from '../host/views/HostLoadingView';
import { HostContentBlockView } from '../host/views/HostContentBlockView';
import { HostInteractiveQuestionView } from '../host/views/HostInteractiveQuestionView';
// ---

interface HostViewProps {
  questionData: GameBlock | null; // This is the formatted block for players/display
  timerKey: string | number;
  currentAnswerCount: number;
  totalPlayers: number;
  gamePin?: string;
  accessUrl?: string;
  onTimeUp?: () => void;
  onSkip?: () => void;
  onNext?: () => void;
  isLoading?: boolean; // Keep isLoading prop
  className?: string;
  selectedSoundId: string | null;
  selectedBackgroundId: string | null;
  onSettingsClick?: () => void;
}

const HostViewComponent: React.FC<HostViewProps> = ({
  questionData: currentBlock, // Rename internally for clarity
  timerKey,
  currentAnswerCount,
  totalPlayers,
  gamePin,
  accessUrl,
  onTimeUp,
  onSkip,
  onNext,
  isLoading = false, // Default isLoading to false
  className,
  selectedSoundId,
  selectedBackgroundId,
  onSettingsClick,
}) => {
  // --- Use Assets Context (might still be needed for error/loading checks) ---
  const { isLoading: assetsLoading, error: assetsError } = useGameAssets();

  // --- Use the new Hooks ---
  const { isMuted, toggleMute } = useHostAudioManager({ selectedSoundId });
  const { style: finalBackgroundStyle, hasCustomBackground: hasFinalCustomBackground } = useGameViewBackground({
    selectedBackgroundId, // Pass the prop from HostPage
    currentBlock,
  });

  // --- Define Classes ---
  const hostViewClasses = cn(
    "min-h-screen h-screen flex flex-col text-foreground relative",
    !hasFinalCustomBackground && "default-quiz-background",
    className
  );


  // --- Simplified mainContent Rendering Logic ---
  const mainContent = () => {
    if (isLoading || assetsLoading) { // Also check assets loading
      return <HostLoadingView message={assetsLoading ? "Loading Assets..." : "Loading..."} />;
    }
    if (assetsError) {
      return <HostLoadingView message={`Error loading assets: ${assetsError}`} /> // Show error
    }
    if (!currentBlock && !isLoading) { // Check !isLoading here too
      return <HostLoadingView message="Waiting for game..." />;
    }
    if (!currentBlock) { // Should be caught by isLoading or !currentBlock above, but safe check
      return <HostLoadingView message="Loading..." />;
    }

    if (isContentBlock(currentBlock)) {
      return <HostContentBlockView block={currentBlock} />;
    } else {
      return <HostInteractiveQuestionView
        block={currentBlock}
        timerKey={timerKey}
        currentAnswerCount={currentAnswerCount}
        totalPlayers={totalPlayers}
        onTimeUp={onTimeUp}
      />;
    }
  };
  // --- End Simplified mainContent ---

  // --- Main Return Structure (Largely unchanged) ---
  return (
    // Use style and boolean from the hook
    <div className={hostViewClasses} style={finalBackgroundStyle}>
      {/* Background layers - Use boolean from hook */}
      {!hasFinalCustomBackground && <div className="stars-layer"></div>}
      {hasFinalCustomBackground && finalBackgroundStyle.backgroundColor === undefined && (
        // Only add overlay if it's an image BG
        <div className="absolute inset-0 bg-black/40 z-0"></div>
      )}

      {/* Mute Button */}
      <Button
        variant="ghost" size="icon" onClick={toggleMute}
        className="absolute top-4 right-4 z-20 text-white bg-black/30 hover:bg-black/50"
        title={isMuted ? "Unmute Lobby Music" : "Mute Lobby Music"}
      >
        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </Button>

      <main className="flex-grow flex flex-col justify-center items-stretch p-4 md:p-6 relative z-10 overflow-y-auto">
        {mainContent()}
      </main>

      <FooterBar
        currentQuestionIndex={currentBlock?.gameBlockIndex ?? -1}
        totalQuestions={currentBlock?.totalGameBlockCount ?? 0}
        gamePin={gamePin}
        accessUrl={accessUrl}
        onSkip={onSkip}
        onNext={onNext}
        onSettingsClick={onSettingsClick}
        className="relative z-10"
      />
    </div>
  );
};

const HostView = memo(HostViewComponent);
export default HostView;