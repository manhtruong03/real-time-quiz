// src/components/game/inputs/StaticAnswerItem.tsx
import React from 'react';
import { Triangle, Diamond, Circle, Square, CheckCircle } from 'lucide-react';
import { cn } from '@/src/lib/utils';

// Mapping for colors and icons based on original index
const playerButtonMapping = [
    { Icon: Triangle, colorClasses: 'bg-red-500 border-red-700', iconColor: 'text-red-200' }, // Index 0
    { Icon: Diamond, colorClasses: 'bg-blue-500 border-blue-700', iconColor: 'text-blue-200' }, // Index 1
    { Icon: Circle, colorClasses: 'bg-yellow-500 border-yellow-700', iconColor: 'text-yellow-200' }, // Index 2
    { Icon: Square, colorClasses: 'bg-green-500 border-green-700', iconColor: 'text-green-200' }, // Index 3
];

interface StaticAnswerItemProps {
    content: string;
    originalIndex: number; // The index in the original, correct order (0-3)
    className?: string;
    showCorrectIndicator?: boolean; // Flag to show a checkmark
}

const StaticAnswerItem: React.FC<StaticAnswerItemProps> = ({
    content,
    originalIndex,
    className,
    showCorrectIndicator = true, // Default to true for showing correct order
}) => {
    // Get style based on the original index
    const { Icon, colorClasses, iconColor } = playerButtonMapping[originalIndex % playerButtonMapping.length] || playerButtonMapping[0];

    return (
        <div
            className={cn(
                // Static display styles, similar to AnswerButton/DraggableAnswerItem
                "relative flex items-center justify-start text-left w-full h-auto min-h-[50px] md:min-h-[60px] p-3 border-b-4 shadow-sm text-white font-bold text-base md:text-lg whitespace-normal break-words rounded-md", // Added rounded-md
                colorClasses, // Apply color based on originalIndex
                className
            )}
        >
            {/* Shape Icon */}
            <div
                className={cn(
                    "flex-shrink-0 flex items-center justify-center w-8 h-8 mr-3 rounded bg-white/20"
                )}
            >
                <Icon className={cn("h-4 w-4 md:h-5 md:w-5", iconColor)} />
            </div>

            {/* Content Text */}
            <span className="flex-grow mr-8">{content}</span> {/* Add margin for indicator */}

            {/* Correctness Indicator */}
            {showCorrectIndicator && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 bg-black/30 rounded-full">
                    <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-300" />
                </div>
            )}
        </div>
    );
};

export default StaticAnswerItem;