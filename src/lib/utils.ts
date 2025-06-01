import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatMillisecondsToMinutes = (
  ms: number | undefined | null
): string | null => {
  if (ms === undefined || ms === null || ms <= 0) {
    return null;
  }
  const minutes = Math.floor(ms / 60000);
  if (minutes === 0) return "<1 phút"; // Less than 1 minute
  return `${minutes} phút`; // X minutes
};
