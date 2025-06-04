// src/components/game/inputs/AnswerButton.tsx
import React, { memo } from "react";
import Image from "next/image";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
// Assuming AnswerOptionStats is correctly typed or imported via '@/src/lib/types'
import {
  QuizChoicePlayer,
  SurveyChoicePlayer,
  AnswerOptionStats,
} from "@/src/lib/types";
import {
  Triangle,
  Diamond,
  Circle,
  Square,
  CheckCircle,
  XCircle,
} from "lucide-react";

// --- Interface Definitions --- (Unchanged)
type AnswerChoicePlayer = QuizChoicePlayer | SurveyChoicePlayer;
interface AnswerButtonProps {
  choice: AnswerChoicePlayer;
  index: number;
  onClick: (index: number) => void;
  isDisabled: boolean; // Still controls the HTML disabled attribute
  viewMode?: "interactive" | "showingResults";
  isCorrectOption?: boolean | null;
  stats?: AnswerOptionStats | null;
}

// --- Mappings & Constants (Unchanged) ---
const playerButtonMapping = [
  { Icon: Triangle, colorClasses: 'bg-red-500 hover:bg-red-600 border-red-700', iconColor: 'text-red-200' },
  { Icon: Diamond, colorClasses: 'bg-blue-500 hover:bg-blue-600 border-blue-700', iconColor: 'text-blue-200' },
  { Icon: Circle, colorClasses: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-700', iconColor: 'text-yellow-200' },
  { Icon: Square, colorClasses: 'bg-green-500 hover:bg-green-600 border-green-700', iconColor: 'text-green-200' },
];
const KHOOT_MEDIA_BASE_URL = "https://media.kahoot.it/";

// --- Type Guard (Unchanged) ---
const isImageChoice = (
  choice: AnswerChoicePlayer
): choice is QuizChoicePlayer & {
  image: NonNullable<QuizChoicePlayer["image"]>;
} => {
  return typeof choice === 'object' && choice !== null && 'image' in choice && !!choice.image;
};

// --- Component Implementation ---
const AnswerButtonComponent: React.FC<AnswerButtonProps> = ({
  choice,
  index,
  onClick,
  isDisabled,
  viewMode = "interactive",
  isCorrectOption = null,
  stats = null,
}) => {
  // --- Determine Button Style & Icon (Unchanged) ---
  const { Icon, colorClasses, iconColor } =
    playerButtonMapping[index % playerButtonMapping.length] ||
    playerButtonMapping[0];

  // --- Determine Image URL (Unchanged) ---
  let imageUrl: string | undefined = undefined;
  let imageAlt: string | undefined = "Lựa chọn với hình ảnh";
  if (isImageChoice(choice)) {
    if (choice.image?.url) imageUrl = choice.image.url;
    else if (choice.image?.id) imageUrl = `${KHOOT_MEDIA_BASE_URL}${choice.image.id}`;
    imageAlt = choice.image?.altText || `Lựa chọn ${index + 1}`;
  }

  // --- Determine Component State ---
  const isShowingResults = viewMode === "showingResults";
  // Button is functionally disabled if isDisabled is true OR if showing results
  const isButtonDisabled = isDisabled || isShowingResults;
  // Click handler only active if button is not functionally disabled
  const handleClick = !isButtonDisabled ? () => onClick(index) : undefined;
  const CorrectnessIcon =
    isCorrectOption === true
      ? CheckCircle
      : isCorrectOption === false
        ? XCircle
        : null;

  // --- Determine if default disabled opacity should be overridden ---
  // Override (keep bright) if:
  // 1. It's the host viewing the question (interactive mode but disabled)
  // 2. It's the results view AND this is the correct option
  const shouldOverrideDisabledOpacity =
    (viewMode === "interactive" && isDisabled) || // Host view during question
    (isShowingResults && isCorrectOption === true); // Correct answer during results

  return (
    <Button
      variant="default"
      className={cn(
        // Base styles
        "relative flex flex-col md:flex-row items-center justify-start text-left w-full h-auto min-h-[60px] md:min-h-[80px] p-3 md:p-4 border-b-4 shadow-md text-white font-bold text-base md:text-xl whitespace-normal break-words duration-300",
        // Color
        colorClasses,
        // Interaction effects (Only when clickable)
        handleClick
          ? "hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          : "cursor-default",

        // --- Refined Opacity Logic ---
        // 1. Apply specific dimming for incorrect answers during results
        isShowingResults &&
        isCorrectOption === false &&
        "opacity-50 brightness-75",
        // 2. If functionally disabled, decide whether to APPLY default dimming or OVERRIDE it
        isButtonDisabled && !shouldOverrideDisabledOpacity && "opacity-60", // Apply slight dim for player submitted state (optional)
        isButtonDisabled &&
        shouldOverrideDisabledOpacity &&
        "disabled:opacity-100", // Explicitly override default dimming

        // Layout adjustment for image choices
        isImageChoice(choice) && "justify-center",
        // Focus visibility
        "focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800"
      )}
      onClick={handleClick}
      disabled={isButtonDisabled} // Use calculated functional disabled state
      aria-label={isImageChoice(choice) ? imageAlt : choice.answer}
      role={isShowingResults ? "status" : "button"}
    >
      {/* --- Button Content --- */}
      {/* Shape Icon */}
      <div
        className={cn(
          "flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 mb-2 md:mb-0 md:mr-3 rounded",
          isImageChoice(choice)
            ? "absolute top-2 left-2 z-10 p-1 bg-black/30"
            : "bg-white/20"
        )}
      >
        <Icon className={cn("h-4 w-4 md:h-5 md:w-5", iconColor)} />
      </div>
      {/* Content Area */}
      <div
        className={cn(
          "flex-grow",
          isImageChoice(choice) ? "w-full h-full" : ""
        )}
      >
        {isImageChoice(choice) && imageUrl ? (
          <div className="relative w-full h-full min-h-[80px] md:min-h-[100px]">
            <Image
              src={imageUrl}
              alt={imageAlt || ""}
              fill
              className="object-contain rounded"
              sizes="(max-width: 640px) 80vw, (max-width: 768px) 40vw, 20vw"
              priority={true}
              onError={(e) => {
                (e.target as HTMLImageElement).style.opacity = "0";
              }}
            />
          </div>
        ) : (
          <span className="block">{choice.answer}</span>
        )}
      </div>
      {/* Stats and Correctness Icon Display */}
      {isShowingResults && (
        <div
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 pl-2 md:pl-4 z-10",
            "bg-black/40 backdrop-blur-sm p-1 md:p-1.5 rounded"
          )}
        >
          {CorrectnessIcon && (
            <CorrectnessIcon
              className={cn(
                "h-5 w-5 md:h-6 md:w-6 flex-shrink-0",
                isCorrectOption ? "text-green-300" : "text-red-400"
              )}
              aria-label={isCorrectOption ? "Đúng" : "Sai"}
            />
          )}
          {stats && (
            <div className="flex flex-col items-end text-right leading-tight">
              <span className="text-sm md:text-base font-semibold text-white">
                {stats.percentage.toFixed(0)}%
              </span>
              <span className="text-xs md:text-sm font-normal text-white/80">
                {stats.count}
              </span>
            </div>
          )}
        </div>
      )}
      {/* --- End Button Content --- */}
    </Button>
  );
};

const AnswerButton = memo(AnswerButtonComponent);
export default AnswerButton;