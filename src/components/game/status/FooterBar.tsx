import React from 'react';
import ProgressTracker from './ProgressTracker';
import { cn } from '@/src/lib/utils'; // [cite: 575]
import { Button } from '@/src/components/ui/button'; // [cite: 535]
import { SkipForward, Play } from 'lucide-react'; // [cite: 632]

interface FooterBarProps {
  currentQuestionIndex: number; // 0-based
  totalQuestions: number;
  gamePin?: string;
  accessUrl?: string;
  onSkip?: () => void;
  onNext?: () => void; // Could be for manually advancing after answer reveal
  className?: string;
}

const FooterBar: React.FC<FooterBarProps> = ({
  currentQuestionIndex,
  totalQuestions,
  gamePin,
  accessUrl,
  onSkip,
  onNext,
  className,
}) => {
  return (
    <footer className={cn(
      "bg-muted/80 dark:bg-muted/50 backdrop-blur-sm p-3 border-t border-border/50 w-full", // [cite: 606, 613, 607, 614]
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
          {onSkip && (
            <Button variant="outline" size="sm" onClick={onSkip} title="Skip Question"> {/* [cite: 536, 537] */}
              <SkipForward className="h-4 w-4" />
              <span className="sr-only md:not-sr-only md:ml-1">Skip</span>
            </Button>
          )}
          {/* Add Next button logic if needed */}
          {onNext && (
            <Button variant="default" size="sm" onClick={onNext} title="Next"> {/* [cite: 536, 537] */}
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