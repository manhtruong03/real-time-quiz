import React from 'react';
import ProgressTracker from './ProgressTracker';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { SkipForward, Play, Settings } from 'lucide-react'; // Add Settings

interface FooterBarProps {
  currentQuestionIndex: number; // 0-based
  totalQuestions: number;
  gamePin?: string;
  accessUrl?: string;
  onSkip?: () => void;
  onNext?: () => void; // Could be for manually advancing after answer reveal
  onSettingsClick?: () => void; // Add callback for settings
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
  className,
}) => {
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
          {accessUrl && <span>Join at: <strong className="text-foreground">{accessUrl}</strong></span>} {/* [cite: 601, 611] */}
        </div>

        {/* Right Side: Host Controls (Optional) */}
        <div className="flex-shrink-0 flex gap-2">
          {onSettingsClick && (
            <Button variant="outline" size="icon" onClick={onSettingsClick} title="Game Settings" className="h-9 w-9 md:h-8 md:w-8">
              {/* Adjusted size */}
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Button>
          )}
          {onSkip && (
            <Button variant="outline" size="sm" onClick={onSkip} title="Skip Question" className="h-9 md:h-8 px-2"> {/* Adjusted size */}
              <SkipForward className="h-4 w-4" />
              <span className="sr-only md:not-sr-only md:ml-1">Skip</span>
            </Button>
          )}
          {/* Add Next button logic if needed */}
          {onNext && (
            <Button variant="default" size="sm" onClick={onNext} title="Next" className="h-9 md:h-8 px-2"> {/* Adjusted size */}
              <Play className="h-4 w-4" />
              <span className="sr-only md:not-sr-only md:ml-1">Next</span>
            </Button>
          )}
        </div>
      </div>
    </footer>
  );
};

export default FooterBar;