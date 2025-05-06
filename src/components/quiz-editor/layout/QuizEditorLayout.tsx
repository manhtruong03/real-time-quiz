// src/components/quiz-editor/layout/QuizEditorLayout.tsx
import React from 'react';
import { cn } from '@/src/lib/utils'; // [cite: 2643]

interface QuizEditorLayoutProps {
    children: React.ReactNode;
    className?: string;
}

const QuizEditorLayout: React.FC<QuizEditorLayoutProps> = ({
    children,
    className,
}) => {
    return (
        <div
            className={cn(
                'flex flex-col min-h-screen bg-muted/40 dark:bg-muted/10', // Basic background and flex column structure [cite: 234]
                className
            )}
        >
            {children}
        </div>
    );
};

export default QuizEditorLayout;