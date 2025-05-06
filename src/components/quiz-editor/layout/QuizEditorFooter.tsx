// src/components/quiz-editor/layout/QuizEditorFooter.tsx
import React from 'react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Settings, PlusCircle, GripHorizontal } from 'lucide-react';

// --- Updated Interface ---
interface QuizEditorFooterProps {
    onSettingsClick?: () => void;
    onAddSlideClick?: () => void;
    showNavigator?: boolean;
    showAddButton?: boolean;
    showSettingsButton?: boolean; // <<< ENSURE THIS LINE EXISTS
    className?: string;
    children?: React.ReactNode;
}
// --- End Update ---

const QuizEditorFooter: React.FC<QuizEditorFooterProps> = ({
    onSettingsClick,
    onAddSlideClick,
    showNavigator = true,
    showAddButton = true,
    showSettingsButton = true, // Default value
    className,
    children,
}) => {
    return (
        <footer
            className={cn(
                'sticky bottom-0 z-40 flex items-center justify-between p-2 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
                className
            )}
        >
            {/* Left: Settings Button */}
            <div className="flex-shrink-0">
                {/* Use the prop to conditionally render */}
                {showSettingsButton && onSettingsClick && ( // <<< USE PROP HERE
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onSettingsClick}
                        aria-label="Quiz Settings"
                    >
                        <Settings className="h-5 w-5" />
                    </Button>
                )}
                {/* Render placeholder div if button is hidden */}
                {!showSettingsButton && <div className="w-10 h-10"></div>}
            </div>

            {/* Center: Slide Navigator Placeholder */}
            <div className="flex-grow flex justify-center items-center overflow-x-auto px-2 min-w-0">
                {showNavigator ? (
                    children ? (
                        children
                    ) : (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <GripHorizontal className="h-4 w-4" />
                            <span>Slide Navigator</span>
                        </div>
                    )
                ) : (
                    <div className="h-8"></div>
                )}
            </div>

            {/* Right: Add Slide Button */}
            <div className="flex-shrink-0">
                {showAddButton && onAddSlideClick && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onAddSlideClick}
                        aria-label="Add Slide"
                    >
                        <PlusCircle className="h-5 w-5" />
                    </Button>
                )}
                {!showAddButton && <div className="w-10 h-10"></div>}
            </div>
        </footer>
    );
};

export default QuizEditorFooter;