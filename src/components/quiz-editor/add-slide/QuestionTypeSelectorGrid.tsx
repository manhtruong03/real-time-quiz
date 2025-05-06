// src/components/quiz-editor/add-slide/QuestionTypeSelectorGrid.tsx
import React from 'react';
import { cn } from '@/src/lib/utils';

interface QuestionTypeSelectorGridProps {
    children: React.ReactNode;
    className?: string;
}

export const QuestionTypeSelectorGrid: React.FC<QuestionTypeSelectorGridProps> = ({
    children,
    className,
}) => {
    return (
        <div
            className={cn(
                'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 w-full max-w-4xl mx-auto', // Responsive grid layout [cite: 187]
                className
            )}
        >
            {children}
        </div>
    );
};

export default QuestionTypeSelectorGrid;