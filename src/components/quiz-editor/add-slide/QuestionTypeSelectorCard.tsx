// src/components/quiz-editor/add-slide/QuestionTypeSelectorCard.tsx
import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/src/components/ui/card'; // [cite: 1325, 2054]
import { cn } from '@/src/lib/utils';
import type { QuestionHost } from '@/src/lib/types/quiz-structure'; // For type safety

// Define Props
interface QuestionTypeSelectorCardProps {
    type: QuestionHost['type']; // e.g., 'quiz', 'jumble', 'content'
    title: string;
    description: string;
    icon: React.ElementType; // e.g., Lucide icon component
    onClick: (type: QuestionHost['type']) => void; // Callback when clicked
    className?: string;
}

export const QuestionTypeSelectorCard: React.FC<QuestionTypeSelectorCardProps> = ({
    type,
    title,
    description,
    icon: Icon, // Rename prop for clarity
    onClick,
    className,
}) => {
    const handleClick = () => {
        onClick(type); // Pass the type back on click
    };

    return (
        <Card
            className={cn(
                'cursor-pointer hover:border-primary transition-colors flex flex-col h-full', // Make card clickable and add hover effect [cite: 193]
                className
            )}
            onClick={handleClick} // Attach click handler
            role="button" // Semantic role
            tabIndex={0} // Make it focusable
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    handleClick();
                }
            }} // Allow activation with Enter/Space
        >
            <CardHeader className="flex-shrink-0 pb-2">
                <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6 text-primary" strokeWidth={2} /> {/* Render the icon */}
                    <CardTitle className="text-lg">{title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <CardDescription>{description}</CardDescription>
            </CardContent>
        </Card>
    );
};

export default QuestionTypeSelectorCard;