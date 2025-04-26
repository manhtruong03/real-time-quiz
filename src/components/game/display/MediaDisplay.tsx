// src/components/game/display/MediaDisplay.tsx
import React from 'react';
import Image from 'next/image';
// --- UPDATED Import ---
import { GameBlock } from '@/src/lib/types'; // Use GameBlock
import { cn } from '@/src/lib/utils';
import { Card, CardContent } from '@/src/components/ui/card';

interface MediaDisplayProps {
  // --- UPDATED Prop Type ---
  questionData: GameBlock | null; // Accept GameBlock or null
  // --- END UPDATE ---
  className?: string;
  priority?: boolean;
}

// Base URL for constructing Kahoot media URLs if only ID is provided
const KAHOOT_MEDIA_BASE_URL = "https://media.kahoot.it/";

const MediaDisplay: React.FC<MediaDisplayProps> = ({ questionData: currentBlock, className, priority = false }) => {

  // --- Handle null block ---
  if (!currentBlock) {
    return null;
  }
  // --- END Handle ---

  let mediaUrl: string | null = null;
  let altText = 'Question related media';
  let mediaType: 'image' | 'video' | 'gif' | null = null;
  let imageWidth: number | undefined = undefined;
  let imageHeight: number | undefined = undefined;

  // Prioritize image, then media array (looking for image/gif first, then background), then video
  // Check top-level image first (common case)
  if (currentBlock.image) {
    mediaUrl = currentBlock.image;
    mediaType = 'image'; // Assume it's an image unless media says otherwise
    altText = currentBlock.imageMetadata?.altText || 'Question image';
    imageWidth = currentBlock.imageMetadata?.width;
    imageHeight = currentBlock.imageMetadata?.height;
  }

  // Check media array if no top-level image found
  if (!mediaUrl && currentBlock.media && currentBlock.media.length > 0) {
    // Prioritize 'image' or 'giphy_gif' types with a URL
    const displayMedia = currentBlock.media.find(m => (m.type === 'image' || m.type === 'giphy_gif') && m.url);

    if (displayMedia?.url) {
      mediaUrl = displayMedia.url;
      mediaType = displayMedia.type === 'giphy_gif' ? 'gif' : 'image';
      altText = displayMedia.altText || altText;
      imageWidth = displayMedia.width;
      imageHeight = displayMedia.height;
    } else {
      // Fallback to background image within media array if no primary image/gif found
      const backgroundMedia = currentBlock.media.find(
        (m) => m.type === "background_image" && (m.id || m.url)
      );
      if (backgroundMedia) {
        const imageUrl = backgroundMedia.url || (backgroundMedia.id ? `${KAHOOT_MEDIA_BASE_URL}${backgroundMedia.id}` : null);
        if (imageUrl) {
          mediaUrl = imageUrl;
          mediaType = 'image'; // Treat background as image
          altText = backgroundMedia.altText || 'Background image';
          imageWidth = backgroundMedia.width;
          imageHeight = backgroundMedia.height;
        }
      }
    }
  }


  // Video fallback (only if absolutely no image/gif/background found)
  if (!mediaUrl && currentBlock.video?.fullUrl) {
    mediaUrl = currentBlock.video.fullUrl;
    mediaType = 'video';
    altText = 'Question video';
  }

  if (!mediaUrl) {
    return null; // No displayable media found
  }

  // Video Placeholder
  if (mediaType === 'video') {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-4 text-center">
          <p>Video Placeholder:</p>
          <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 break-all">{mediaUrl}</a>
          <p className="text-sm text-muted-foreground mt-2">
            (Video player integration needed)</p>
        </CardContent>
      </Card>
    );
  }

  // Image/GIF Display
  return (
    <div className={cn("w-full max-w-xl mx-auto my-4", className)}>
      <div className="relative bg-muted rounded-lg overflow-hidden shadow-md"> {/* Added shadow */}
        {mediaType === 'gif' ? (
          <img
            src={mediaUrl}
            alt={altText}
            className="block w-full h-auto"
            style={{ maxWidth: '100%' }}
            loading={priority ? "eager" : "lazy"} // Add loading attribute
          />
        ) : (
          (imageWidth && imageHeight) ? (
            <Image
              src={mediaUrl}
              alt={altText}
              width={imageWidth}
              height={imageHeight}
              layout="responsive"
              objectFit="contain"
              priority={priority}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px" // Example sizes
              onError={(e) => {
                console.error("Next/Image failed to load:", mediaUrl, e);
                (e.target as HTMLImageElement).style.display = 'none'; // Hide broken image
              }}
            />
          ) : (
            // Fallback using fill within a 16:9 aspect ratio container
            <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%' /* 16:9 */ }}>
              <Image
                src={mediaUrl}
                alt={altText}
                layout="fill"
                objectFit="contain"
                priority={priority}
                onError={(e) => {
                  console.error("Next/Image (fill) failed to load:", mediaUrl, e);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default MediaDisplay;