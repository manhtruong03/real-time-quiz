// src/components/quiz-editor/layout/QuizEditorHeader.tsx
import React from 'react';
import { cn } from '@/src/lib/utils'; // [cite: 2643]
import { Button } from '@/src/components/ui/button'; // [cite: 1844]
import { Eye, Check, Save } from 'lucide-react'; // [cite: 788]

interface QuizEditorHeaderProps {
    quizTitle?: string; // Optional: For displaying/editing title later
    onSave?: () => void;
    onPreview?: () => void;
    onExit?: () => void; // Placeholder for exit action
    className?: string;
    showPreviewButton?: boolean;
    showSaveButton?: boolean; // Renamed to "Done" in settings, but keep prop generic
    saveButtonLabel?: string; // Allow customizing button label
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
}) => {
    return (
        <header
            className={cn(
                'flex items-center justify-between p-2 md:p-3 border-b bg-background sticky top-0 z-50', // [cite: 237] Add sticky header
                className
            )}
        >
            {/* Left Side: Branding/Title Placeholder */}
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold text-sm">
                    VQ
                </div>
                {/* Placeholder for title input later */}
                <span className="text-sm font-medium hidden md:inline">
                    {quizTitle}
                </span>
            </div>

            {/* Center: Optional - maybe AI features later? */}
            <div></div>

            {/* Right Side: Actions */}
            <div className="flex items-center gap-2">
                {showPreviewButton && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onPreview}
                        aria-label="Preview Quiz"
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
                    >
                        <Check className="mr-1.5 h-4 w-4" /> {saveButtonLabel}
                    </Button>
                )}
                {/* Optional Exit Button */}
                {/* <Button variant="ghost" size="icon" onClick={onExit} aria-label="Exit Editor"><X className="h-4 w-4" /></Button> */}
            </div>
        </header>
    );
};

export default QuizEditorHeader;