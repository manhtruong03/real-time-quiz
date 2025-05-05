// src/components/game/inputs/DraggableAnswerItem.tsx
'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Triangle, Diamond, Circle, Square } from 'lucide-react';
import { cn } from '@/src/lib/utils';

// --- Button Mapping (remains the same) ---
const playerButtonMapping = [
  { Icon: Triangle, colorClasses: 'bg-red-500 hover:bg-red-600 border-red-700', iconColor: 'text-red-200' }, // Index 0 = Red
  { Icon: Diamond, colorClasses: 'bg-blue-500 hover:bg-blue-600 border-blue-700', iconColor: 'text-blue-200' }, // Index 1 = Blue
  { Icon: Circle, colorClasses: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-700', iconColor: 'text-yellow-200' }, // Index 2 = Yellow
  { Icon: Square, colorClasses: 'bg-green-500 hover:bg-green-600 border-green-700', iconColor: 'text-green-200' }, // Index 3 = Green
];

interface DraggableAnswerItemProps {
  id: string | number;
  content: string;
  originalIndex: number; // Original index from when the question was received
  indexInList: number; // Current index in the displayed (potentially reordered) list
  isDisabled?: boolean;
}

const DraggableAnswerItem: React.FC<DraggableAnswerItemProps> = ({
  id,
  content,
  originalIndex, // Use this for color/icon
  indexInList, // Keep for potential other uses if needed, but not for primary styling
  isDisabled = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: id, data: { originalIndex } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };

  // --- MODIFIED LINE: Use originalIndex for styling ---
  // Get color and icon based on the ORIGINAL index, not the current list position
  const { Icon, colorClasses, iconColor } = playerButtonMapping[originalIndex % playerButtonMapping.length] || playerButtonMapping[0];
  // --- END MODIFICATION ---

  return (
    // Use a div with button-like styling instead of Card
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        // Base styles copied from AnswerButton
        "relative flex items-center justify-start text-left w-full h-auto min-h-[60px] p-3 border-b-4 shadow-md text-white font-bold text-base whitespace-normal break-words",
        // Apply color based on originalIndex
        colorClasses,
        // Dragging state styles
        isDragging ? 'shadow-lg scale-105 ring-2 ring-white' : '',
        // Disabled state
        isDisabled ? 'opacity-70 cursor-not-allowed' : 'cursor-grab',
        'touch-none select-none' // Important for drag interaction
      )}
      {...attributes} // Spread dnd attributes here for the whole item
    >
      {/* Drag Handle (Listeners here) */}
      <button
        {...listeners} // DRAG LISTENER IS ON THIS BUTTON
        disabled={isDisabled}
        aria-label={`Drag ${content}`}
        className={cn(
          "p-1 mr-3 text-white/70 cursor-grab focus:outline-none focus:ring-2 focus:ring-white rounded-sm flex-shrink-0",
          isDisabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Shape Icon */}
      <div
        className={cn(
          "flex-shrink-0 flex items-center justify-center w-8 h-8 mr-3 rounded bg-white/20"
        )}
      >
        {/* Use the Icon derived from originalIndex */}
        <Icon className={cn("h-4 w-4", iconColor)} />
      </div>

      {/* Content Text */}
      <span className="flex-grow">{content}</span>
    </div>
  );
};

export default DraggableAnswerItem;