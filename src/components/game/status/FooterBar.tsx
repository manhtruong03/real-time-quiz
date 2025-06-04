import React from 'react';
import ProgressTracker from './ProgressTracker';
import { cn } from '@/src/lib/utils';
import { SkipForward, Play, Settings, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/src/components/ui/tooltip'; // Import Tooltip components

interface FooterBarProps {
  currentQuestionIndex: number; // 0-based
  totalQuestions: number;
  gamePin?: string;
  accessUrl?: string;
  onSkip?: () => void;
  onNext?: () => void; // Could be for manually advancing after answer reveal
  onSettingsClick?: () => void; // Add callback for settings
  isMuted?: boolean;
  onToggleMute?: () => void;
  className?: string;
}

const FooterBar: React.FC<FooterBarProps> = ({
  currentQuestionIndex,
  totalQuestions,
  gamePin,
  accessUrl,
  onSkip,
  onNext,
  onSettingsClick, // Destructure new prop
  isMuted,
  onToggleMute,
  className,
}) => {
  const showMuteButton = typeof onToggleMute === 'function'; // Check if handler is provided
  return (
    <footer className={cn(
      "bg-muted/80 dark:bg-muted/50 backdrop-blur-sm p-3 border-t border-border/50 w-full",
      className
    )}>
      <div className="container mx-auto flex items-center justify-between gap-4">
        {/* Left Side: Progress */}
        <div className="flex-shrink-0">
          <ProgressTracker current={currentQuestionIndex + 1} total={totalQuestions} />
        </div>

        {/* Center: Game Info */}
        <div className="flex-grow text-center text-sm text-muted-foreground"> {/* [cite: 606, 613] */}
          {gamePin && <span>Game PIN: <strong className="text-foreground">{gamePin}</strong></span>} {/* [cite: 601, 611] */}
          {accessUrl && gamePin && <span className="mx-2">|</span>}
          {accessUrl && <span>Tham gia tại: <strong className="text-foreground">{accessUrl}</strong></span>} {/* [cite: 601, 611] */}
        </div>

        {/* Right Side: Host Controls (Optional) */}
        <div className="flex-shrink-0 flex items-center gap-1"> {/* Wrap in TooltipProvider */}
          <TooltipProvider delayDuration={100}>
            {/* Mute/Unmute Button (Conditional) */}
            {showMuteButton && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onToggleMute} aria-label={isMuted ? "Bỏ tắt tiếng" : "Tắt tiếng"} className="h-8 w-8">
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{isMuted ? "Bỏ tắt tiếng" : "Tắt tiếng"}</p></TooltipContent>
              </Tooltip>
            )}

            {/* Settings Button */}
            {onSettingsClick && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onSettingsClick} title="Game Settings" className="h-8 w-8">
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">Cài đặt</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Cài đặt</p></TooltipContent>
              </Tooltip>
            )}

            {/* Skip Button */}
            {onSkip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={onSkip} title="Skip Question" className="h-8 w-8">
                    <SkipForward className="h-4 w-4" />
                    <span className="sr-only">Bỏ qua</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Bỏ qua câu hỏi</p></TooltipContent>
              </Tooltip>
            )}

            {/* Next Button */}
            {onNext && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" size="icon" onClick={onNext} title="Next" className="h-8 w-8">
                    <Play className="h-4 w-4" />
                    <span className="sr-only">Tiếp theo</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Tiếp theo</p></TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </div>
    </footer>
  );
};

export default FooterBar;