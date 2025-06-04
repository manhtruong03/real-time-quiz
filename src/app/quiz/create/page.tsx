// src/app/quiz/create/page.tsx
"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FormProvider } from 'react-hook-form';
import { useRouter } from 'next/navigation';

// Layout & UI
import QuizEditorLayout from '@/src/components/quiz-editor/layout/QuizEditorLayout';
import QuizEditorHeader from '@/src/components/quiz-editor/layout/QuizEditorHeader';
import SlideNavigationSidebar from '@/src/components/quiz-editor/sidebar/SlideNavigationSidebar';
import { useToast } from '@/src/hooks/use-toast';
import { QuizEditorContentArea } from '@/src/components/quiz-editor/QuizEditorContentArea'; // Import the new component

// Types & Hooks
import type { QuestionHost } from '@/src/lib/types/quiz-structure';
import { useQuizCreator } from '@/src/hooks/quiz-editor/useQuizCreator';
import { AuthApiError } from '@/src/lib/types/auth';
import { useQuizViewManager } from '@/src/hooks/quiz-editor/useQuizViewManager';

// API Utils
import { createQuiz } from '@/src/lib/api/quizzes';
import { cn } from '@/src/lib/utils'; //
import { Loader2 } from 'lucide-react';

export default function CreateQuizPage() {
    const triggerQuestionSaveRef = useRef<(() => Promise<boolean>) | null>(null);
    const { toast } = useToast(); //
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    const {
        quizData,
        currentSlideIndex,
        setCurrentSlideIndex,
        formMethods,
        handleMetadataSubmit,
        updateQuizMetadataDirectly,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        duplicateQuestion,
    } = useQuizCreator(); //

    const latestQuizDataRef = useRef(quizData);
    useEffect(() => {
        latestQuizDataRef.current = quizData;
    }, [quizData]);

    const {
        viewMode,
        setViewMode,
        navigateToSettings,
        navigateToAddSlide,
        navigateToEditorSlide,
    } = useQuizViewManager({ //
        initialQuizData: quizData,
        currentSlideIndex,
        setCurrentSlideIndex,
        saveCurrentQuestionIfNeeded: useCallback(async () => { //
            if (triggerQuestionSaveRef.current) {
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
        }, [currentSlideIndex, toast]),
        settingsFormMethods: formMethods, //
        updateQuizMetadata: updateQuizMetadataDirectly, //
    });

    const { watch } = formMethods; //
    const watchedQuizTitle = watch("title");

    const handleSaveQuiz = useCallback(async () => { //
        setIsSaving(true);
        const currentViewMode = viewMode;

        try {
            if (formMethods.formState.isDirty) {
                const settingsAreValid = await formMethods.trigger();
                if (settingsAreValid) {
                    await handleMetadataSubmit();
                    await new Promise(resolve => setTimeout(resolve, 50));
                } else {
                    toast({ title: "Validation Error", description: "Please fix errors in Quiz Settings before saving.", variant: "destructive" });
                    setIsSaving(false);
                    if (currentViewMode !== 'settings') setViewMode('settings');
                    return;
                }
            }

            if (currentViewMode === 'editor') {
                const questionSaveSuccess = await triggerQuestionSaveRef.current?.();
                if (!questionSaveSuccess) {
                    toast({ title: "Unsaved Changes", description: "Could not save the current slide. Please fix errors.", variant: "destructive" });
                    setIsSaving(false);
                    return;
                }
            }

            const currentQuizState = latestQuizDataRef.current;
            if (!currentQuizState) {
                throw new Error("Quiz data is missing.");
            }

            if (!currentQuizState.title || currentQuizState.title.trim().length < 3) {
                toast({ title: "Validation Error", description: "Quiz title must be at least 3 characters.", variant: "destructive" });
                setIsSaving(false);
                if (currentViewMode !== 'settings') setViewMode('settings');
                formMethods.setError("title", { type: "manual", message: "Quiz title must be at least 3 characters." });
                return;
            }
            if (!currentQuizState.questions || currentQuizState.questions.length === 0) {
                toast({ title: "Empty Quiz", description: "Your quiz has no slides. Please add at least one slide.", variant: "default" });
            }

            const savedQuiz = await createQuiz(currentQuizState); //
            toast({
                title: "Quiz Saved!",
                description: `Quiz "${savedQuiz.title}" has been saved successfully.`,
            });
            router.push(`/my-quizzes`);
        } catch (error: unknown) {
            let errorMessage = "An unexpected error occurred. Please try again.";
            let errorTitle = "Save Failed";
            if (error instanceof AuthApiError) { //
                errorTitle = `API Error (${error.status})`;
                errorMessage = error.message || errorMessage;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            toast({ title: errorTitle, description: errorMessage, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }, [
        viewMode,
        formMethods,
        handleMetadataSubmit,
        toast,
        router,
        setViewMode
    ]);

    const handleAddQuestionAndEdit = useCallback(async (type: QuestionHost['type'], isTrueFalseOverride: boolean = false) => { //
        if (viewMode === 'settings' && formMethods.formState.isDirty) {
            const settingsValid = await formMethods.trigger();
            if (settingsValid) {
                await handleMetadataSubmit();
                await new Promise(resolve => setTimeout(resolve, 50));
            } else {
                toast({ title: "Unsaved Settings", description: "Please fix errors in quiz settings before adding a slide.", variant: "destructive" });
                return;
            }
        }
        const newIndex = addQuestion(type, isTrueFalseOverride);
        setCurrentSlideIndex(newIndex);
        setViewMode('editor');
    }, [
        addQuestion,
        setCurrentSlideIndex,
        setViewMode,
        viewMode,
        formMethods,
        handleMetadataSubmit,
        toast
    ]);

    const handleQuestionChange = useCallback((index: number, updatedQuestion: QuestionHost | null) => { //
        if (updatedQuestion === null) {
            toast({ title: "Save Error", description: `Failed to save changes for Slide ${index + 1}.`, variant: "destructive" });
            return;
        }
        updateQuestion(index, updatedQuestion);
    }, [updateQuestion, toast]);

    const handleDeleteCurrentSlideConfirmed = useCallback(async () => { //
        if (currentSlideIndex < 0) return;
        const deletedIndex = currentSlideIndex;
        deleteQuestion(currentSlideIndex);
        toast({ title: "Slide Deleted", description: `Slide ${deletedIndex + 1} has been removed.` });
    }, [currentSlideIndex, deleteQuestion, toast]);

    const handleDuplicateCurrentSlideConfirmed = useCallback(async () => { //
        if (currentSlideIndex < 0) {
            toast({ title: "Action Failed", description: "No slide selected to duplicate.", variant: "destructive" });
            return;
        }
        const canProceed = await triggerQuestionSaveRef.current?.();
        if (!canProceed) return;

        const originalSlideIndexForToast = currentSlideIndex + 1;
        const newSlideIndex = duplicateQuestion(currentSlideIndex);
        setCurrentSlideIndex(newSlideIndex);
        setViewMode('editor');
        toast({ title: "Slide Duplicated", description: `Slide ${originalSlideIndexForToast} duplicated as new Slide ${newSlideIndex + 1}.` });
    }, [currentSlideIndex, duplicateQuestion, triggerQuestionSaveRef, toast, setViewMode, setCurrentSlideIndex]);


    if (!quizData && viewMode !== 'settings') { //
        return (
            <QuizEditorLayout>
                <QuizEditorHeader quizTitle="Loading Quiz..." isSaving={isSaving} />
                <div className="flex-grow flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading Quiz Editor...</span>
                </div>
            </QuizEditorLayout>
        );
    }

    return (
        <FormProvider {...formMethods}> {/* */}
            <QuizEditorLayout>
                <QuizEditorHeader
                    quizTitle={watchedQuizTitle || quizData?.title || "Quiz Chưa Có Tên"}
                    onSave={handleSaveQuiz}
                    onSettingsClick={navigateToSettings}
                    saveButtonLabel="Lưu Quiz"
                    isSaving={isSaving}
                    showSettingsButton={true}
                />
                <div className="flex flex-grow overflow-hidden h-[calc(100vh-60px)]">
                    <SlideNavigationSidebar
                        slides={quizData?.questions ?? []}
                        currentSlideIndex={currentSlideIndex}
                        onSelectSlide={navigateToEditorSlide}
                        onAddSlide={navigateToAddSlide}
                    />
                    <div className="flex-grow flex flex-col overflow-hidden">
                        {/* Use the new QuizEditorContentArea component */}
                        <QuizEditorContentArea
                            viewMode={viewMode}
                            quizData={quizData}
                            currentSlideIndex={currentSlideIndex}
                            onAddQuestionAndEdit={handleAddQuestionAndEdit}
                            onBackToSettings={navigateToSettings}
                            onNavigateToEditorSlide={navigateToEditorSlide}
                            onQuestionChange={handleQuestionChange}
                            onConfirmDeleteSlide={handleDeleteCurrentSlideConfirmed}
                            onConfirmDuplicateSlide={handleDuplicateCurrentSlideConfirmed}
                            triggerSaveRef={triggerQuestionSaveRef}
                        />
                    </div>
                </div>
            </QuizEditorLayout>
        </FormProvider>
    );
}