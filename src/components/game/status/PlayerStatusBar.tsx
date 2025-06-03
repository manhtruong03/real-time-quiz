import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Badge } from '@/src/components/ui/badge';
import { Trophy } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useGameAssets } from '@/src/context/GameAssetsContext'; // Import the hook

interface PlayerStatusBarProps {
  playerName: string;
  playerAvatarUrl?: string;
  currentScore: number;
  rank?: number; // Optional rank display
  className?: string;
}

const PlayerStatusBar: React.FC<PlayerStatusBarProps> = ({
  playerName,
  playerAvatarUrl,
  currentScore,
  rank,
  className
}) => {
  const { avatars, isLoading: assetsLoading, error: assetsError } = useGameAssets(); // Use the context hook

  return (
    <footer className={cn(
      "bg-muted/80 dark:bg-muted/50 backdrop-blur-sm p-2 border-t border-border/50 w-full",
      className
    )}>
      <div className="container mx-auto flex items-center justify-between gap-3">
        {/* Player Info */}
        <div className="flex items-center gap-2 overflow-hidden">
          <Avatar className="h-8 w-8">
            <AvatarImage src={playerAvatarUrl} alt={`${playerName}'s avatar`} />
            <AvatarFallback>{playerName?.charAt(0).toUpperCase() || 'P'}</AvatarFallback> {/* [cite: 546] */}
          </Avatar>
          <span className="font-medium text-sm truncate">{playerName || 'Player'}</span>
        </div>

        {/* Score and Rank */}
        <div className="flex items-center gap-3">


          {rank !== undefined && (
            <Badge variant="outline" className="text-xs">Rank #{rank}</Badge>
          )}
          <Badge variant="default" className="text-xs md:text-sm gap-1"> {/* [cite: 544] */}
            <Trophy className="h-3 w-3" />
            {currentScore.toLocaleString('en-US')} pts
          </Badge>
        </div>
      </div>
    </footer>
  );
};

export default PlayerStatusBar;