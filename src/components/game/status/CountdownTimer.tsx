// src/components/game/status/CountdownTimer.tsx
'use client';

import React, { useState, useEffect, memo } from 'react';
import { cn } from '@/src/lib/utils';

interface CountdownTimerProps {
  initialTime: number;
  timeKey: string | number;
  onTimeUp?: () => void;
  className?: string;
}

const CountdownTimerComponent: React.FC<CountdownTimerProps> = ({
  initialTime,
  timeKey,
  onTimeUp,
  className
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isVisible, setIsVisible] = useState(false);
  const [hasTimeUpOccurred, setHasTimeUpOccurred] = useState(false); // *** NEW: State to track if time is up ***

  useEffect(() => {
    // Reset timer and visibility when the key changes (new question)
    setTimeLeft(initialTime);
    setIsVisible(true);
    setHasTimeUpOccurred(false); // *** Reset time up flag ***

    if (initialTime <= 0) return; // No timer if initial time is 0 or less

    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 100) { // Allow a small buffer
          clearInterval(interval);
          // *** Instead of calling onTimeUp directly, set the flag ***
          if (!hasTimeUpOccurred) { // Prevent setting multiple times
            setHasTimeUpOccurred(true);
          }
          return 0;
        }
        return prevTime - 100; // Decrement by 100ms
      });
    }, 100); // Update every 100ms

    return () => {
      clearInterval(interval);
      setIsVisible(false); // Hide briefly on cleanup before next question
    };
    // *** Add hasTimeUpOccurred to dependency array to avoid stale closure issues ***
  }, [timeKey, initialTime, hasTimeUpOccurred]);

  // *** NEW useEffect: Call onTimeUp when hasTimeUpOccurred becomes true ***
  useEffect(() => {
    if (hasTimeUpOccurred && onTimeUp) {
      console.log("CountdownTimer: Time up occurred, calling onTimeUp callback.");
      onTimeUp();
    }
    // Only run when hasTimeUpOccurred changes or onTimeUp function reference changes
  }, [hasTimeUpOccurred, onTimeUp]);


  if (!isVisible || initialTime <= 0) {
    return null; // Don't render if not visible or no time limit
  }

  const seconds = Math.max(0, Math.ceil(timeLeft / 1000));
  const percentage = Math.max(0, (timeLeft / initialTime) * 100);

  return (
    <div className={cn("flex flex-col items-center p-2 bg-card rounded-lg shadow", className)}>
      <div className="text-2xl font-bold mb-1">{seconds}</div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-100 ease-linear"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
// Wrap the component export with React.memo
const CountdownTimer = memo(CountdownTimerComponent);

export default CountdownTimer; //