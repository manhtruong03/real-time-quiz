import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, differenceInMinutes, isValid, fromUnixTime } from "date-fns";
import { vi } from "date-fns/locale"; // For Vietnamese locale

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

/**
 * Formats an epoch millisecond timestamp into a human-readable date and time string.
 * Example: "10:15 21 tháng 05, 2025"
 * @param epochMs - The timestamp in epoch milliseconds.
 */
export function formatSessionDateTime(
  epochMs: number | undefined | null
): string {
  if (epochMs === undefined || epochMs === null) return "N/A";
  // fromUnixTime expects seconds, so convert milliseconds to seconds
  const date = fromUnixTime(epochMs / 1000);
  if (!isValid(date)) return "Ngày không hợp lệ";
  // Using MM for month number, yyyy for year to match common usage.
  // The example "21 tháng 5, 2025" uses single M if no leading zero. date-fns handles this with 'M'.
  return format(date, "HH:mm dd 'tháng' M, yyyy", { locale: vi });
}

/**
 * Calculates the duration in minutes between two epoch millisecond timestamps.
 * @param startTimeEpochMs - The start timestamp in epoch milliseconds.
 * @param endTimeEpochMs - The end timestamp in epoch milliseconds.
 */
export function calculateDuration(
  startTimeEpochMs: number | undefined | null,
  endTimeEpochMs: number | undefined | null
): string {
  if (startTimeEpochMs === undefined || startTimeEpochMs === null) return "N/A";

  const startDate = fromUnixTime(startTimeEpochMs / 1000);
  if (!isValid(startDate)) return "N/A (Start time invalid)";

  if (endTimeEpochMs === undefined || endTimeEpochMs === null) {
    // If report is for a completed session, endTime should ideally be present.
    // If truly ongoing, might display "Đang diễn ra" or calculate from now.
    // For a static report of a past session, "N/A" or "Chưa kết thúc" might be appropriate if endTime is missing.
    // The visual reference HTML shows "20 phút", which could be a configured quiz duration.
    // The SessionSummaryDto does not provide configured duration.
    // Let's return "Chưa kết thúc" if endTime is missing for this report context.
    return "Chưa kết thúc";
  }

  const endDate = fromUnixTime(endTimeEpochMs / 1000);
  if (!isValid(endDate)) return "N/A (End time invalid)";

  const diffMins = differenceInMinutes(endDate, startDate);

  if (diffMins < 0) return "N/A (Thời gian lỗi)";
  if (diffMins === 0) return "< 1 phút"; // Or "0 phút" if preferred
  return `${diffMins} phút`;
}
