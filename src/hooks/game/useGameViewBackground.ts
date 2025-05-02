// src/hooks/game/useGameViewBackground.ts
import { useMemo } from "react";
import { GameBlock, Background } from "@/src/lib/types"; // Adjust path
import { useGameAssets } from "@/src/context/GameAssetsContext"; // Adjust path

// Base URL if constructing URLs from IDs
const KAHOOT_MEDIA_BASE_URL = "https://media.kahoot.it/";

interface UseGameViewBackgroundProps {
  selectedBackgroundId: string | null; // The ID selected by the host (or received by player)
  currentBlock: GameBlock | null; // The current question/content block
}

interface UseGameViewBackgroundReturn {
  style: React.CSSProperties; // The final style object to apply
  hasCustomBackground: boolean; // Whether a non-default background is active
}

export function useGameViewBackground({
  selectedBackgroundId,
  currentBlock,
}: UseGameViewBackgroundProps): UseGameViewBackgroundReturn {
  const {
    backgrounds,
    isLoading: assetsLoading,
    error: assetsError,
  } = useGameAssets();

  // Find the explicitly selected background object
  const selectedBackground = useMemo(() => {
    if (
      !selectedBackgroundId ||
      assetsLoading ||
      assetsError ||
      !backgrounds ||
      backgrounds.length === 0
    ) {
      return null;
    }
    return (
      backgrounds.find((bg) => bg.background_id === selectedBackgroundId) ||
      null
    );
  }, [selectedBackgroundId, backgrounds, assetsLoading, assetsError]);

  // Determine if the current block has its own background override in media
  const blockBackgroundMedia = useMemo(() => {
    if (
      !currentBlock ||
      !currentBlock.media ||
      currentBlock.media.length === 0
    ) {
      return null;
    }
    return (
      currentBlock.media.find(
        (m) => m.type === "background_image" && (m.id || m.url)
      ) || null
    ); // Find the first background_image media item
  }, [currentBlock]);

  // Determine the final style based on priority: block override > host selection
  const finalStyleData = useMemo(() => {
    let style: React.CSSProperties = {};
    let hasCustom = false;

    // Priority 1: Block-specific background
    if (blockBackgroundMedia) {
      const imageUrl =
        blockBackgroundMedia.url ||
        (blockBackgroundMedia.id
          ? `${KAHOOT_MEDIA_BASE_URL}${blockBackgroundMedia.id}`
          : null);
      if (imageUrl) {
        style = {
          backgroundImage: `url(${JSON.stringify(imageUrl)})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        };
        hasCustom = true;
        // console.log("[useGameViewBackground] Using block-specific background:", imageUrl);
      }
    }

    // Priority 2: Host selected background (only if block didn't override)
    if (!hasCustom && selectedBackground) {
      if (selectedBackground.background_file_path) {
        style = {
          backgroundImage: `url(${JSON.stringify(
            selectedBackground.background_file_path
          )})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        };
        hasCustom = true;
        // console.log("[useGameViewBackground] Using selected background image:", selectedBackground.background_file_path);
      } else if (selectedBackground.background_color) {
        style = { backgroundColor: selectedBackground.background_color };
        hasCustom = true;
        // console.log("[useGameViewBackground] Using selected background color:", selectedBackground.background_color);
      }
    }

    // console.log("[useGameViewBackground] Final Style:", style, "Has Custom:", hasCustom);
    return { style, hasCustomBackground: hasCustom };
  }, [selectedBackground, blockBackgroundMedia]); // Recalculate if selection or block changes

  return finalStyleData;
}
