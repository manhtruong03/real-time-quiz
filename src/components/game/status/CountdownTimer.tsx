'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils'; // [cite: 575]

interface CountdownTimerProps {
  initialTime: number; // Time in milliseconds
  timeKey: string | number; // Key to force reset timer on new question
  onTimeUp?: () => void;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  initialTime,
  timeKey,
  onTimeUp,
  className
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Reset timer when the key changes (new question)
    setTimeLeft(initialTime);
    setIsVisible(true); // Make visible on new question

    if (initialTime <= 0) return; // No timer if initial time is 0 or less

    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 100) { // Allow a small buffer
          clearInterval(interval);
          if (onTimeUp) {
            onTimeUp();
          }
          return 0;
        }
        return prevTime - 100; // Decrement by 100ms for smoother updates
      });
    }, 100); // Update every 100ms

    return () => {
      clearInterval(interval);
      setIsVisible(false); // Hide briefly on cleanup before next question
    };
  }, [timeKey, initialTime, onTimeUp]);

  if (!isVisible || initialTime <= 0) {
    return null; // Don't render if not visible or no time limit
  }

  const seconds = Math.max(0, Math.ceil(timeLeft / 1000));
  const percentage = Math.max(0, (timeLeft / initialTime) * 100);

  // Simple visual timer (e.g., a shrinking bar or just text)
  return (
    <div className={cn("flex flex-col items-center p-2 bg-card rounded-lg shadow", className)}> {/* [cite: 604, 611] */}
      <div className="text-2xl font-bold mb-1">{seconds}</div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden"> {/* [cite: 606, 613] */}
        <div
          className="h-full bg-primary transition-all duration-100 ease-linear" // [cite: 605, 612]
          style={{ width: `${percentage}%` }}
        />
      </div>
      {/* Alternative: Circle Timer (requires more complex SVG/CSS)
       <svg width="60" height="60" viewBox="0 0 36 36" className="block mx-auto">
         <path
           d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
           fill="none"
           stroke="#eee"
           strokeWidth="3"
         />
         <path
           d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
           fill="none"
           stroke="#4caf50" // Color for timer progress
           strokeWidth="3"
           strokeDasharray={`${percentage}, 100`}
           strokeLinecap="round"
           transform="rotate(-90 18 18)"
         />
         <text x="18" y="21" textAnchor="middle" fontSize="10px" fill="#333">{seconds}</text>
       </svg>
       */}
    </div>
  );
};

export default CountdownTimer;