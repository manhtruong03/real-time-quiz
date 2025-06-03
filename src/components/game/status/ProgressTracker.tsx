import React from 'react';
import { cn } from '@/src/lib/utils'; // [cite: 575]
import { Badge } from '@/src/components/ui/badge'; // [cite: 543]

interface ProgressTrackerProps {
  current: number;
  total: number;
  className?: string;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ current, total, className }) => {
  if (total <= 0) return null;
  return (
    <Badge variant="secondary" className={cn("text-xs md:text-sm", className)}> {/* [cite: 544] */}
      Question {Math.min(current, total)} / {total}
    </Badge>
  );
};

export default ProgressTracker;