// src/components/game/inputs/DraggableAnswerItem.tsx
'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Triangle, Diamond, Circle, Square } from 'lucide-react'; // Import shape icons
import { cn } from '@/src/lib/utils';
// Remove Card imports

// --- Button Mapping (copied/adapted from AnswerButton) ---
const playerButtonMapping = [
  { Icon: Triangle, colorClasses: 'bg-red-500 hover:bg-red-600 border-red-700', iconColor: 'text-red-200' },
  { Icon: Diamond, colorClasses: 'bg-blue-500 hover:bg-blue-600 border-blue-700', iconColor: 'text-blue-200' },
  { Icon: Circle, colorClasses: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-700', iconColor: 'text-yellow-200' },
  { Icon: Square, colorClasses: 'bg-green-500 hover:bg-green-600 border-green-700', iconColor: 'text-green-200' },
];
// --- End Button Mapping ---

interface DraggableAnswerItemProps {
  id: string | number;
  content: string;
  originalIndex: number; // Used for submission logic
  indexInList: number; // <-- NEW PROP: Current index (0-3) in the displayed list for styling
  isDisabled?: boolean;
}

const DraggableAnswerItem: React.FC<DraggableAnswerItemProps> = ({
  id,
  content,
  originalIndex,
  indexInList, // Use this for styling
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

  // Get color and icon based on current position in the list
  const { Icon, colorClasses, iconColor } = playerButtonMapping[indexInList % playerButtonMapping.length] || playerButtonMapping[0];

  return (
    // Use a div with button-like styling instead of Card
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        // Base styles copied from AnswerButton
        "relative flex items-center justify-start text-left w-full h-auto min-h-[60px] p-3 border-b-4 shadow-md text-white font-bold text-base whitespace-normal break-words",
        // Apply color based on indexInList
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
        <Icon className={cn("h-4 w-4", iconColor)} />
      </div>

      {/* Content Text */}
      <span className="flex-grow">{content}</span>
    </div>
  );
};

export default DraggableAnswerItem;