// src/hooks/game/useHostAudioManager.ts
import { useState, useEffect, useRef, useCallback } from "react";
import { useGameAssets } from "@/src/context/GameAssetsContext";

interface UseHostAudioManagerProps {
  selectedSoundId: string | null; // ID of the sound to play
}

interface UseHostAudioManagerReturn {
  isMuted: boolean;
  toggleMute: () => void;
  // Optional: Could return playback status if needed by UI
  // isPlaying: boolean;
  // error: string | null;
}

export function useHostAudioManager({
  selectedSoundId,
}: UseHostAudioManagerProps): UseHostAudioManagerReturn {
  const {
    sounds,
    isLoading: assetsLoading,
    error: assetsError,
  } = useGameAssets();
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  // Track if audio *should* be playing based on selection and not being muted
  const [audioShouldBePlaying, setAudioShouldBePlaying] = useState(false);
  // Optional: track actual playback state
  // const [isPlaying, setIsPlaying] = useState(false);
  // const [audioError, setAudioError] = useState<string | null>(null);

  const isChangingSourceRef = useRef(false); // Ref to track source change

  // Effect 1: Create/Update Audio Element and Source based on selectedSoundId
  useEffect(() => {
    // Don't process if assets are loading/errored or no sounds available
    if (assetsLoading || assetsError || sounds.length === 0) {
      setAudioShouldBePlaying(false); // Ensure it stops if assets become unavailable
      return;
    }

    // Find the specific active lobby sound to play
    const lobbySounds = sounds.filter(
      (s) => s.sound_type === "LOBBY" && s.is_active
    );
    if (lobbySounds.length === 0) {
      setAudioShouldBePlaying(false); // No lobby sounds available
      return;
    }

    // Use selected ID or fallback to the first active lobby sound
    const soundIdToUse = selectedSoundId ?? lobbySounds[0]?.sound_id;
    const soundToPlay = lobbySounds.find((s) => s.sound_id === soundIdToUse);

    if (!soundToPlay) {
      console.warn(
        `[AudioManager] Sound not found for ID: ${soundIdToUse}. Stopping playback.`
      );
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setAudioShouldBePlaying(false);
      // setAudioError(`Sound not found: ${soundIdToUse}`);
      return;
    }

    const currentAudio = audioPlayerRef.current;
    const needsNewUrl =
      !currentAudio || currentAudio.src !== soundToPlay.file_path;

    if (!currentAudio) {
      // Create new audio element
      console.log(
        "[AudioManager] Creating audio element for:",
        soundToPlay.name
      );
      const newAudio = new Audio(soundToPlay.file_path);
      newAudio.loop = true;
      newAudio.volume = 0.5; // Initial volume before mute check
      audioPlayerRef.current = newAudio;
      setAudioShouldBePlaying(true); // Indicate intent to play
      // setAudioError(null);
      isChangingSourceRef.current = false; // Not changing source initially
    } else if (needsNewUrl) {
      console.log(`[AudioManager] Changing track to: ${soundToPlay.name}`);
      isChangingSourceRef.current = true; // Mark that we are changing source
      currentAudio.pause(); // Pause before changing
      setAudioShouldBePlaying(false); // Temporarily set intent to false while loading
      currentAudio.src = soundToPlay.file_path;
      currentAudio.load();
      currentAudio.loop = true;

      // Event listener for when the new source is ready to play
      const handleCanPlay = () => {
        console.log(
          "[AudioManager] New source ready (canplay). Setting intent to play."
        );
        setAudioShouldBePlaying(true); // Now set the intent to play the new track
        isChangingSourceRef.current = false; // Done changing source
        currentAudio.removeEventListener("canplay", handleCanPlay); // Clean up listener
        currentAudio.removeEventListener("error", handleError); // Clean up listener
      };
      const handleError = (e: Event | string) => {
        console.error("[AudioManager] Error loading new audio source:", e);
        isChangingSourceRef.current = false;
        setAudioShouldBePlaying(false); // Failed to load, don't intend to play
        currentAudio.removeEventListener("canplay", handleCanPlay);
        currentAudio.removeEventListener("error", handleError);
      };
      currentAudio.addEventListener("canplay", handleCanPlay);
      currentAudio.addEventListener("error", handleError);
    } else if (!audioShouldBePlaying && !isChangingSourceRef.current) {
      // If source is the same, but intent was false (e.g., stopped previously), set intent to true
      console.log("[AudioManager] Source is same, setting intent to play.");
      setAudioShouldBePlaying(true);
    }

    // Only run when assets or selectedSoundId changes
  }, [assetsLoading, assetsError, sounds, selectedSoundId]);

  // Effect 2: Handle Play/Pause/Volume based on state (intent and mute)
  useEffect(() => {
    const audio = audioPlayerRef.current;
    if (!audio || isChangingSourceRef.current) {
      // Don't try to play while changing source
      // console.log("[AudioManager] Effect 2 skipped: No audio or changing source.");
      return;
    }

    audio.volume = isMuted ? 0 : 0.5; // Apply mute state immediately

    if (audioShouldBePlaying && !isMuted) {
      if (audio.paused) {
        console.log(
          "[AudioManager] Attempting to play (Effect 2)... Source:",
          audio.src
        );
        audio.play().catch((error) => {
          console.warn(
            "[AudioManager] Playback failed (likely needs interaction):",
            error
          );
          // Playback failed, reset intent? Or keep true hoping user clicks unmute?
          // Keeping true for now, toggleMute will retry play.
          // setAudioError(`Playback failed: ${error.message}`);
          // setIsPlaying(false);
        });
        // .then(() => setIsPlaying(true)); // Set playing state on successful play
      }
    } else {
      if (!audio.paused) {
        console.log("[AudioManager] Pausing (Effect 2)...");
        audio.pause();
        // setIsPlaying(false);
      }
    }
  }, [audioShouldBePlaying, isMuted]); // React only to intent and mute state

  // Effect 3: Cleanup on unmount
  useEffect(() => {
    const audio = audioPlayerRef.current; // Capture current ref for cleanup function
    return () => {
      if (audio) {
        console.log("[AudioManager] Pausing audio and cleaning up on unmount");
        audio.pause();
        audio.removeAttribute("src"); // Release resource
        audio.load(); // Abort loading if any
      }
      audioPlayerRef.current = null; // Clear the ref
    };
  }, []); // Empty array ensures this runs only on unmount

  // Toggle Mute Function
  const toggleMute = useCallback(() => {
    const audio = audioPlayerRef.current;
    if (!audio) return;

    const wasMuted = isMuted; // Get state before update
    setIsMuted((prevMuted) => !prevMuted); // Update state

    // If unmuting, explicitly try to play again ONLY if it should be playing and was paused
    if (wasMuted && audio.paused && audioShouldBePlaying) {
      console.log("[AudioManager] Attempting to play on unmute...");
      audio.play().catch((error) => {
        console.warn("[AudioManager] Playback failed on unmute:", error);
        // setAudioError(`Playback failed: ${error.message}`);
        // setIsPlaying(false);
      });
      // .then(() => setIsPlaying(true));
    }
    console.log("[AudioManager] Toggled mute state.");
  }, [isMuted, audioShouldBePlaying]); // Dependencies for the toggle function

  return {
    isMuted,
    toggleMute,
    // isPlaying, // Expose if needed
    // error: audioError // Expose if needed
  };
}
