// src/app/quiz/create/page.tsx
"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FormProvider } from 'react-hook-form';
import { useRouter } from 'next/navigation';

// Layout & UI
import QuizEditorLayout from '@/src/components/quiz-editor/layout/QuizEditorLayout';
import QuizEditorHeader from '@/src/components/quiz-editor/layout/QuizEditorHeader';
// QuizEditorFooter is no longer imported
import SlideNavigationSidebar from '@/src/components/quiz-editor/sidebar/SlideNavigationSidebar';
import { useToast } from '@/src/components/ui/use-toast';

// Views
import QuizSettingsView from '@/src/components/quiz-editor/views/QuizSettingsView';
import AddSlideView from '@/src/components/quiz-editor/views/AddSlideView';
import QuestionEditorView from '@/src/components/quiz-editor/views/QuestionEditorView';

// Types & Hooks
import type { QuestionHost } from '@/src/lib/types/quiz-structure';
import { useQuizCreator } from '@/src/hooks/quiz-editor/useQuizCreator';
import type { QuizDTO } from '@/src/lib/types/api';
import { AuthApiError } from '@/src/lib/types/auth';

// API Utils
import { createQuiz } from '@/src/lib/api/quizzes';
import { transformQuizStateToDTO } from '@/src/lib/api-utils/quiz-transformer';
import { QuizVisibilityEnum } from '@/src/lib/schemas/quiz-settings.schema';
import { cn } from '@/src/lib/utils';

type QuizEditorViewMode = 'settings' | 'add-slide' | 'editor';

export default function CreateQuizPage() {
    const [viewMode, setViewMode] = useState<QuizEditorViewMode>('settings');
    const triggerQuestionSaveRef = useRef<(() => Promise<boolean>) | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const [isSaving, setIsSaving] = useState(false);

    const {
        quizData,
        currentSlideIndex,
        setCurrentSlideIndex,
        formMethods,
        updateQuizMetadata,
        handleMetadataSubmit,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        duplicateQuestion,
        resetCreatorState,
    } = useQuizCreator();
    const { reset: resetForm, formState: settingsFormState, watch } = formMethods;

    const watchedQuizTitle = watch("title");

    const latestQuizDataRef = useRef(quizData);
    useEffect(() => {
        latestQuizDataRef.current = quizData;
    }, [quizData]);

    useEffect(() => {
        if (!settingsFormState.isDirty) {
            resetForm({
                title: quizData.title ?? "",
                description: quizData.description ?? "",
                visibility:
                    quizData.visibility === 1
                        ? QuizVisibilityEnum.enum.PUBLIC
                        : QuizVisibilityEnum.enum.PRIVATE,
                tags: (quizData as any).tags ?? [],
                cover: quizData.cover ?? null,
            }, {
                keepDefaultValues: false,
                keepDirty: false,
                keepErrors: false,
            });
        }
    }, [
        quizData.title,
        quizData.description,
        quizData.visibility,
        quizData.cover,
        resetForm,
        settingsFormState.isDirty,
    ]);

    const saveCurrentQuestionIfNeeded = useCallback(async (): Promise<boolean> => {
        if (viewMode === 'editor' && triggerQuestionSaveRef.current) {
            const success = await triggerQuestionSaveRef.current();
            if (!success) {
                toast({
                    title: "Unsaved Changes",
                    description: `Could not save Slide ${currentSlideIndex + 1} due to errors. Please fix them.`,
                    variant: "destructive",
                });
            }
            return success;
        }
        return true;
    }, [viewMode, currentSlideIndex, triggerQuestionSaveRef, toast]);

    const handleSaveQuiz = useCallback(async () => {
        setIsSaving(true);
        try {
            if (formMethods.formState.isDirty) {
                const settingsAreValid = await formMethods.trigger();
                if (settingsAreValid) {
                    handleMetadataSubmit(updateQuizMetadata)();
                    await new Promise(resolve => setTimeout(resolve, 50));
                } else {
                    toast({ title: "Validation Error", description: "Please fix errors in Quiz Settings before saving.", variant: "destructive" });
                    throw new Error("Settings validation failed.");
                }
            }

            if (viewMode === 'editor') {
                const questionSaveSuccess = await saveCurrentQuestionIfNeeded();
                if (!questionSaveSuccess) {
                    throw new Error("Failed to save current question. Please fix errors.");
                }
            }

            const currentQuizState = latestQuizDataRef.current;
            if (!currentQuizState) {
                throw new Error("Quiz data is not available after updates.");
            }

            const quizPayload = transformQuizStateToDTO(currentQuizState);

            if (!quizPayload.title || quizPayload.title.trim().length < 3) {
                toast({ title: "Validation Error", description: "Quiz title must be at least 3 characters.", variant: "destructive" });
                throw new Error("Quiz title validation failed");
            }
            // For Phase 1, allow saving without questions for UI testing.
            if (!quizPayload.questions || quizPayload.questions.length === 0) {
                toast({ title: "Empty Quiz", description: "Quiz has no slides. Consider adding some!", variant: "default" });
            }

            const savedQuiz = await createQuiz(quizPayload);
            toast({
                title: "Quiz Saved!",
                description: `Quiz "${savedQuiz.title}" saved successfully.`,
            });
            router.push(`/my-quizzes`);
        } catch (error: unknown) {
            console.error("[CreatePage] Error during save process:", error);
            let errorMessage = "An unexpected error occurred. Please try again.";
            let errorTitle = "Save Failed";
            if (error instanceof AuthApiError) {
                errorTitle = `API Error (${error.status})`;
                errorMessage = error.message || errorMessage;
                if (error.status === 401) errorMessage = "Authentication error. Please log in again.";
                else if (error.status === 400) {
                    errorTitle = "Validation Error";
                    errorMessage = `Invalid data: ${error.message}`;
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
                if (errorMessage.includes("validation failed")) errorTitle = "Validation Error";
                else if (errorMessage.includes("Failed to save current question")) errorTitle = "Unsaved Changes";
            }
            toast({ title: errorTitle, description: errorMessage, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }, [
        viewMode,
        saveCurrentQuestionIfNeeded,
        formMethods,
        handleMetadataSubmit,
        updateQuizMetadata,
        toast,
        router,
    ]);

    const handleSave = useCallback(async () => {
        await handleSaveQuiz();
    }, [handleSaveQuiz]);

    const handleAddSlideClick = useCallback(async () => {
        if (viewMode === 'editor') {
            const canProceed = await saveCurrentQuestionIfNeeded();
            if (!canProceed) return;
        }
        // If settings form is dirty, prompt or auto-save settings before switching to add-slide
        if (formMethods.formState.isDirty && viewMode === 'settings') {
            const settingsValid = await formMethods.trigger();
            if (settingsValid) {
                handleMetadataSubmit(updateQuizMetadata)(); // Save settings
                await new Promise(resolve => setTimeout(resolve, 50)); // allow state to propagate
            } else {
                toast({ title: "Unsaved Settings", description: "Please fix errors in quiz settings before adding a slide.", variant: "destructive" });
                return;
            }
        }
        setCurrentSlideIndex(-1);
        setViewMode('add-slide');
    }, [viewMode, saveCurrentQuestionIfNeeded, setCurrentSlideIndex, setViewMode, formMethods, handleMetadataSubmit, updateQuizMetadata, toast]);

    const handleSettingsClick = useCallback(async () => {
        if (viewMode === 'editor') {
            let canProceed = await saveCurrentQuestionIfNeeded();
            if (!canProceed) return;
        }
        // No need to save settings form here, as we are navigating *to* settings
        setCurrentSlideIndex(-1);
        setViewMode('settings');
    }, [viewMode, saveCurrentQuestionIfNeeded, setCurrentSlideIndex, setViewMode]);

    const handleSlideSelect = useCallback(async (index: number) => {
        if (index === currentSlideIndex && viewMode === 'editor') return;

        // Save current question if in editor view before switching
        if (viewMode === 'editor') {
            const canProceedFromEditor = await saveCurrentQuestionIfNeeded();
            if (!canProceedFromEditor) return;
        }
        // Save settings if dirty and coming from settings view
        if (viewMode === 'settings' && formMethods.formState.isDirty) {
            const settingsValid = await formMethods.trigger();
            if (settingsValid) {
                handleMetadataSubmit(updateQuizMetadata)();
                await new Promise(resolve => setTimeout(resolve, 50)); // allow state to propagate
            } else {
                toast({ title: "Unsaved Settings", description: "Please fix errors in quiz settings before selecting a slide.", variant: "destructive" });
                return;
            }
        }

        setCurrentSlideIndex(index);
        setViewMode('editor');
    }, [viewMode, currentSlideIndex, saveCurrentQuestionIfNeeded, setCurrentSlideIndex, setViewMode, formMethods, handleMetadataSubmit, updateQuizMetadata, toast]);

    const handleAddQuestionAndEdit = useCallback(async (type: QuestionHost['type'], isTrueFalseOverride: boolean = false) => {
        // Save settings if dirty and coming from settings view
        if (viewMode === 'settings' && formMethods.formState.isDirty) {
            const settingsValid = await formMethods.trigger();
            if (settingsValid) {
                handleMetadataSubmit(updateQuizMetadata)();
                await new Promise(resolve => setTimeout(resolve, 50)); // allow state to propagate
            } else {
                toast({ title: "Unsaved Settings", description: "Please fix errors in quiz settings before adding a slide.", variant: "destructive" });
                return;
            }
        }
        const newIndex = addQuestion(type, isTrueFalseOverride);
        setCurrentSlideIndex(newIndex);
        setViewMode('editor');
    }, [addQuestion, setCurrentSlideIndex, setViewMode, viewMode, formMethods, handleMetadataSubmit, updateQuizMetadata, toast]);

    const handleQuestionChange = useCallback((index: number, updatedQuestion: QuestionHost | null) => {
        if (updatedQuestion === null) {
            toast({ title: "Save Error", description: `Failed to save changes for Slide ${index + 1}.`, variant: "destructive" });
            return;
        }
        if (index >= 0) {
            updateQuestion(index, updatedQuestion);
        }
    }, [updateQuestion, toast]);

    const handleDeleteCurrentSlideConfirmed = useCallback(async () => {
        if (currentSlideIndex < 0) return;
        deleteQuestion(currentSlideIndex);
        toast({ title: "Slide Deleted", description: `Slide ${currentSlideIndex + 1} has been removed.` });
    }, [currentSlideIndex, deleteQuestion, toast]);

    const handleDuplicateCurrentSlideConfirmed = useCallback(async () => {
        if (currentSlideIndex < 0) {
            toast({ title: "Action Failed", description: "No slide selected to duplicate.", variant: "destructive" });
            return;
        }
        const canProceed = await saveCurrentQuestionIfNeeded();
        if (!canProceed) return;
        const newSlideIndex = duplicateQuestion(currentSlideIndex);
        if (viewMode !== 'editor') setViewMode('editor');
        toast({ title: "Slide Duplicated", description: `Slide ${currentSlideIndex + 1} (original) duplicated as new Slide ${newSlideIndex + 1}.` });
    }, [currentSlideIndex, duplicateQuestion, saveCurrentQuestionIfNeeded, toast, viewMode, setViewMode]);

    useEffect(() => {
        if (!quizData) return;
        const numQuestions = quizData.questions.length;
        if (numQuestions === 0 && viewMode === 'editor') {
            setViewMode('add-slide');
            setCurrentSlideIndex(-1);
        } else if (numQuestions > 0 && currentSlideIndex >= 0 && viewMode !== 'editor') {
            setViewMode('editor');
        } else if (numQuestions > 0 && currentSlideIndex === -1 && viewMode === 'editor') {
            setViewMode('settings');
        }
    }, [quizData?.questions.length, currentSlideIndex, viewMode, setViewMode, setCurrentSlideIndex]);


    const renderMainContentArea = () => {
        // This class is now applied to the right panel that holds these views
        const mainContentAreaClasses = "flex-grow overflow-y-auto custom-scrollbar-dark p-4 md:p-6 dark:bg-[var(--content-bg)]";

        switch (viewMode) {
            case 'settings':
                return (
                    <div className={cn(mainContentAreaClasses)}>
                        <QuizSettingsView />
                    </div>
                );
            case 'add-slide':
                return (
                    <div className={cn("flex flex-col", mainContentAreaClasses)}>
                        <AddSlideView onAddQuestion={handleAddQuestionAndEdit} onBackToSettings={handleSettingsClick} />
                    </div>
                );
            case 'editor':
                if (!quizData || currentSlideIndex === null || currentSlideIndex < 0 || !quizData.questions?.[currentSlideIndex]) {
                    if (quizData && quizData.questions.length === 0) {
                        return <div className={cn("flex-grow flex items-center justify-center text-muted-foreground italic", mainContentAreaClasses)}>No slides. Add one to get started!</div>;
                    }
                    return <div className={cn("flex-grow flex items-center justify-center text-muted-foreground italic", mainContentAreaClasses)}>Loading slide data or select a slide...</div>;
                }
                // QuestionEditorView itself now handles the internal structure (panel + config sidebar)
                // It no longer needs to be wrapped by the mainContentAreaClasses here as it will be the full right panel.
                return (
                    <QuestionEditorView
                        quizData={quizData}
                        currentSlideIndex={currentSlideIndex}
                        onSlideSelect={handleSlideSelect}
                        onQuestionChange={handleQuestionChange}
                        onConfirmDeleteSlide={handleDeleteCurrentSlideConfirmed}
                        onConfirmDuplicateSlide={handleDuplicateCurrentSlideConfirmed}
                        triggerSaveRef={triggerQuestionSaveRef}
                        className="flex-grow" // Allow QuestionEditorView to fill the right panel
                    />
                );
            default:
                return <div className={cn("flex-grow flex items-center justify-center", mainContentAreaClasses)}>Error: Invalid View State.</div>;
        }
    };

    if (!quizData && viewMode !== 'settings') {
        return (<QuizEditorLayout> <div className="flex-grow flex items-center justify-center">Loading Quiz Editor...</div> </QuizEditorLayout>);
    }

    return (
        <FormProvider {...formMethods}>
            <QuizEditorLayout>
                <QuizEditorHeader
                    quizTitle={watchedQuizTitle || quizData?.title || "Quiz Chưa Có Tên"} // Updated default title
                    onSave={handleSave}
                    onSettingsClick={handleSettingsClick} // Pass settings click handler
                    saveButtonLabel="Hoàn thành" // "Done" in Vietnamese
                    isSaving={isSaving}
                    showSettingsButton={true} // Explicitly show settings button
                />
                {/* Main layout: Sidebar + Main Content Area 
                    The entire height of QuizEditorLayout minus header should be available for this flex container.
                */}
                <div className="flex flex-grow overflow-hidden h-[calc(100vh-60px)]"> {/* Adjusted height for full viewport minus header */}
                    <SlideNavigationSidebar
                        slides={quizData?.questions ?? []}
                        currentSlideIndex={currentSlideIndex}
                        onSelectSlide={handleSlideSelect}
                        onAddSlide={handleAddSlideClick}
                    />
                    {/* The main content area (right panel) will be rendered by renderMainContentArea */}
                    {renderMainContentArea()}
                </div>
                {/* QuizEditorFooter is removed */}
            </QuizEditorLayout>
        </FormProvider>
    );
}