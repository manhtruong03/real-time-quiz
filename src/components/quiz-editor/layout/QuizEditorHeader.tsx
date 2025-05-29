// src/components/quiz-editor/layout/QuizEditorHeader.tsx
import React from 'react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Settings, Check, Loader2 } from 'lucide-react'; // Replaced Eye with Settings

interface QuizEditorHeaderProps {
    quizTitle?: string;
    onSave?: () => void;
    onSettingsClick?: () => void; // Renamed from onPreview, and icon changed
    onExit?: () => void;
    className?: string;
    // showPreviewButton prop is removed
    showSettingsButton?: boolean; // To control visibility of settings button
    showSaveButton?: boolean;
    saveButtonLabel?: string;
    isSaving?: boolean;
}

const QuizEditorHeader: React.FC<QuizEditorHeaderProps> = ({
    quizTitle = 'Untitled Quiz',
    onSave,
    onSettingsClick, // Use new prop
    onExit,
    className,
    showSettingsButton = true, // Default to true
    showSaveButton = true,
    saveButtonLabel = 'Done', // Changed default label
    isSaving = false,
}) => {
    return (
        <header
            className={cn(
                'flex items-center justify-between p-2 md:p-3 border-b bg-background dark:bg-[var(--primary-bg)] sticky top-0 z-50 h-[60px] dark:border-[var(--border-color)]', // Matched height from target HTML
                className
            )}
        >
            {/* Left Side */}
            <div className="flex items-center gap-2 md:gap-4"> {/* Increased gap slightly */}
                {/* Logo from target HTML */}
                <a href="#" className="text-xl font-bold text-primary-foreground dark:text-[var(--text-primary)] bg-primary dark:bg-[var(--accent-color)] px-2.5 py-1.5 rounded-md text-sm">
                    VQ
                </a>
                <span className="text-sm md:text-lg font-medium text-foreground dark:text-[var(--text-primary)] hidden md:inline truncate max-w-xs lg:max-w-md xl:max-w-lg">
                    {quizTitle}
                </span>
            </div>

            {/* Center (can be used for tabs or other controls later if needed) */}
            <div></div>

            {/* Right Side: Actions */}
            <div className="flex items-center gap-2 md:gap-3">
                {/* Settings Button - Replaces Preview Button */}
                {showSettingsButton && onSettingsClick && (
                    <Button
                        variant="outline" // Styled as secondary in target HTML
                        size="sm" // Standard small size for action buttons
                        onClick={onSettingsClick}
                        aria-label="Quiz Settings"
                        disabled={isSaving}
                        className="dark:bg-[var(--secondary-bg)] dark:text-[var(--text-primary)] dark:border-[var(--border-color)] dark:hover:bg-[#3a3a42]"
                    >
                        <Settings className="mr-0 md:mr-1.5 h-4 w-4" />
                        <span className="hidden md:inline">Cài đặt</span>
                    </Button>
                )}
                {showSaveButton && (
                    <Button
                        variant="default" // "btn-primary" in target HTML
                        size="sm"
                        onClick={onSave}
                        aria-label={saveButtonLabel}
                        disabled={isSaving}
                        className="dark:bg-[var(--accent-color)] dark:text-white dark:hover:bg-[var(--accent-hover)]"
                    >
                        {isSaving ? (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                            <Check className="mr-1.5 h-4 w-4" />
                        )}
                        {isSaving ? 'Saving...' : saveButtonLabel}
                    </Button>
                )}
            </div>
        </header>
    );
};

export default QuizEditorHeader;