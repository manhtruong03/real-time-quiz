// src/components/game/inputs/AnswerButton.tsx
import React from 'react';
import Image from 'next/image';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
// --- UPDATED Import ---
import { QuizChoicePlayer, SurveyChoicePlayer } from '@/src/lib/types'; // Use Player choice types
import { Triangle, Diamond, Circle, Square } from 'lucide-react';

// Define a union type for the choice prop
type AnswerChoicePlayer = QuizChoicePlayer | SurveyChoicePlayer;

interface AnswerButtonProps {
  choice: AnswerChoicePlayer;
  index: number; // 0, 1, 2, 3
  onClick: (index: number) => void;
  isDisabled: boolean;
  isSelected?: boolean;
  isInteractive?: boolean; // Added: Controls if the button is clickable/hoverable
}
// --- END UPDATE ---

const playerButtonMapping = [
  { Icon: Triangle, colorClasses: 'bg-red-500 hover:bg-red-600 border-red-700' },
  { Icon: Diamond, colorClasses: 'bg-blue-500 hover:bg-blue-600 border-blue-700' },
  { Icon: Circle, colorClasses: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-700' },
  { Icon: Square, colorClasses: 'bg-green-500 hover:bg-green-600 border-green-700' },
];

const KHOOT_MEDIA_BASE_URL = "https://media.kahoot.it/";

const AnswerButton: React.FC<AnswerButtonProps> = ({
  choice,
  index,
  onClick,
  isDisabled,
  isSelected = false,
  isInteractive = true, // Default to true (for Player view)
}) => {
  const { Icon, colorClasses } = playerButtonMapping[index] || playerButtonMapping[0];

  // --- UPDATED: Type guard for image choice ---
  const isImageChoice = (choice: AnswerChoicePlayer): choice is QuizChoicePlayer & { image: NonNullable<QuizChoicePlayer['image']> } => {
    return typeof choice === 'object' && choice !== null && 'image' in choice && !!choice.image;
  };

  let imageUrl: string | undefined = undefined;
  let imageAlt: string | undefined = 'Answer option image';
  if (isImageChoice(choice)) {
    if (choice.image?.url) {
      imageUrl = choice.image.url;
    } else if (choice.image?.id) {
      imageUrl = `${KHOOT_MEDIA_BASE_URL}${choice.image.id}`;
    }
    imageAlt = choice.image?.altText || `Answer option ${index + 1}`;
  }
  // --- END UPDATE ---

  const finalIsDisabled = isDisabled || !isInteractive;
  const handleClick = isInteractive ? () => onClick(index) : undefined;

  return (
    <Button
      variant="default"
      className={cn(
        "relative flex flex-col md:flex-row items-center justify-start text-left w-full h-auto min-h-[60px] md:min-h-[80px] p-3 md:p-4 border-b-4 shadow-md text-white font-bold text-base md:text-xl whitespace-normal break-words",
        colorClasses,
        // Apply non-interactive styles if needed
        !isInteractive && 'cursor-default',
        finalIsDisabled ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98] transition-transform', // Dim if disabled
        isSelected && isInteractive ? 'ring-4 ring-white ring-offset-2 ring-offset-gray-800' : '', // Only show selection ring if interactive
        isImageChoice(choice) && 'justify-center',
        'focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800'
      )}
      onClick={handleClick}
      disabled={finalIsDisabled}
      aria-label={isImageChoice(choice) ? imageAlt : choice.answer} // Add aria-label
    >
      {/* Icon always present, positioned for image choices */}
      <div className={cn(
        "flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 mb-2 md:mb-0 md:mr-3 rounded bg-white/20",
        isImageChoice(choice) && 'absolute top-2 left-2 z-10 p-1' // Adjust padding and position over image
      )}>
        <Icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
      </div>

      {/* Content Area */}
      <div className={cn("flex-grow", isImageChoice(choice) ? 'w-full h-full' : '')}>
        {isImageChoice(choice) && imageUrl ? (
          <div className="relative w-full h-full min-h-[80px] md:min-h-[100px]">
            <Image
              src={imageUrl}
              alt={imageAlt || ''}
              fill
              className="object-contain rounded"
              sizes="(max-width: 640px) 80vw, (max-width: 768px) 40vw, 20vw"
              onError={(e) => {
                console.error("Failed to load image:", imageUrl);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        ) : (
          // Display text answer (handles both QuizChoiceText and SurveyChoicePlayer)
          <span className="block">{choice.answer}</span>
        )}
      </div>
    </Button>
  );
};

export default AnswerButton;