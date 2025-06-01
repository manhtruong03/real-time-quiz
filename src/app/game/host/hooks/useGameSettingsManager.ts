// src/app/game/host/hooks/useGameSettingsManager.ts
import { useState, useEffect, useCallback } from "react";
import type { Background, Sound } from "@/src/lib/types"; // Ensure these types are correctly imported

const APP_PREFIX = "/app";
const TOPIC_PREFIX = "/topic";

interface UseGameSettingsManagerProps {
  initialBackgrounds: Background[];
  initialSounds: Sound[];
  liveGamePin: string | null; // Game PIN from liveGameState or fetchedGamePin
  sendMessage: (destination: string, body: string) => void; // WebSocket sendMessage function
  isWsConnected: boolean; // WebSocket connection status
}

export function useGameSettingsManager({
  initialBackgrounds,
  initialSounds,
  liveGamePin,
  sendMessage,
  isWsConnected,
}: UseGameSettingsManagerProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<
    string | null
  >(null);
  const [selectedSoundId, setSelectedSoundId] = useState<string | null>(null);

  // Effect to set default background and sound when assets become available
  useEffect(() => {
    if (selectedBackgroundId === null && initialBackgrounds.length > 0) {
      const firstActiveBg = initialBackgrounds.find((bg) => bg.is_active);
      if (firstActiveBg) {
        setSelectedBackgroundId(firstActiveBg.background_id);
      }
    }
    if (selectedSoundId === null && initialSounds.length > 0) {
      const firstActiveLobbySound = initialSounds.find(
        (s) => s.sound_type === "LOBBY" && s.is_active
      );
      if (firstActiveLobbySound) {
        setSelectedSoundId(firstActiveLobbySound.sound_id);
      }
    }
  }, [
    initialBackgrounds,
    initialSounds,
    selectedBackgroundId,
    selectedSoundId,
  ]);

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const handleSoundSelect = useCallback((soundId: string) => {
    setSelectedSoundId(soundId);
    setIsSettingsOpen(false);
    // Note: Sending sound selection over WebSocket is not in the original page.tsx logic for handleSoundSelect
    // If it were, it would be added here, similar to handleBackgroundSelect.
  }, []);

  const handleBackgroundSelect = useCallback(
    (backgroundId: string) => {
      setSelectedBackgroundId(backgroundId);
      setIsSettingsOpen(false);
      if (liveGamePin && isWsConnected) {
        const contentPayload = { background: { id: backgroundId } };
        const contentString = JSON.stringify(contentPayload);
        // The original code sends this to a general topic, review if it should be APP_PREFIX for direct commands
        const wsMessageEnvelope = {
          channel: `${TOPIC_PREFIX}/player/${liveGamePin}`, // As per original page.tsx
          data: {
            gameid: liveGamePin,
            id: 35, // Message ID for background update
            type: "message",
            host: "VuiQuiz.com",
            content: contentString,
          },
          ext: { timetrack: Date.now() },
        };
        sendMessage(
          wsMessageEnvelope.channel,
          JSON.stringify([wsMessageEnvelope])
        );
      }
    },
    [liveGamePin, isWsConnected, sendMessage]
  );

  return {
    isSettingsOpen,
    setIsSettingsOpen, // Typically, actions like handleOpenSettings are preferred over exposing setter directly
    selectedBackgroundId,
    setSelectedBackgroundId, // Exposing for now, can be internalized if no external direct set is needed
    selectedSoundId,
    setSelectedSoundId, // Exposing for now
    handleOpenSettings,
    handleSoundSelect,
    handleBackgroundSelect,
  };
}
