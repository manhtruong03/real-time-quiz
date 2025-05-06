// src/components/quiz-editor/layout/QuizEditorFooter.tsx
import React from 'react';
import { cn } from '@/src/lib/utils'; // [cite: 2643]
import { Button } from '@/src/components/ui/button'; // [cite: 1844]
import { Settings, PlusCircle, GripHorizontal } from 'lucide-react'; // [cite: 1390]

interface QuizEditorFooterProps {
    onSettingsClick?: () => void;
    onAddSlideClick?: () => void;
    showNavigator?: boolean;
    showAddButton?: boolean;
    showSettingsButton?: boolean;
    className?: string;
    children?: React.ReactNode; // For SlideNavigator placeholder
}

const QuizEditorFooter: React.FC<QuizEditorFooterProps> = ({
    onSettingsClick,
    onAddSlideClick,
    showNavigator = true,
    showAddButton = true,
    showSettingsButton = true,
    className,
    children, // Render children in the center for navigator
}) => {
    return (
        <footer
            className={cn(
                'sticky bottom-0 z-40 flex items-center justify-between p-2 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60', // [cite: 241] Use sticky footer
                className
            )}
        >
            {/* Left: Settings Button */}
            <div className="flex-shrink-0">
                {showSettingsButton && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onSettingsClick}
                        aria-label="Quiz Settings"
                    >
                        <Settings className="h-5 w-5" />
                    </Button>
                )}
            </div>

            {/* Center: Slide Navigator Placeholder */}
            <div className="flex-grow flex justify-center items-center overflow-x-auto px-2">
                {showNavigator ? (
                    children ? (
                        children // Render actual navigator when passed
                    ) : (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <GripHorizontal className="h-4 w-4" />
                            <span>Slide Navigator Placeholder</span>
                        </div>
                    )
                ) : (
                    <div></div> // Empty div to maintain spacing if navigator hidden
                )}
            </div>

            {/* Right: Add Slide Button */}
            <div className="flex-shrink-0">
                {showAddButton && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onAddSlideClick}
                        aria-label="Add Slide"
                    >
                        <PlusCircle className="h-5 w-5" />
                    </Button>
                )}
            </div>
        </footer>
    );
};

export default QuizEditorFooter;