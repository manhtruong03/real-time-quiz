/* eslint-disable prettier/prettier */
// Path: src/components/game/status/CountdownTimer.tsx
'use client';

import React, { useState, useEffect, useRef, memo } from 'react'; // Import useRef
import { cn } from '@/src/lib/utils';

interface CountdownTimerProps {
  initialTime: number; // Total time available in ms
  timeKey: string | number; // Key to reset the timer (e.g., question index)
  onTimeUp?: () => void;
  className?: string;
}

const CountdownTimerComponent: React.FC<CountdownTimerProps> = ({
  initialTime,
  timeKey,
  onTimeUp,
  className
}) => {
  // State to display remaining time (updated frequently for UI)
  const [displayTimeLeft, setDisplayTimeLeft] = useState(initialTime);
  // Ref to store the actual start timestamp of the timer for the current timeKey
  const startTimeRef = useRef<number | null>(null);
  // Ref to store the interval ID for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // Ref to track if onTimeUp has been called for the current timeKey
  const timeUpCalledRef = useRef<boolean>(false);

  useEffect(() => {
    // --- Timer Initialization ---
    if (initialTime <= 0) {
      setDisplayTimeLeft(0); // If no time, display 0
      if (intervalRef.current) clearInterval(intervalRef.current); // Clear any existing interval
      return; // Exit if the question is not timed
    }

    console.log(`[CountdownTimer] Initializing for key: ${timeKey}, initialTime: ${initialTime}`);
    // Record the start time for this timer instance
    startTimeRef.current = Date.now();
    // Reset the display time and the time-up flag for the new question/key
    setDisplayTimeLeft(initialTime);
    timeUpCalledRef.current = false;

    // Clear any previous interval before starting a new one
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // --- Interval for Updating Display and Checking Time Up ---
    intervalRef.current = setInterval(() => {
      if (!startTimeRef.current) return; // Safety check

      const currentTime = Date.now();
      const elapsedTime = currentTime - startTimeRef.current;
      const actualTimeLeft = Math.max(0, initialTime - elapsedTime); // Calculate true remaining time

      // Update the display state
      setDisplayTimeLeft(actualTimeLeft);

      // Check if time is up
      if (actualTimeLeft <= 0 && !timeUpCalledRef.current) {
        console.log(`[CountdownTimer] Time's up for key: ${timeKey}`);
        timeUpCalledRef.current = true; // Mark as called
        if (intervalRef.current) clearInterval(intervalRef.current); // Stop the interval
        if (onTimeUp) {
          console.log(`[CountdownTimer] Calling onTimeUp callback.`);
          onTimeUp(); // Call the callback
        }
      }
    }, 100); // Update display roughly every 100ms

    // --- Cleanup Function ---
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        // console.log(`[CountdownTimer] Cleared interval for key: ${timeKey}`);
      }
      startTimeRef.current = null; // Clear start time on cleanup/key change
    };
    // Dependency: Run effect when the key or initialTime changes
  }, [timeKey, initialTime, onTimeUp]);

  // --- Render Logic ---
  if (initialTime <= 0) {
    return null; // Don't render timer if question has no time limit
  }

  const seconds = Math.max(0, Math.ceil(displayTimeLeft / 1000));
  const percentage = initialTime > 0 ? Math.max(0, (displayTimeLeft / initialTime) * 100) : 0;

  return (
    <div className={cn("flex flex-col items-center p-2 bg-card rounded-lg shadow", className)}>
      {/* Display calculated seconds */}
      <div className="text-2xl font-bold mb-1 tabular-nums">{seconds}</div>
      {/* Progress bar based on display time */}
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

export default CountdownTimer;