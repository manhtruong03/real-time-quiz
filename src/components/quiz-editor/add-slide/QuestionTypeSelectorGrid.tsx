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
                // Styles from screen-07-add-slide.html: .slide-type-grid
                'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-4xl mx-auto mb-8', // Adjusted gap and mb
                className
            )}
        >
            {children}
        </div>
    );
};

export default QuestionTypeSelectorGrid;