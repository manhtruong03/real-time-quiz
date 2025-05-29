// src/components/quiz-editor/layout/QuizEditorHeader.tsx
import React from 'react';
import Link from 'next/link'; // Import Link
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Settings, Check, Loader2, Save } from 'lucide-react'; // Added Save icon

interface QuizEditorHeaderProps {
    quizTitle?: string;
    onSave?: () => void;
    onSettingsClick?: () => void;
    // onExit is not in the HTML, can be added if needed
    className?: string;
    showSettingsButton?: boolean;
    showSaveButton?: boolean;
    saveButtonLabel?: string; // Changed from "Done" to "Lưu Quiz"
    isSaving?: boolean;
}

const QuizEditorHeader: React.FC<QuizEditorHeaderProps> = ({
    quizTitle = 'Quiz Chưa Có Tên', // Default title from HTML
    onSave,
    onSettingsClick,
    className,
    showSettingsButton = true,
    showSaveButton = true,
    saveButtonLabel = 'Lưu Quiz', // "Lưu Quiz" from HTML
    isSaving = false,
}) => {
    return (
        <header
            className={cn(
                'flex items-center justify-between p-2 md:p-3 border-b bg-[var(--editor-primary-bg)] sticky top-0 z-50 h-[60px]', // Matched height from HTML
                'border-[var(--editor-border-color)]', // Use editor-specific border color
                className
            )}
        >
            {/* Left Side */}
            <div className="flex items-center gap-2 md:gap-4">
                {/* Logo from target HTML */}
                <Link href="/" passHref legacyBehavior>
                    <a className="text-xl font-bold text-[var(--editor-text-primary)] bg-[var(--editor-accent-color)] px-2.5 py-1.5 rounded-md text-sm no-underline">
                        VQ
                    </a>
                </Link>
                <span className="text-sm md:text-lg font-medium text-[var(--editor-text-primary)] hidden md:inline truncate max-w-xs lg:max-w-md xl:max-w-lg">
                    {quizTitle}
                </span>
            </div>

            {/* Center (can be used for tabs or other controls later if needed) */}
            <div></div>

            {/* Right Side: Actions */}
            <div className="flex items-center gap-2 md:gap-3">
                {/* Settings Button - if needed, was in your previous version */}
                {showSettingsButton && onSettingsClick && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onSettingsClick}
                        aria-label="Cài đặt Quiz"
                        disabled={isSaving}
                        className="bg-[var(--editor-secondary-bg)] text-[var(--editor-text-primary)] border-[var(--editor-border-color)] hover:bg-[#3a3a42]"
                    >
                        <Settings className="mr-0 md:mr-1.5 h-4 w-4" />
                        <span className="hidden md:inline">Cài đặt</span>
                    </Button>
                )}
                {showSaveButton && onSave && ( // Ensure onSave is provided
                    <Button
                        variant="default"
                        size="sm"
                        onClick={onSave}
                        aria-label={saveButtonLabel}
                        disabled={isSaving}
                        className="bg-[var(--editor-accent-color)] text-white hover:bg-[var(--editor-accent-hover)]"
                    >
                        {isSaving ? (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                            // Using Save icon as per HTML implication, not Check
                            <Save className="mr-1.5 h-4 w-4" />
                        )}
                        {isSaving ? 'Đang lưu...' : saveButtonLabel}
                    </Button>
                )}
            </div>
        </header>
    );
};

export default QuizEditorHeader;