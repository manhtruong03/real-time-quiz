// src/components/quiz-editor/views/QuestionEditorView.tsx
"use client";

import React from "react";
import { FormProvider } from "react-hook-form";
import { cn } from "@/src/lib/utils"; //
import type { QuizStructureHost, QuestionHost } from "@/src/lib/types/quiz-structure"; //
import { Loader2 } from "lucide-react"; //

// Import Child Components
import QuestionEditorPanel from "@/src/components/quiz-editor/editor/QuestionEditorPanel"; //
import QuestionConfigurationSidebar from "@/src/components/quiz-editor/sidebar/QuestionConfigurationSidebar"; //

// Import the new custom hook
import { useQuestionFormManagement } from "@/src/hooks/quiz-editor/useQuestionFormManagement"; //

interface QuestionEditorViewProps {
    quizData: QuizStructureHost | null;
    currentSlideIndex: number;
    onSlideSelect: (index: number) => void;
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
    onSlideSelect,
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

    if (
        currentSlideIndex < 0 ||
        !quizData ||
        !quizData.questions[currentSlideIndex]
    ) {
        return (
            <div className="flex-grow flex items-center justify-center p-4 italic text-muted-foreground bg-editor-content-bg"> {/* Added bg-editor-content-bg for consistency */}
                Select a slide to edit or add a new one.
            </div>
        );
    }

    return (
        <FormProvider {...methods} key={`editor-form-provider-${currentSlideIndex}-${watchedType}`}>
            <div className={cn("flex-grow flex overflow-hidden", className)}>
                {/* Center Panel */}
                <div className="flex-grow flex flex-col overflow-y-auto bg-editor-content-bg custom-scrollbar-dark"> {/* Changed bg-muted/30 to bg-editor-content-bg, removed p-4/p-6 for QuestionEditorPanel to handle */}
                    <QuestionEditorPanel
                        key={`panel-${currentSlideIndex}-${watchedType}`}
                        className="p-4 md:p-6" // Added padding here as QuestionEditorPanel is now the direct child controlling this space
                    />
                </div>
                {/* Right Sidebar */}
                <div className="w-[280px] flex-shrink-0 border-l border-editor-border-color bg-editor-primary-bg overflow-y-auto custom-scrollbar-dark"> {/* Ensured right sidebar uses editor variables and custom scrollbar */}
                    <QuestionConfigurationSidebar
                        key={`config-${currentSlideIndex}-${watchedType}`}
                        onConfirmDelete={onConfirmDeleteSlide}
                        onConfirmDuplicate={onConfirmDuplicateSlide}
                        className="p-[25px_20px]" // Apply padding as per target HTML's .editor-sidebar-right
                    />
                </div>
            </div>
        </FormProvider>
    );
};

export default QuestionEditorView;