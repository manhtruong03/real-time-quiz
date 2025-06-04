import React, { memo } from 'react'; // Import memo
import Image from 'next/image';
import { GameBlock } from '@/src/lib/types';
import { cn } from '@/src/lib/utils';
import { Card, CardContent } from '@/src/components/ui/card';

interface MediaDisplayProps {
  questionData: GameBlock | null;
  className?: string;
  priority?: boolean;
}

const KAHOOT_MEDIA_BASE_URL = "https://media.kahoot.it/";

// Define the component logic
const MediaDisplayComponent: React.FC<MediaDisplayProps> = ({ questionData: currentBlock, className, priority = false }) => {
  // ... (existing component logic remains the same) ...

  if (!currentBlock) {
    return null;
  }

  let mediaUrl: string | null = null;
  let altText = 'Phương tiện liên quan đến câu hỏi'; // Việt hóa
  let mediaType: 'image' | 'video' | 'gif' | null = null;
  let imageWidth: number | undefined = undefined;
  let imageHeight: number | undefined = undefined;

  // Logic to determine mediaUrl, altText, mediaType, width, height (no changes here)
  if (currentBlock.image) {
    mediaUrl = currentBlock.image;
    mediaType = 'image';
    altText = currentBlock.imageMetadata?.altText || 'Hình ảnh câu hỏi'; // Việt hóa
    imageWidth = currentBlock.imageMetadata?.width;
    imageHeight = currentBlock.imageMetadata?.height;
  } else if (currentBlock.media && currentBlock.media.length > 0) {
    const displayMedia = currentBlock.media.find(m => (m.type === 'image' || m.type === 'giphy_gif') && m.url);
    if (displayMedia?.url) {
      mediaUrl = displayMedia.url;
      mediaType = displayMedia.type === 'giphy_gif' ? 'gif' : 'image';
      altText = displayMedia.altText || altText;
      imageWidth = displayMedia.width;
      imageHeight = displayMedia.height;
    } else {
      const backgroundMedia = currentBlock.media.find(m => m.type === "background_image" && (m.id || m.url));
      if (backgroundMedia) {
        const imageUrl = backgroundMedia.url || (backgroundMedia.id ? `${KAHOOT_MEDIA_BASE_URL}${backgroundMedia.id}` : null);
        if (imageUrl) {
          mediaUrl = imageUrl;
          mediaType = 'image';
          altText = backgroundMedia.altText || 'Hình ảnh nền'; // Việt hóa
          imageWidth = backgroundMedia.width;
          imageHeight = backgroundMedia.height;
        }
      }
    }
  } else if (currentBlock.video?.fullUrl) {
    mediaUrl = currentBlock.video.fullUrl;
    mediaType = 'video';
    altText = 'Video câu hỏi'; // Việt hóa
  }

  if (!mediaUrl) {
    return null;
  }

  if (mediaType === 'video') {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-4 text-center">
          <p>Video minh họa:</p>
          <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 break-all">{mediaUrl}</a>
          {/* <p className="text-sm text-muted-foreground mt-2">(Tính năng nhúng video đang được phát triển)</p> */}
        </CardContent>
      </Card>
    );
  }

  // Image/GIF Display
  return (
    <div className={cn("w-full max-w-xl mx-auto my-4", className)}>
      <div className="relative bg-muted rounded-lg overflow-hidden shadow-md">
        {mediaType === 'gif' ? (
          <img
            src={mediaUrl}
            alt={altText}
            className="block w-full h-auto"
            style={{ maxWidth: '100%' }}
            loading={priority ? "eager" : "lazy"}
          />
        ) : (
          (imageWidth && imageHeight) ? (
            <Image
              src={mediaUrl}
              alt={altText}
              width={imageWidth}
              height={imageHeight}
              layout="responsive" // Note: 'layout' is deprecated in favor of 'width'/'height' or 'fill' with styling
              objectFit="contain" // Note: 'objectFit' is deprecated in favor of CSS styling
              priority={priority}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
              onError={(e) => { console.error("Next/Image không thể tải:", mediaUrl, e); (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            // Consider adjusting this fallback if needed, using CSS aspect-ratio is often better
            <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%' }}>
              <Image
                src={mediaUrl}
                alt={altText}
                layout="fill" // Deprecated
                objectFit="contain" // Deprecated
                priority={priority}
                onError={(e) => { console.error("Next/Image (fill) không thể tải:", mediaUrl, e); (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
};

// Wrap the export with memo
const MediaDisplay = memo(MediaDisplayComponent);
export default MediaDisplay;