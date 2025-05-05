// src/components/game/inputs/AnswerButton.tsx
import React, { memo } from 'react';
import Image from 'next/image';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { QuizChoicePlayer, SurveyChoicePlayer } from '@/src/lib/types';
import { Triangle, Diamond, Circle, Square, CheckCircle, XCircle } from 'lucide-react';

// --- Interface Definitions ---
// Type combining possible choice structures received by the player
type AnswerChoicePlayer = QuizChoicePlayer | SurveyChoicePlayer;

// Structure for displaying statistics alongside the answer
interface AnswerOptionStats {
  count: number;
  percentage: number;
}

// Props for the AnswerButton component
interface AnswerButtonProps {
  /** The choice data (text or image). */
  choice: AnswerChoicePlayer;
  /** The index of this choice (0-3) used for mapping colors/icons. */
  index: number;
  /** Callback function when the button is clicked in interactive mode. */
  onClick: (index: number) => void;
  /** General disabled state (e.g., when player is submitting). */
  isDisabled: boolean;
  /** Determines the rendering mode: 'interactive' for player input, 'showingResults' for host display. Defaults to 'interactive'. */
  viewMode?: 'interactive' | 'showingResults';
  /** Indicates if this option is the correct one in 'showingResults' mode. Null if correctness is not applicable (e.g., survey). */
  isCorrectOption?: boolean | null;
  /** Statistics (count & percentage) for this option, displayed in 'showingResults' mode. */
  stats?: AnswerOptionStats | null;
}

// --- Mappings & Constants ---
const playerButtonMapping = [
  { Icon: Triangle, colorClasses: 'bg-red-500 hover:bg-red-600 border-red-700', iconColor: 'text-red-200' },
  { Icon: Diamond, colorClasses: 'bg-blue-500 hover:bg-blue-600 border-blue-700', iconColor: 'text-blue-200' },
  { Icon: Circle, colorClasses: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-700', iconColor: 'text-yellow-200' },
  { Icon: Square, colorClasses: 'bg-green-500 hover:bg-green-600 border-green-700', iconColor: 'text-green-200' },
];
const KHOOT_MEDIA_BASE_URL = "https://media.kahoot.it/";

// --- Type Guard for Image Choices ---
const isImageChoice = (choice: AnswerChoicePlayer): choice is QuizChoicePlayer & { image: NonNullable<QuizChoicePlayer['image']> } => {
  return typeof choice === 'object' && choice !== null && 'image' in choice && !!choice.image;
};

// --- Component Implementation ---
const AnswerButtonComponent: React.FC<AnswerButtonProps> = ({
  choice,
  index,
  onClick,
  isDisabled,
  viewMode = 'interactive',
  isCorrectOption = null,
  stats = null,
}) => {
  // --- Determine Button Style & Icon ---
  const { Icon, colorClasses, iconColor } = playerButtonMapping[index % playerButtonMapping.length] || playerButtonMapping[0];

  // --- Determine Image URL ---
  let imageUrl: string | undefined = undefined;
  let imageAlt: string | undefined = 'Answer option image';
  if (isImageChoice(choice)) {
    if (choice.image?.url) imageUrl = choice.image.url;
    else if (choice.image?.id) imageUrl = `${KHOOT_MEDIA_BASE_URL}${choice.image.id}`;
    imageAlt = choice.image?.altText || `Answer option ${index + 1}`;
  }

  // --- Determine Component State ---
  const isShowingResults = viewMode === 'showingResults';
  // Button is non-interactive if generally disabled OR if showing results
  const isButtonDisabled = isDisabled || isShowingResults;
  // Click handler only active if not disabled AND in interactive mode
  const handleClick = !isButtonDisabled && viewMode === 'interactive' ? () => onClick(index) : undefined;
  // Select the correct icon for results view
  const CorrectnessIcon = isCorrectOption === true ? CheckCircle : isCorrectOption === false ? XCircle : null;

  return (
    <Button
      variant="default"
      className={cn(
        // Base styles
        "relative flex flex-col md:flex-row items-center justify-start text-left w-full h-auto min-h-[60px] md:min-h-[80px] p-3 md:p-4 border-b-4 shadow-md text-white font-bold text-base md:text-xl whitespace-normal break-words duration-300",
        // Color from mapping
        colorClasses,
        // Interaction effects (only when truly interactive)
        viewMode === 'interactive' && !isDisabled ? 'hover:scale-[1.02] active:scale-[0.98] cursor-pointer' : 'cursor-default',
        // Disabled state (applies dimming ONLY if generally disabled, NOT just for results view)
        isDisabled && 'opacity-60 pointer-events-none',
        // Styling for results view: Dim incorrect options
        isShowingResults && isCorrectOption === false && 'opacity-50 brightness-75',
        // Layout adjustment for image choices
        isImageChoice(choice) && 'justify-center',
        // Focus visibility
        'focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800'
      )}
      onClick={handleClick}
      // Disable button clicks if generally disabled OR if showing results
      disabled={isButtonDisabled || isShowingResults}
      aria-label={isImageChoice(choice) ? imageAlt : choice.answer}
      // Set role for accessibility
      role={isShowingResults ? "status" : "button"}
    >
      {/* Shape Icon */}
      <div
        className={cn(
          "flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 mb-2 md:mb-0 md:mr-3 rounded",
          // Position over image if applicable, otherwise use semi-transparent background
          isImageChoice(choice) ? 'absolute top-2 left-2 z-10 p-1 bg-black/30' : 'bg-white/20'
        )}
      >
        <Icon className={cn("h-4 w-4 md:h-5 md:w-5", iconColor)} />
      </div>

      {/* Content Area (Text or Image) */}
      <div className={cn("flex-grow", isImageChoice(choice) ? 'w-full h-full' : '')}>
        {isImageChoice(choice) && imageUrl ? (
          // Image Display
          <div className="relative w-full h-full min-h-[80px] md:min-h-[100px]">
            <Image
              src={imageUrl}
              alt={imageAlt || ''}
              fill
              className="object-contain rounded"
              sizes="(max-width: 640px) 80vw, (max-width: 768px) 40vw, 20vw"
              priority={true} // Prioritize loading answer images
              onError={(e) => {
                console.error("Failed to load image:", imageUrl);
                // Simple hide on error
                (e.target as HTMLImageElement).style.opacity = '0';
              }}
            />
          </div>
        ) : (
          // Text Display
          <span className="block">{choice.answer}</span>
        )}
      </div>

      {/* Stats and Correctness Icon Display (Only in 'showingResults' mode) */}
      {isShowingResults && (
        <div className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 pl-2 md:pl-4 z-10",
          "bg-black/40 backdrop-blur-sm p-1 md:p-1.5 rounded" // Background for better visibility
        )}>
          {/* Correctness Icon */}
          {CorrectnessIcon && (
            <CorrectnessIcon
              className={cn(
                "h-5 w-5 md:h-6 md:w-6 flex-shrink-0",
                isCorrectOption ? 'text-green-300' : 'text-red-300' // Adjusted colors for contrast
              )}
              aria-label={isCorrectOption ? 'Correct' : 'Incorrect'}
            />
          )}
          {/* Stats Display */}
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
    </Button>
  );
};

// Memoize for performance optimization
const AnswerButton = memo(AnswerButtonComponent);
export default AnswerButton;