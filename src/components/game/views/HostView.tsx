// src/components/game/views/HostView.tsx
"use client";

import React, { useState, useEffect, memo, useMemo, useRef } from "react";
import { GameBlock, isContentBlock } from "@/src/lib/types"; // Import Sound
import QuestionDisplay from "../display/QuestionDisplay";
import MediaDisplay from "../display/MediaDisplay";
import CountdownTimer from "../status/CountdownTimer";
import AnswerCounter from "../status/AnswerCounter";
import FooterBar from "../status/FooterBar";
import AnswerInputArea from "../inputs/AnswerInputArea";
import { cn } from "@/src/lib/utils";
import { Loader2, Info, Volume2, VolumeX } from "lucide-react"; // Added Volume icons
import { useGameBackground } from "@/src/lib/hooks/useGameBackground";
import { useGameAssets } from "@/src/context/GameAssetsContext";
import { Button } from "@/src/components/ui/button"; // For mute button example

interface HostViewProps {
  questionData: GameBlock | null;
  timerKey: string | number;
  currentAnswerCount: number;
  totalPlayers: number;
  gamePin?: string;
  accessUrl?: string;
  onTimeUp?: () => void;
  onSkip?: () => void;
  onNext?: () => void;
  isLoading?: boolean;
  className?: string;
  selectedSoundId: string | null; // Receive selected sound ID
  selectedBackgroundId: string | null; // Receive selected background ID
  onSettingsClick?: () => void; // Receive settings click handler
}

const HostViewComponent: React.FC<HostViewProps> = ({
  questionData: currentBlock,
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
  selectedSoundId, // Destructure
  selectedBackgroundId, // Destructure
  onSettingsClick, // Destructure
}) => {
  const { backgrounds, sounds, isLoading: assetsLoading, error: assetsError } = useGameAssets();
  const { style: blockBackgroundStyle, hasCustomBackground: hasBlockBackground } = useGameBackground(currentBlock);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  // Track if the user *wants* audio playing, even if browser blocked initial autoplay
  const [audioShouldBePlaying, setAudioShouldBePlaying] = useState(false);

  // --- Background Logic (no changes needed here) ---

  // --- Background Logic ---
  const selectedBackground = useMemo(() => {
    if (!selectedBackgroundId || assetsLoading || assetsError || backgrounds.length === 0) return null;
    return backgrounds.find(bg => bg.background_id === selectedBackgroundId) || null;
  }, [selectedBackgroundId, backgrounds, assetsLoading, assetsError]);

  const finalBackgroundStyle = useMemo(() => {
    if (selectedBackground?.background_file_path) {
      return { backgroundImage: `url(${JSON.stringify(selectedBackground.background_file_path)})`, backgroundSize: "cover", backgroundPosition: "center center", backgroundRepeat: "no-repeat" };
    } else if (selectedBackground?.background_color) {
      return { backgroundColor: selectedBackground.background_color };
    } else if (hasBlockBackground) {
      return blockBackgroundStyle;
    }
    return {};
  }, [selectedBackground, hasBlockBackground, blockBackgroundStyle]);

  const hasFinalCustomBackground = !!(selectedBackground?.background_file_path || selectedBackground?.background_color || hasBlockBackground);

  const hostViewClasses = cn(
    "min-h-screen h-screen flex flex-col text-foreground relative",
    !hasFinalCustomBackground && "default-quiz-background",
    className
  );

  // --- Audio Handling Effects ---

  // Effect 1: Create/Update Audio Element and Source
  useEffect(() => {
    if (assetsLoading || assetsError || sounds.length === 0) return;

    const lobbySounds = sounds.filter(s => s.sound_type === 'LOBBY' && s.is_active);
    if (lobbySounds.length === 0) return;

    const soundIdToUse = selectedSoundId ?? lobbySounds[0]?.sound_id;
    const soundToPlay = lobbySounds.find(s => s.sound_id === soundIdToUse);

    if (!soundToPlay) {
      console.warn(`[HostView Audio] Sound not found for ID: ${soundIdToUse}`);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause(); // Pause if selected sound is invalid
        setAudioShouldBePlaying(false);
      }
      return;
    }

    const currentAudio = audioPlayerRef.current;
    const needsNewUrl = !currentAudio || currentAudio.src !== soundToPlay.file_path;

    if (!currentAudio) {
      // --- Create Audio Element ---
      console.log("[HostView Audio] Creating audio element for:", soundToPlay.name);
      const newAudio = new Audio(soundToPlay.file_path);
      newAudio.loop = true;
      newAudio.volume = isMuted ? 0 : 0.5;
      audioPlayerRef.current = newAudio;
      setAudioShouldBePlaying(true); // Indicate intent to play

    } else if (needsNewUrl) {
      // --- Change Source ---
      console.log(`[HostView Audio] Changing track to: ${soundToPlay.name}`);
      currentAudio.pause(); // Pause before changing source
      currentAudio.src = soundToPlay.file_path;
      currentAudio.load(); // Important: load the new source
      currentAudio.loop = true; // Ensure loop is set on new source
      currentAudio.volume = isMuted ? 0 : 0.5; // Ensure volume is correct
      setAudioShouldBePlaying(true); // Indicate intent to play new track
    }
    // Note: Play logic is handled in the next effect to coordinate with state changes

  }, [assetsLoading, assetsError, sounds, selectedSoundId]); // Rerun when assets/selection change


  // Effect 2: Handle Play/Pause/Volume based on state
  useEffect(() => {
    const audio = audioPlayerRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : 0.5; // Apply mute state

    if (audioShouldBePlaying && !isMuted && audio.paused) {
      // If it *should* be playing, isn't muted, but *is* paused (e.g., initial block or after track change)
      console.log("[HostView Audio] Attempting to play (Effect 2)... Source:", audio.src);
      audio.play().catch(error => {
        console.warn("[HostView Audio] Playback failed (likely needs interaction):", error);
        // Keep audioShouldBePlaying true, requires user action via unmute/play button
      });
    } else if ((!audioShouldBePlaying || isMuted) && !audio.paused) {
      // If it *shouldn't* be playing OR is muted, pause it
      console.log("[HostView Audio] Pausing (Effect 2)...");
      audio.pause();
    }

  }, [audioShouldBePlaying, isMuted, selectedSoundId]); // React to intent, mute state, and track changes


  // Effect 3: Cleanup on unmount
  useEffect(() => {
    // Return a cleanup function
    return () => {
      if (audioPlayerRef.current) {
        console.log("[HostView Audio] Pausing audio and cleaning up on unmount");
        audioPlayerRef.current.pause();
        audioPlayerRef.current.removeAttribute('src'); // Release resource
        audioPlayerRef.current.load(); // Abort loading if any
        audioPlayerRef.current = null;
        setAudioShouldBePlaying(false); // Reset intent
      }
    };
  }, []); // Empty array ensures this runs only on unmount


  // --- Toggle Mute Function ---
  const toggleMute = () => {
    const audio = audioPlayerRef.current;
    if (!audio) return;

    const newMutedState = !isMuted;
    setIsMuted(newMutedState); // Update state first

    // If unmuting, explicitly try to play again if it's paused
    if (!newMutedState && audio.paused && audioShouldBePlaying) {
      console.log("[HostView Audio] Attempting to play on unmute...");
      audio.play().catch(error => {
        console.warn("[HostView Audio] Playback failed on unmute (likely needs interaction):", error);
      });
    }
    // The volume change will be handled by Effect 2 reacting to isMuted change
    console.log("[HostView Audio] Toggled mute state to:", newMutedState);
  };

  // --- mainContent function (no changes needed) ---
  const mainContent = () => {
    if (isLoading || !currentBlock) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-10 flex-grow">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">{isLoading ? "Loading..." : "Waiting..."}</p>
        </div>
      );
    }
    if (isContentBlock(currentBlock)) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center gap-4 md:gap-8 px-4 text-center bg-black/30 text-white backdrop-blur-sm p-6 rounded-lg shadow-lg">
          <Info className="h-12 w-12 text-blue-300 mb-4" />
          <QuestionDisplay title={currentBlock.title} className="mb-2 bg-transparent shadow-none p-0 text-2xl md:text-3xl" />
          {currentBlock.description && <p className="text-lg md:text-xl mt-2 max-w-xl">{currentBlock.description}</p>}
          <MediaDisplay questionData={currentBlock} priority className="mt-4 max-w-md" />
        </div>
      );
    }
    // Default layout for interactive question types
    return (
      <>
        {/* Interactive block UI (Question, Media, Status, Answers) */}
        <QuestionDisplay title={currentBlock.title} className="mb-4 md:mb-6 bg-black/30 text-white backdrop-blur-sm shadow-md" />
        <div className="flex-grow flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-6 px-4">
          {/* Status */}
          <div className="flex flex-row md:flex-col justify-around md:justify-start gap-4 order-2 md:order-1 mb-4 md:mb-0 bg-black/20 backdrop-blur-sm p-3 rounded-lg self-center md:self-start shadow">
            {currentBlock.timeAvailable > 0 && (
              <CountdownTimer key={`cd-${timerKey}`} initialTime={currentBlock.timeAvailable} timeKey={timerKey} onTimeUp={onTimeUp} className="bg-transparent shadow-none text-white min-w-[80px]" />
            )}
            <AnswerCounter count={currentAnswerCount} totalPlayers={totalPlayers} className="bg-transparent shadow-none text-white min-w-[80px]" />
          </div>
          {/* Media & Answers */}
          <div className="w-full md:flex-grow order-1 md:order-2 flex flex-col items-center min-h-0">
            <MediaDisplay questionData={currentBlock} priority className="mb-auto max-w-lg w-full" />
            {/* Answer Display Area */}
            {(currentBlock.type === 'quiz' || currentBlock.type === 'jumble' || currentBlock.type === 'survey') && currentBlock.choices && (
              <div className="w-full max-w-2xl mt-4">
                <AnswerInputArea questionData={currentBlock} onAnswerSubmit={() => { }} isSubmitting={false} isInteractive={false} />
              </div>
            )}
            {currentBlock.type === "open_ended" && (
              <div className="text-center p-4 mt-4 text-white/70 bg-black/20 rounded-lg w-full max-w-md shadow">
                (Players are typing answers)
              </div>
            )}
          </div>
          {/* Spacer */}
          <div className="order-3 w-[100px] hidden md:block flex-shrink-0"></div>
        </div>
      </>
    );
  };

  // --- Main Return Structure ---
  return (
    <div className={hostViewClasses} style={finalBackgroundStyle}>
      {!hasFinalCustomBackground && <div className="stars-layer"></div>}
      {hasFinalCustomBackground && !selectedBackground?.background_color && (
        <div className="absolute inset-0 bg-black/40 z-0"></div>
      )}

      {/* Mute Button Example */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMute}
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
        onSettingsClick={onSettingsClick} // Pass down handler
        className="relative z-10"
      />
    </div>
  );
};

const HostView = memo(HostViewComponent);
export default HostView;