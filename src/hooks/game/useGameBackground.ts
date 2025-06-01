// src/lib/hooks/useGameBackground.ts
import { useMemo } from "react";
// --- UPDATED Import ---
import type { GameBlock } from "@/src/lib/types"; // Use GameBlock
// --- END UPDATE ---

const KAHOOT_MEDIA_BASE_URL = "https://media.kahoot.it/";

/**
 * Custom hook to determine the background style for game views.
 * @param currentBlock - The current game block data. // Updated param name
 * @returns An object containing the background style and a boolean indicating if a custom background is applied.
 */
export function useGameBackground(currentBlock: GameBlock | null) {
  // Updated param name and type
  const backgroundData = useMemo(() => {
    // --- UPDATED Logic ---
    if (
      !currentBlock ||
      !currentBlock.media ||
      currentBlock.media.length === 0
    ) {
      return { style: {}, hasCustomBackground: false }; // Early exit if no block or media
    }

    const backgroundMedia = currentBlock.media.find(
      (m) => m.type === "background_image" && (m.id || m.url)
    );
    // --- END UPDATE ---

    if (backgroundMedia) {
      const imageUrl =
        backgroundMedia.url ||
        (backgroundMedia.id
          ? `${KAHOOT_MEDIA_BASE_URL}${backgroundMedia.id}`
          : null);
      if (imageUrl) {
        // Apply background image using CSS style properties
        return {
          style: {
            backgroundImage: `url(${JSON.stringify(imageUrl)})`, // Ensure URL is correctly formatted for CSS
            backgroundSize: "cover", // Cover the area
            backgroundPosition: "center center", // Center the image
            backgroundRepeat: "no-repeat", // Prevent repeating
          },
          hasCustomBackground: true,
        };
      }
    }
    return { style: {}, hasCustomBackground: false };
  }, [currentBlock]); // Depend on currentBlock

  return backgroundData;
}
