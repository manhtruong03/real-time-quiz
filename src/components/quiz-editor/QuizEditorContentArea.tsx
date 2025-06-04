// src/components/quiz-editor/QuizEditorContentArea.tsx
"use client";

import React from 'react';
import { cn } from '@/src/lib/utils';
import type { QuestionHost, QuizStructureHost } from '@/src/lib/types/quiz-structure';
import type { QuizEditorViewMode } from '@/src/hooks/quiz-editor/useQuizViewManager';

// Views
import QuizSettingsView from '@/src/components/quiz-editor/views/QuizSettingsView';
import AddSlideView from '@/src/components/quiz-editor/views/AddSlideView';
import QuestionEditorView from '@/src/components/quiz-editor/views/QuestionEditorView';

interface QuizEditorContentAreaProps {
    viewMode: QuizEditorViewMode;
    quizData: QuizStructureHost | null;
    currentSlideIndex: number;
    // Callbacks for AddSlideView
    onAddQuestionAndEdit: (type: QuestionHost['type'], isTrueFalseOverride?: boolean) => void;
    onBackToSettings: () => void; // Used by AddSlideView to navigate back
    // Callbacks & props for QuestionEditorView
    onNavigateToEditorSlide: (index: number) => void; // Though QuestionEditorView doesn't directly call this, its parent might
    onQuestionChange: (index: number, updatedQuestion: QuestionHost | null) => void;
    onConfirmDeleteSlide: () => void;
    onConfirmDuplicateSlide: () => void;
    triggerSaveRef?: React.MutableRefObject<(() => Promise<boolean>) | null>;
}

export const QuizEditorContentArea: React.FC<QuizEditorContentAreaProps> = ({
    viewMode,
    quizData,
    currentSlideIndex,
    onAddQuestionAndEdit,
    onBackToSettings,
    onNavigateToEditorSlide,
    onQuestionChange,
    onConfirmDeleteSlide,
    onConfirmDuplicateSlide,
    triggerSaveRef,
}) => {
    const mainContentAreaClasses = "flex-grow overflow-y-auto custom-scrollbar-dark dark:bg-[var(--editor-content-bg)]";

    switch (viewMode) {
        case 'settings':
            // QuizSettingsView uses useFormContext() so it will pick up the FormProvider from page.tsx
            return (
                <div className={cn(mainContentAreaClasses, "p-4 md:p-6")}>
                    <QuizSettingsView />
                </div>
            );
        case 'add-slide':
            return (
                <div className={cn("flex flex-col", mainContentAreaClasses, "p-4 md:p-6")}>
                    <AddSlideView
                        onAddQuestion={onAddQuestionAndEdit}
                        onBackToSettings={onBackToSettings}
                    />
                </div>
            );
        case 'editor':
            return (
                <QuestionEditorView
                    quizData={quizData}
                    currentSlideIndex={currentSlideIndex}
                    onSlideSelect={onNavigateToEditorSlide} // Although sidebar handles direct nav, this could be for programmatic nav if needed
                    onQuestionChange={onQuestionChange}
                    onConfirmDeleteSlide={onConfirmDeleteSlide}
                    onConfirmDuplicateSlide={onConfirmDuplicateSlide}
                    triggerSaveRef={triggerSaveRef}
                    className="flex-grow" // Ensure it takes up space
                />
            );
        default:
            // Fallback or loading state if necessary
            return (
                <div className={cn("flex-grow flex items-center justify-center", mainContentAreaClasses)}>
                    Lỗi: Trạng thái xem không hợp lệ hoặc đang tải...
                </div>
            );
    }
};

export default QuizEditorContentArea;