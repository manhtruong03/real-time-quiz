// src/components/game/views/HostView.tsx
"use client";

import React, { useState, useEffect, memo } from "react";
import { GameBlock, isContentBlock } from "@/src/lib/types"; // Use GameBlock type and type guard
import QuestionDisplay from "../display/QuestionDisplay";
import MediaDisplay from "../display/MediaDisplay";
import CountdownTimer from "../status/CountdownTimer";
import AnswerCounter from "../status/AnswerCounter";
import FooterBar from "../status/FooterBar";
import AnswerInputArea from "../inputs/AnswerInputArea"; // Host uses this for display only
import { cn } from "@/src/lib/utils";
import { Loader2, Info } from "lucide-react";
import { useGameBackground } from "@/src/lib/hooks/useGameBackground"; // Correct path assumed

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

const HostViewComponent: React.FC<HostViewProps> = ({
  questionData: currentBlock, // Rename prop internally for clarity
  timerKey, // Destructure the new prop
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
  const { style: backgroundStyle, hasCustomBackground } =
    useGameBackground(currentBlock); // Use the hook

  const hostViewClasses = cn(
    "min-h-screen h-screen flex flex-col text-foreground relative",
    !hasCustomBackground && "default-quiz-background", // Apply default class if no image
    className
  );

  // const [timerKey, setTimerKey] = useState(0); // To reset timer

  // useEffect(() => {
  //   if (currentBlock) {
  //     setTimerKey(currentBlock.gameBlockIndex); // Change key when block changes
  //   }
  // }, [currentBlock]);

  const mainContent = () => {
    if (isLoading || !currentBlock) {
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
            className="mb-2 bg-transparent shadow-none p-0 text-2xl md:text-3xl" // Use QuestionDisplay for consistency
          />
          {/* Display Description */}
          {currentBlock.description && (
            <p className="text-lg md:text-xl mt-2 max-w-xl">{currentBlock.description}</p>
          )}
          {/* Optionally show media if content blocks can have it */}
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
          className="mb-4 md:mb-6 bg-black/30 text-white backdrop-blur-sm shadow-md" // Style for readability
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
                className="bg-transparent shadow-none text-white min-w-[80px]" // Ensure some min width
              />
            )}
            {/* Answer Counter */}
            <AnswerCounter
              count={currentAnswerCount}
              totalPlayers={totalPlayers}
              className="bg-transparent shadow-none text-white min-w-[80px]" // Ensure some min width
            />
          </div>

          {/* Center: Media & Answer Options Display */}
          <div className="w-full md:flex-grow order-1 md:order-2 flex flex-col items-center min-h-0"> {/* Added min-h-0 */}
            <MediaDisplay questionData={currentBlock} priority className="mb-auto" /> {/* Pushes answers down */}

            {/* Display Answer Options (Non-interactive) */}
            {(currentBlock.type === 'quiz' || currentBlock.type === 'jumble' || currentBlock.type === 'survey') && currentBlock.choices && (
              <div className="w-full max-w-2xl mt-4"> {/* Added margin-top */}
                <AnswerInputArea
                  questionData={currentBlock}
                  onAnswerSubmit={() => { }} // No-op for host
                  isSubmitting={false}
                  isInteractive={false} // *** Non-interactive for Host view ***
                />
              </div>
            )}
            {currentBlock.type === "open_ended" && (
              <div className="text-center p-4 mt-4 text-white/70 bg-black/20 rounded-lg w-full max-w-md shadow">
                (Players are typing answers)
              </div>
            )}
          </div>

          {/* Right/Bottom placeholder (was legend) - Keep layout consistent */}
          {/* Adjusted width to approximately match status indicators */}
          <div className="order-3 w-[100px] hidden md:block flex-shrink-0">
            {/* Empty space for balance */}
          </div>
        </div>
      </>
    );
  };

  return (
    <div
      className={hostViewClasses}
      style={backgroundStyle}
    >
      {!hasCustomBackground && <div className="stars-layer"></div>}
      {hasCustomBackground && (
        <div className="absolute inset-0 bg-black/40 z-0"></div>
      )}

      {/* Main Content Area - ensure it allows scrolling if content overflows */}
      <main className="flex-grow flex flex-col justify-center items-stretch p-4 md:p-6 relative z-10 overflow-y-auto">
        {mainContent()}
      </main>

      {/* Footer Bar */}
      <FooterBar
        // Use nullish coalescing for safety
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

// Wrap the component export with React.memo
const HostView = memo(HostViewComponent);

export default HostView;