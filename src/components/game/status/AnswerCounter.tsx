import React from 'react';
import { Users } from 'lucide-react'; // [cite: 632]
import { cn } from '@/src/lib/utils'; // [cite: 575]

interface AnswerCounterProps {
  count: number;
  totalPlayers?: number; // Optional: to show as X / Y
  className?: string;
}

const AnswerCounter: React.FC<AnswerCounterProps> = ({ count, totalPlayers, className }) => {
  return (
    <div className={cn("flex items-center gap-2 p-2 bg-card rounded-lg shadow text-center", className)}> {/* [cite: 604, 611] */}
      <Users className="h-5 w-5 text-muted-foreground" /> {/* [cite: 606, 613] */}
      <div className="text-lg font-bold">
        {count}
        {totalPlayers !== undefined && (
          <span className="text-sm text-muted-foreground"> / {totalPlayers}</span>
        )}
      </div>
      <span className="text-xs text-muted-foreground block">Câu trả lời</span> {/* [cite: 606, 613] */}
    </div>
  );
};

export default AnswerCounter;