// src/components/quiz-editor/layout/QuizEditorHeader.tsx
import React from 'react';
import { cn } from '@/src/lib/utils'; // [cite: 2643]
import { Button } from '@/src/components/ui/button'; // [cite: 1844]
import { Eye, Check, Loader2 } from 'lucide-react'; // [cite: 788]

interface QuizEditorHeaderProps {
    quizTitle?: string; // Optional: For displaying/editing title later
    onSave?: () => void;
    onPreview?: () => void;
    onExit?: () => void; // Placeholder for exit action
    className?: string;
    showPreviewButton?: boolean;
    showSaveButton?: boolean; // Renamed to "Done" in settings, but keep prop generic
    saveButtonLabel?: string; // Allow customizing button label
    isSaving?: boolean;
}

const QuizEditorHeader: React.FC<QuizEditorHeaderProps> = ({
    quizTitle = 'Untitled Quiz',
    onSave,
    onPreview,
    onExit,
    className,
    showPreviewButton = true,
    showSaveButton = true,
    saveButtonLabel = 'Save', // Default label
    isSaving = false,
}) => {
    return (
        <header
            className={cn(
                'flex items-center justify-between p-2 md:p-3 border-b bg-background sticky top-0 z-50',
                className
            )}
        >
            {/* Left Side */}
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold text-sm">
                    VQ
                </div>
                <span className="text-sm font-medium hidden md:inline">
                    {quizTitle}
                </span>
            </div>

            {/* Center */}
            <div></div>

            {/* Right Side: Actions */}
            <div className="flex items-center gap-2">
                {showPreviewButton && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onPreview}
                        aria-label="Preview Quiz"
                        disabled={isSaving} // <-- Disable if saving
                    >
                        <Eye className="mr-1.5 h-4 w-4" />
                        Preview
                    </Button>
                )}
                {showSaveButton && (
                    <Button
                        variant="default"
                        size="sm"
                        onClick={onSave}
                        aria-label={saveButtonLabel}
                        disabled={isSaving} // <-- Disable if saving
                    >
                        {isSaving ? (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> // <-- Show spinner
                        ) : (
                            <Check className="mr-1.5 h-4 w-4" /> // <-- Show check icon
                        )}
                        {isSaving ? 'Saving...' : saveButtonLabel} {/* <-- Change label text */}
                    </Button>
                )}
            </div>
        </header>
    );
};

export default QuizEditorHeader;