'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react'; // [cite: 632]
import { cn } from '@/src/lib/utils'; // [cite: 575]
import { Card, CardContent } from '@/src/components/ui/card'; // [cite: 528]

interface DraggableAnswerItemProps {
  id: string | number; // Unique ID for dnd-kit
  content: string; // The answer text
  originalIndex: number; // Keep track of the original index for submission
  isDisabled?: boolean;
}

const DraggableAnswerItem: React.FC<DraggableAnswerItemProps> = ({
  id,
  content,
  originalIndex,
  isDisabled = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: id, data: { originalIndex } }); // Pass originalIndex via data

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto', // Ensure dragging item is on top
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "mb-2 touch-none select-none", // Prevent text selection during drag
        isDisabled ? 'opacity-50 bg-muted' : 'cursor-grab bg-card hover:shadow-md', // [cite: 606, 613, 604, 611]
        isDragging ? 'shadow-lg scale-105' : ''
      )}
      {...attributes} // Spread dnd attributes here
    >
      <CardContent className="p-3 flex items-center"> {/* [cite: 529] */}
        <button
          {...listeners} // Spread dnd listeners onto the handle
          disabled={isDisabled}
          aria-label={`Drag ${content}`}
          className={cn(
            "p-1 mr-2 text-muted-foreground cursor-grab focus:outline-none focus:ring-2 focus:ring-ring rounded", // [cite: 606, 613, 607, 614]
            isDisabled ? 'cursor-not-allowed' : ''
          )}
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <span className="flex-grow">{content}</span>
      </CardContent>
    </Card>
  );
};

export default DraggableAnswerItem;