// src/components/quiz-editor/views/QuestionEditorView.tsx
"use client";

import React from "react";
import { FormProvider } from "react-hook-form";
import { cn } from "@/src/lib/utils";
import type { QuizStructureHost, QuestionHost } from "@/src/lib/types/quiz-structure";
import { Loader2 } from "lucide-react";

// Import Child Components
import QuestionEditorPanel from "@/src/components/quiz-editor/editor/QuestionEditorPanel";
import QuestionConfigurationSidebar from "@/src/components/quiz-editor/sidebar/QuestionConfigurationSidebar";

// Import the new custom hook
import { useQuestionFormManagement } from "@/src/hooks/quiz-editor/useQuestionFormManagement";

interface QuestionEditorViewProps {
    quizData: QuizStructureHost | null;
    currentSlideIndex: number;
    onSlideSelect: (index: number) => void; // Re-added this prop
    onQuestionChange: (
        index: number,
        updatedQuestion: QuestionHost | null
    ) => void;
    onConfirmDeleteSlide: () => void;
    onConfirmDuplicateSlide: () => void;
    triggerSaveRef?: React.MutableRefObject<(() => Promise<boolean>) | null>;
    className?: string;
}

export const QuestionEditorView: React.FC<QuestionEditorViewProps> = ({
    quizData,
    currentSlideIndex,
    onSlideSelect, // Prop is now defined
    onQuestionChange,
    onConfirmDeleteSlide,
    onConfirmDuplicateSlide,
    triggerSaveRef,
    className,
}) => {
    const { methods, watchedType } = useQuestionFormManagement({
        quizData,
        currentSlideIndex,
        onQuestionChange,
        triggerSaveRef,
    });

    // Handle loading or invalid state
    if (
        currentSlideIndex < 0 ||
        !quizData ||
        !quizData.questions[currentSlideIndex]
    ) {
        return (
            <div className="flex-grow flex items-center justify-center p-4 italic text-muted-foreground">
                Select a slide to edit or add a new one.
            </div>
        );
    }

    return (
        // Provide the form context to all children
        <FormProvider {...methods} key={`editor-form-provider-${currentSlideIndex}-${watchedType}`}>
            <div className={cn("flex-grow flex overflow-hidden", className)}>
                {/* Center Panel */}
                <div className="flex-grow flex flex-col overflow-y-auto p-4 md:p-6 bg-muted/30 custom-scrollbar-dark">
                    <QuestionEditorPanel
                        key={`panel-${currentSlideIndex}-${watchedType}`}
                    />
                </div>
                {/* Right Sidebar */}
                <div className="w-72 flex-shrink-0 border-l border-[var(--editor-border-color)] bg-[var(--editor-primary-bg)] overflow-y-auto p-4 custom-scrollbar-dark">
                    <QuestionConfigurationSidebar
                        key={`config-${currentSlideIndex}-${watchedType}`}
                        onConfirmDelete={onConfirmDeleteSlide}
                        onConfirmDuplicate={onConfirmDuplicateSlide}
                    />
                </div>
            </div>
        </FormProvider>
    );
};

export default QuestionEditorView;