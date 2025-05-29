// src/app/quiz/create/page.tsx
"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FormProvider } from 'react-hook-form';
import { useRouter } from 'next/navigation';

// Layout & UI
import QuizEditorLayout from '@/src/components/quiz-editor/layout/QuizEditorLayout';
import QuizEditorHeader from '@/src/components/quiz-editor/layout/QuizEditorHeader';
import SlideNavigationSidebar from '@/src/components/quiz-editor/sidebar/SlideNavigationSidebar';
import { useToast } from '@/src/components/ui/use-toast';

// Views
import QuizSettingsView from '@/src/components/quiz-editor/views/QuizSettingsView';
import AddSlideView from '@/src/components/quiz-editor/views/AddSlideView';
import QuestionEditorView from '@/src/components/quiz-editor/views/QuestionEditorView'; // Import

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
import { Loader2 } from 'lucide-react';

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
        handleMetadataSubmit, // RHF's handleSubmit for settings form
        addQuestion,
        updateQuestion,
        deleteQuestion,
        duplicateQuestion,
        resetCreatorState,
    } = useQuizCreator();
    const { reset: resetForm, formState: settingsFormState, watch } = formMethods;

    const watchedQuizTitle = watch("title"); // Watch title from settings form for the header

    const latestQuizDataRef = useRef(quizData);
    useEffect(() => {
        latestQuizDataRef.current = quizData;
    }, [quizData]);

    // Effect to reset settings form if quizData changes and form is not dirty
    useEffect(() => {
        if (!settingsFormState.isDirty && quizData) { // Ensure quizData exists
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
                keepDefaultValues: false, // Important: use new defaults
                keepDirty: false,
                keepErrors: false,
            });
        }
    }, [
        quizData?.title, // Add optional chaining as quizData can be null
        quizData?.description,
        quizData?.visibility,
        quizData?.cover,
        (quizData as any)?.tags,
        resetForm,
        settingsFormState.isDirty,
        quizData, // Add quizData itself as dependency
    ]);


    const saveCurrentQuestionIfNeeded = useCallback(async (): Promise<boolean> => {
        if (viewMode === 'editor' && triggerQuestionSaveRef.current) {
            console.log("[CreatePage] Attempting to save current question...");
            const success = await triggerQuestionSaveRef.current();
            if (!success) {
                toast({
                    title: "Unsaved Changes",
                    description: `Could not save Slide ${currentSlideIndex + 1} due to errors. Please fix them.`,
                    variant: "destructive",
                });
                console.log("[CreatePage] Current question save FAILED.");
            } else {
                console.log("[CreatePage] Current question saved successfully or no changes needed.");
            }
            return success;
        }
        console.log("[CreatePage] No current question to save or not in editor mode.");
        return true;
    }, [viewMode, currentSlideIndex, triggerQuestionSaveRef, toast]);


    const handleSaveQuiz = useCallback(async () => {
        setIsSaving(true);
        console.log("[CreatePage] handleSaveQuiz called. Current Quiz Title from watch:", watchedQuizTitle);
        console.log("[CreatePage] Current RHF settings form state:", formMethods.getValues());

        try {
            // Save quiz settings if dirty
            if (formMethods.formState.isDirty) {
                console.log("[CreatePage] Settings form is dirty, triggering validation and save...");
                const settingsAreValid = await formMethods.trigger();
                if (settingsAreValid) {
                    // Use RHF's handleSubmit which calls our updateQuizMetadata on success
                    await handleMetadataSubmit(updateQuizMetadata)();
                    // Allow state to propagate from useQuizCreator after settings update
                    await new Promise(resolve => setTimeout(resolve, 50));
                    console.log("[CreatePage] Quiz settings saved/updated in useQuizCreator.");
                } else {
                    toast({ title: "Validation Error", description: "Please fix errors in Quiz Settings before saving.", variant: "destructive" });
                    throw new Error("Settings validation failed.");
                }
            } else {
                console.log("[CreatePage] Settings form not dirty, skipping settings save.");
            }

            // Save current question if in editor mode
            if (viewMode === 'editor') {
                const questionSaveSuccess = await saveCurrentQuestionIfNeeded();
                if (!questionSaveSuccess) {
                    throw new Error("Failed to save current question. Please fix errors.");
                }
            }

            // Ensure quizData is up-to-date after potential updates
            const currentQuizState = latestQuizDataRef.current;

            if (!currentQuizState) {
                console.error("[CreatePage] Quiz data is not available after potential updates.");
                throw new Error("Quiz data is missing.");
            }

            const quizPayload = transformQuizStateToDTO(currentQuizState);
            console.log("[CreatePage] Transformed QuizDTO for API:", JSON.stringify(quizPayload, null, 2));


            if (!quizPayload.title || quizPayload.title.trim().length < 3) {
                toast({ title: "Validation Error", description: "Quiz title must be at least 3 characters.", variant: "destructive" });
                throw new Error("Quiz title validation failed");
            }
            if (!quizPayload.questions || quizPayload.questions.length === 0) {
                toast({ title: "Empty Quiz", description: "Your quiz has no slides. Please add at least one slide.", variant: "default" });
                // Decide if you want to prevent saving empty quizzes. For now, allowing.
                // throw new Error("Quiz must have at least one slide.");
            }

            const savedQuiz = await createQuiz(quizPayload); // Assuming createQuiz handles both create/update
            toast({
                title: "Quiz Saved!",
                description: `Quiz "${savedQuiz.title}" has been saved successfully.`,
            });
            router.push(`/my-quizzes`); // Redirect to my-quizzes page
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
        formMethods, // includes trigger, getValues, formState
        handleMetadataSubmit, // RHF's handleSubmit from formMethods
        updateQuizMetadata,
        toast,
        router,
        watchedQuizTitle, // To log
    ]);


    const handleAddSlideClick = useCallback(async () => {
        if (viewMode === 'editor') {
            const canProceed = await saveCurrentQuestionIfNeeded();
            if (!canProceed) return;
        }
        if (formMethods.formState.isDirty && viewMode === 'settings') {
            const settingsValid = await formMethods.trigger();
            if (settingsValid) {
                await handleMetadataSubmit(updateQuizMetadata)();
                await new Promise(resolve => setTimeout(resolve, 50));
            } else {
                toast({ title: "Unsaved Settings", description: "Please fix errors in quiz settings before adding a slide.", variant: "destructive" });
                return;
            }
        }
        setCurrentSlideIndex(-1); // Ensure no slide is "active" when showing AddSlideView
        setViewMode('add-slide');
    }, [viewMode, saveCurrentQuestionIfNeeded, setCurrentSlideIndex, setViewMode, formMethods, handleMetadataSubmit, updateQuizMetadata, toast]);

    const handleSettingsClick = useCallback(async () => {
        if (viewMode === 'editor') {
            const canProceed = await saveCurrentQuestionIfNeeded();
            if (!canProceed) return;
        }
        setCurrentSlideIndex(-1); // No specific slide is active in settings view
        setViewMode('settings');
    }, [viewMode, saveCurrentQuestionIfNeeded, setCurrentSlideIndex, setViewMode]);

    const handleSlideSelect = useCallback(async (index: number) => {
        if (index === currentSlideIndex && viewMode === 'editor') return;

        if (viewMode === 'editor') {
            const canProceedFromEditor = await saveCurrentQuestionIfNeeded();
            if (!canProceedFromEditor) return;
        }
        if (viewMode === 'settings' && formMethods.formState.isDirty) {
            const settingsValid = await formMethods.trigger();
            if (settingsValid) {
                await handleMetadataSubmit(updateQuizMetadata)();
                await new Promise(resolve => setTimeout(resolve, 50));
            } else {
                toast({ title: "Unsaved Settings", description: "Please fix errors in quiz settings before selecting a slide.", variant: "destructive" });
                return;
            }
        }
        setCurrentSlideIndex(index);
        setViewMode('editor');
    }, [viewMode, currentSlideIndex, saveCurrentQuestionIfNeeded, setCurrentSlideIndex, setViewMode, formMethods, handleMetadataSubmit, updateQuizMetadata, toast]);


    const handleAddQuestionAndEdit = useCallback(async (type: QuestionHost['type'], isTrueFalseOverride: boolean = false) => {
        if (viewMode === 'settings' && formMethods.formState.isDirty) {
            const settingsValid = await formMethods.trigger();
            if (settingsValid) {
                await handleMetadataSubmit(updateQuizMetadata)();
                await new Promise(resolve => setTimeout(resolve, 50));
            } else {
                toast({ title: "Unsaved Settings", description: "Please fix errors in quiz settings before adding a slide.", variant: "destructive" });
                return;
            }
        }
        const newIndex = addQuestion(type, isTrueFalseOverride);
        setCurrentSlideIndex(newIndex); // This should make QuestionEditorView pick up the new slide
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
        if (currentSlideIndex < 0) return; // No slide selected
        // No need to save current question before deleting it.
        const deletedIndex = currentSlideIndex; // Store before state changes
        deleteQuestion(currentSlideIndex); // This updates currentSlideIndex internally in useQuizCreator if needed
        toast({ title: "Slide Deleted", description: `Slide ${deletedIndex + 1} has been removed.` });
        // viewMode will be handled by the useEffect below based on quizData.questions.length and new currentSlideIndex
    }, [currentSlideIndex, deleteQuestion, toast, setCurrentSlideIndex, setViewMode]);


    const handleDuplicateCurrentSlideConfirmed = useCallback(async () => {
        if (currentSlideIndex < 0) {
            toast({ title: "Action Failed", description: "No slide selected to duplicate.", variant: "destructive" });
            return;
        }
        const canProceed = await saveCurrentQuestionIfNeeded(); // Save current slide before duplicating
        if (!canProceed) return;

        const originalSlideIndexForToast = currentSlideIndex + 1;
        const newSlideIndex = duplicateQuestion(currentSlideIndex); // This sets currentSlideIndex to newSlideIndex
        setViewMode('editor'); // Ensure we are in editor view for the new duplicated slide
        toast({ title: "Slide Duplicated", description: `Slide ${originalSlideIndexForToast} duplicated as new Slide ${newSlideIndex + 1}.` });
    }, [currentSlideIndex, duplicateQuestion, saveCurrentQuestionIfNeeded, toast, setViewMode]);

    // Effect to manage viewMode based on quizData and currentSlideIndex
    useEffect(() => {
        if (!quizData) return; // Initial load or error
        const numQuestions = quizData.questions.length;

        if (viewMode === 'editor' && currentSlideIndex === -1) {
            // If in editor mode but no slide is selected (e.g., after deletion of last slide)
            if (numQuestions > 0) {
                setCurrentSlideIndex(0); // Select first slide if available
                // viewMode remains 'editor'
            } else {
                setViewMode('add-slide'); // No slides left, go to add-slide
            }
        } else if (viewMode !== 'settings' && viewMode !== 'add-slide' && numQuestions === 0) {
            // If not in settings/add-slide and no questions exist, switch to add-slide
            setViewMode('add-slide');
            setCurrentSlideIndex(-1);
        }
    }, [quizData?.questions.length, currentSlideIndex, viewMode, setCurrentSlideIndex, setViewMode, quizData]);


    const renderMainContentArea = () => {
        const mainContentAreaClasses = "flex-grow overflow-y-auto custom-scrollbar-dark dark:bg-[var(--editor-content-bg)]";

        switch (viewMode) {
            case 'settings':
                return (
                    <div className={cn(mainContentAreaClasses, "p-4 md:p-6")}> {/* Add padding for settings view */}
                        <QuizSettingsView />
                    </div>
                );
            case 'add-slide':
                return (
                    <div className={cn("flex flex-col", mainContentAreaClasses, "p-4 md:p-6")}> {/* Add padding */}
                        <AddSlideView onAddQuestion={handleAddQuestionAndEdit} onBackToSettings={handleSettingsClick} />
                    </div>
                );
            case 'editor':
                // QuestionEditorView now handles its own internal structure (panel + config sidebar)
                // It needs to be a direct child of the flex container in the main layout
                return (
                    <QuestionEditorView
                        quizData={quizData}
                        currentSlideIndex={currentSlideIndex}
                        onSlideSelect={handleSlideSelect} // For potential internal nav within editor if needed
                        onQuestionChange={handleQuestionChange}
                        onConfirmDeleteSlide={handleDeleteCurrentSlideConfirmed}
                        onConfirmDuplicateSlide={handleDuplicateCurrentSlideConfirmed}
                        triggerSaveRef={triggerQuestionSaveRef}
                        className="flex-grow" // Allow QuestionEditorView to fill its allocated space
                    />
                );
            default:
                return <div className={cn("flex-grow flex items-center justify-center", mainContentAreaClasses)}>Error: Invalid View State.</div>;
        }
    };

    // Initial loading state for the page itself if quizData is essential from the start
    if (!quizData && viewMode !== 'settings') { // Allow settings view even if quizData is briefly null
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
        // FormProvider for Quiz Settings form
        <FormProvider {...formMethods}>
            <QuizEditorLayout>
                <QuizEditorHeader
                    quizTitle={watchedQuizTitle || quizData?.title || "Quiz Chưa Có Tên"}
                    onSave={handleSaveQuiz} // Changed from handleSave to handleSaveQuiz
                    onSettingsClick={handleSettingsClick}
                    saveButtonLabel="Lưu Quiz" // "Done" in Vietnamese
                    isSaving={isSaving}
                    showSettingsButton={true}
                />
                {/* Main layout: Sidebar + Main Content Area */}
                <div className="flex flex-grow overflow-hidden h-[calc(100vh-60px)]"> {/* Adjusted height */}
                    <SlideNavigationSidebar
                        slides={quizData?.questions ?? []}
                        currentSlideIndex={currentSlideIndex}
                        onSelectSlide={handleSlideSelect}
                        onAddSlide={handleAddSlideClick}
                    // Style will be handled by the component itself based on screen-08
                    />
                    {/* This container will hold either SettingsContentLayout, AddSlideView, or QuestionEditorView (which now includes its own right sidebar) */}
                    <div className="flex-grow flex flex-col overflow-hidden"> {/* Added flex-col and overflow-hidden */}
                        {renderMainContentArea()}
                    </div>
                </div>
            </QuizEditorLayout>
        </FormProvider>
    );
}