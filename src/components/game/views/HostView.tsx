// src/components/game/views/HostView.tsx
"use client";

import React, { useState, useEffect, memo, useMemo } from "react";
import { GameBlock, isContentBlock } from "@/src/lib/types"; // Import necessary types
import QuestionDisplay from "../display/QuestionDisplay";
import MediaDisplay from "../display/MediaDisplay";
import CountdownTimer from "../status/CountdownTimer";
import AnswerCounter from "../status/AnswerCounter";
import FooterBar from "../status/FooterBar";
import AnswerInputArea from "../inputs/AnswerInputArea"; // Host uses this for display only
import { Button } from "@/src/components/ui/button"; // Import Button for the example
import { cn } from "@/src/lib/utils";
import { Loader2, Info } from "lucide-react";
import { useGameBackground } from "@/src/lib/hooks/useGameBackground"; // Correct path assumed
import { useGameAssets } from "@/src/context/GameAssetsContext"; // Import the context hook

interface HostViewProps {
  questionData: GameBlock | null; // Use GameBlock type
  timerKey: string | number; // To ensure timer resets correctly
  currentAnswerCount: number;
  totalPlayers: number;
  gamePin?: string;
  accessUrl?: string;
  onTimeUp?: () => void;
  onSkip?: () => void;
  onNext?: () => void;
  isLoading?: boolean;
  className?: string;
}

// Use React.memo for performance optimization
const HostViewComponent: React.FC<HostViewProps> = ({
  questionData: currentBlock, // Rename prop internally for clarity
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
}) => {
  // --- Background from question block data ---
  const { style: blockBackgroundStyle, hasCustomBackground: hasBlockBackground } =
    useGameBackground(currentBlock);

  // --- Asset Context ---
  const { backgrounds, isLoading: assetsLoading, error: assetsError } = useGameAssets();

  // --- Example State: Simulate receiving a background ID ---
  // In a real app, this ID would likely come from liveGameState or a WebSocket message handler
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | null>(null);

  // --- Find the selected background object using the ID ---
  const selectedBackground = useMemo(() => {
    // Don't try to find if assets are loading, there's an error, or no ID is selected
    if (!selectedBackgroundId || assetsLoading || assetsError || backgrounds.length === 0) {
      return null;
    }
    return backgrounds.find(bg => bg.background_id === selectedBackgroundId) || null; // Ensure null if not found
  }, [selectedBackgroundId, backgrounds, assetsLoading, assetsError]);

  // --- Determine final background style based on priority ---
  const finalBackgroundStyle = useMemo(() => {
    if (selectedBackground?.background_file_path) {
      // 1. Prioritize explicitly selected background image
      return {
        backgroundImage: `url(${JSON.stringify(selectedBackground.background_file_path)})`,
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
      };
    } else if (selectedBackground?.background_color) {
      // 2. Fallback to selected background color
      return { backgroundColor: selectedBackground.background_color };
    } else if (hasBlockBackground) {
      // 3. Fallback to question block's background (if any)
      return blockBackgroundStyle;
    }
    // 4. Default if nothing else applies
    return {};
  }, [selectedBackground, hasBlockBackground, blockBackgroundStyle]);

  // Determine if any custom background (selected or from block) is applied
  const hasFinalCustomBackground = !!(selectedBackground?.background_file_path || selectedBackground?.background_color || hasBlockBackground);

  const hostViewClasses = cn(
    "min-h-screen h-screen flex flex-col text-foreground relative",
    !hasFinalCustomBackground && "default-quiz-background", // Apply default class only if no custom background found
    className
  );

  // --- Internal function to render the main content area based on state ---
  const mainContent = () => {
    if (isLoading || !currentBlock) {
      // Loading or initial state (before first block)
      return (
        <div className="flex flex-col items-center justify-center text-center p-10 flex-grow">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">
            {isLoading
              ? "Loading next question..."
              : "Waiting for game to start..."}
          </p>
        </div>
      );
    }

    // --- Handle Content Block Type ---
    if (isContentBlock(currentBlock)) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center gap-4 md:gap-8 px-4 text-center bg-black/30 text-white backdrop-blur-sm p-6 rounded-lg shadow-lg">
          <Info className="h-12 w-12 text-blue-300 mb-4" />
          {/* Display Title */}
          <QuestionDisplay
            title={currentBlock.title}
            className="mb-2 bg-transparent shadow-none p-0 text-2xl md:text-3xl"
          />
          {/* Display Description */}
          {currentBlock.description && (
            <p className="text-lg md:text-xl mt-2 max-w-xl">{currentBlock.description}</p>
          )}
          {/* Display Media */}
          <MediaDisplay questionData={currentBlock} priority className="mt-4 max-w-md" />
        </div>
      );
    }
    // --- END Handle Content Block Type ---


    // --- Default layout for interactive question types (Quiz, Jumble, Survey, OpenEnded) ---
    return (
      <>
        {/* Question Title Area */}
        <QuestionDisplay
          title={currentBlock.title}
          className="mb-4 md:mb-6 bg-black/30 text-white backdrop-blur-sm shadow-md"
        />

        {/* Main Area: Status, Media, Answer Display */}
        <div className="flex-grow flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-6 px-4">

          {/* Left/Top: Status Indicators */}
          <div className="flex flex-row md:flex-col justify-around md:justify-start gap-4 order-2 md:order-1 mb-4 md:mb-0 bg-black/20 backdrop-blur-sm p-3 rounded-lg self-center md:self-start shadow">
            {/* Timer (only if question is timed) */}
            {currentBlock.timeAvailable > 0 && (
              <CountdownTimer
                key={`cd-${timerKey}`} // Ensure key changes to reset
                initialTime={currentBlock.timeAvailable}
                timeKey={timerKey} // Pass the key to trigger reset
                onTimeUp={onTimeUp}
                className="bg-transparent shadow-none text-white min-w-[80px]" // Style for visibility
              />
            )}
            {/* Answer Counter */}
            <AnswerCounter
              count={currentAnswerCount}
              totalPlayers={totalPlayers}
              className="bg-transparent shadow-none text-white min-w-[80px]" // Style for visibility
            />
          </div>

          {/* Center: Media & Answer Options Display */}
          <div className="w-full md:flex-grow order-1 md:order-2 flex flex-col items-center min-h-0">
            {/* Media Display pushes answers down */}
            <MediaDisplay questionData={currentBlock} priority className="mb-auto max-w-lg w-full" />

            {/* Display Answer Options (Non-interactive for Host) */}
            {(currentBlock.type === 'quiz' || currentBlock.type === 'jumble' || currentBlock.type === 'survey') && currentBlock.choices && (
              <div className="w-full max-w-2xl mt-4">
                <AnswerInputArea
                  questionData={currentBlock}
                  onAnswerSubmit={() => { }} // No-op for host
                  isSubmitting={false}
                  isInteractive={false} // Non-interactive Host view
                />
              </div>
            )}
            {/* Placeholder for Open Ended */}
            {currentBlock.type === "open_ended" && (
              <div className="text-center p-4 mt-4 text-white/70 bg-black/20 rounded-lg w-full max-w-md shadow">
                (Players are typing answers)
              </div>
            )}
          </div>

          {/* Right/Bottom placeholder (for layout balance) */}
          <div className="order-3 w-[100px] hidden md:block flex-shrink-0">
            {/* Empty space */}
          </div>
        </div>
      </>
    );
  };

  // --- Example button function to simulate changing background ID ---
  const simulateBackgroundChange = () => {
    if (assetsLoading || assetsError || backgrounds.length === 0) {
      console.log("Cannot simulate background change: Assets not ready.");
      return;
    }
    const currentBgIndex = backgrounds.findIndex(b => b.background_id === selectedBackgroundId);
    const nextIndex = (currentBgIndex + 1) % backgrounds.length; // Cycle through available backgrounds
    const nextBgId = backgrounds[nextIndex]?.background_id || null;
    setSelectedBackgroundId(nextBgId);
    console.log("[HostView Example] Simulated background change to ID:", nextBgId);
  };
  // --- End Example ---

  // --- Main Return Structure ---
  return (
    <div
      className={hostViewClasses}
      style={finalBackgroundStyle} // Apply the final calculated style
    >
      {/* Conditional default background elements */}
      {!hasFinalCustomBackground && <div className="stars-layer"></div>}
      {/* Overlay only if there's a final background AND it's an image (not just color) */}
      {hasFinalCustomBackground && !selectedBackground?.background_color && (
        <div className="absolute inset-0 bg-black/40 z-0"></div>
      )}


      {/* Main Content Area */}
      <main className="flex-grow flex flex-col justify-center items-stretch p-4 md:p-6 relative z-10 overflow-y-auto">
        {mainContent()}
        {/* Example Button (Positioned for visibility) */}
        {process.env.NODE_ENV === 'development' && ( // Only show in dev
          <Button
            onClick={simulateBackgroundChange}
            variant="secondary"
            size="sm"
            className="absolute bottom-20 right-4 z-20 shadow-lg"
            disabled={assetsLoading || !!assetsError || backgrounds.length === 0}
          >
            Simulate BG Change
          </Button>
        )}
      </main>

      {/* Footer Bar */}
      <FooterBar
        currentQuestionIndex={currentBlock?.gameBlockIndex ?? -1}
        totalQuestions={currentBlock?.totalGameBlockCount ?? 0}
        gamePin={gamePin}
        accessUrl={accessUrl}
        onSkip={onSkip}
        onNext={onNext}
        className="relative z-10" // Ensure footer is above background overlay
      />
    </div>
  );
};

// Memoize the component
const HostView = memo(HostViewComponent);

export default HostView;