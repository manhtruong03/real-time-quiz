// src/components/quiz-editor/editor/answer-editors/AnswerGrid.tsx
import React from 'react';
import { cn } from '@/src/lib/utils';

interface AnswerGridProps {
    children: React.ReactNode;
    className?: string;
}

export const AnswerGrid: React.FC<AnswerGridProps> = ({
    children,
    className,
}) => {
    // Adjust grid columns based on the number of children dynamically?
    // For now, default to 2 columns, suitable for 4 choices or T/F.
    // We can refine this later if needed (e.g., pass columns prop).
    return (
        <div
            className={cn(
                'grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3',
                className
            )}
        >
            {children}
        </div>
    );
};

export default AnswerGrid;