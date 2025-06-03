// src/components/quiz-editor/layout/QuizEditorHeader.tsx
import React from 'react';
import Link from 'next/link'; // Import Link
import { cn } from '@/src/lib/utils'; //
import { Button } from '@/src/components/ui/button'; //
import { Settings, Save, Loader2 } from 'lucide-react'; // Replaced Check with Save

interface QuizEditorHeaderProps {
    quizTitle?: string;
    onSave?: () => void;
    onSettingsClick?: () => void;
    className?: string;
    showSettingsButton?: boolean;
    showSaveButton?: boolean;
    saveButtonLabel?: string;
    isSaving?: boolean;
}

const QuizEditorHeader: React.FC<QuizEditorHeaderProps> = ({
    quizTitle = 'Quiz Chưa Có Tên',
    onSave,
    onSettingsClick,
    className,
    showSettingsButton = true,
    showSaveButton = true,
    saveButtonLabel = 'Lưu Quiz',
    isSaving = false,
}) => {
    return (
        <header
            className={cn(
                'flex items-center justify-between p-2 md:px-[25px] md:py-[10px] border-b bg-editor-primary-bg sticky top-0 z-50 h-[60px]', // Matched height and padding from target, using Tailwind color
                'border-editor-border-color', // Use editor-specific border color
                className
            )}
        >
            {/* Left Side */}
            <div className="flex items-center gap-2 md:gap-[15px]"> {/* Matched gap */}
                <Link href="/" passHref legacyBehavior>
                    <a className="text-xl font-bold text-editor-text-primary bg-editor-accent-color px-2.5 py-1.5 rounded-md text-sm no-underline">
                        VQ
                    </a>
                </Link>
                <span className="text-sm md:text-lg font-medium text-editor-text-primary hidden md:inline truncate max-w-xs lg:max-w-md xl:max-w-lg">
                    {quizTitle}
                </span>
            </div>

            {/* Center (can be used for tabs or other controls later if needed) */}
            <div></div>

            {/* Right Side: Actions */}
            <div className="flex items-center gap-2 md:gap-[15px]"> {/* Matched gap */}
                {showSettingsButton && onSettingsClick && (
                    <Button
                        variant="outline" // shadcn 'outline' variant
                        size="sm" // shadcn 'sm' size
                        onClick={onSettingsClick}
                        aria-label="Cài đặt Quiz"
                        disabled={isSaving}
                        className="bg-editor-secondary-bg text-editor-text-primary border-editor-border-color hover:bg-[#3a3a42] px-[18px] py-[8px] text-sm font-medium rounded-[6px]" // Applied styles similar to .btn-secondary
                    >
                        <Settings className="mr-0 md:mr-1.5 h-4 w-4" /> {/* Lucide icon */}
                        <span className="hidden md:inline">Cài đặt</span>
                    </Button>
                )}
                {showSaveButton && onSave && (
                    <Button
                        variant="default" // shadcn 'default' variant
                        size="sm" // shadcn 'sm' size
                        onClick={onSave}
                        aria-label={saveButtonLabel}
                        disabled={isSaving}
                        className="bg-editor-accent-color text-white hover:bg-editor-accent-hover px-[18px] py-[8px] text-sm font-medium rounded-[6px]" // Applied styles similar to .btn-primary
                    >
                        {isSaving ? (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-1.5 h-4 w-4" /> // Using Save icon
                        )}
                        {isSaving ? 'Đang lưu...' : saveButtonLabel}
                    </Button>
                )}
            </div>
        </header>
    );
};

export default QuizEditorHeader;