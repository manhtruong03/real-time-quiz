// src/components/quiz-editor/add-slide/QuestionTypeSelectorCard.tsx
import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/src/components/ui/card';
import { cn } from '@/src/lib/utils';
import type { QuestionHost } from '@/src/lib/types/quiz-structure';

interface QuestionTypeSelectorCardProps {
    type: QuestionHost['type'];
    title: string;
    description: string;
    icon: React.ElementType; // Expecting a Lucide icon component
    onClick: (type: QuestionHost['type']) => void;
    className?: string;
}

export const QuestionTypeSelectorCard: React.FC<QuestionTypeSelectorCardProps> = ({
    type,
    title,
    description,
    icon: IconComponent, // Renamed for clarity
    onClick,
    className,
}) => {
    const handleClick = () => {
        onClick(type);
    };

    return (
        <Card
            className={cn(
                "cursor-pointer transition-all duration-200 ease-in-out flex flex-col h-full",
                "bg-[var(--secondary-bg)] border border-[var(--border-color)] rounded-lg p-5 text-left", // Styles from .slide-type-card
                "hover:border-[var(--accent-color)] hover:translate-y-[-3px] hover:shadow-[0_4px_15px_rgba(0,0,0,0.2)]",
                className
            )}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    handleClick();
                }
            }}
        >
            <CardHeader className="p-0 flex-shrink-0"> {/* Removed default CardHeader padding */}
                {/* Mimicking .slide-type-header structure */}
                <div className="flex items-center gap-3 mb-2"> {/* Adjusted gap from 12px to 3 (Tailwind) */}
                    <IconComponent className="h-[22px] w-[22px] text-[var(--accent-color)]" strokeWidth={2.5} /> {/* Icon styling */}
                    <CardTitle className="text-[17px] font-medium text-[var(--text-primary)] m-0"> {/* Title styling */}
                        {title}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-grow p-0">
                {/* Mimicking .slide-type-card p styling for description */}
                <CardDescription className="text-[13px] text-[var(--text-secondary)] leading-normal pl-[calc(22px+0.75rem)]"> {/* pl should align with text after icon (22px icon + 12px gap from HTML -> ~pl-[34px] or pl-8/pl-9. Let's use calc for precision based on icon size and gap */}
                    {description}
                </CardDescription>
            </CardContent>
        </Card>
    );
};

export default QuestionTypeSelectorCard;