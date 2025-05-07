// src/app/quiz/create/page.tsx
"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FormProvider } from 'react-hook-form';
import QuizEditorLayout from '@/src/components/quiz-editor/layout/QuizEditorLayout';
import QuizEditorHeader from '@/src/components/quiz-editor/layout/QuizEditorHeader';
import QuizEditorFooter from '@/src/components/quiz-editor/layout/QuizEditorFooter';
import type { QuestionHost } from '@/src/lib/types/quiz-structure';
// View Components
import QuizSettingsView from '@/src/components/quiz-editor/views/QuizSettingsView';
import AddSlideView from '@/src/components/quiz-editor/views/AddSlideView';
import QuestionEditorView from '@/src/components/quiz-editor/views/QuestionEditorView';
import { Button } from '@/src/components/ui/button';
// Custom Hook for State Management
import { useQuizCreator } from '@/src/hooks/quiz-editor/useQuizCreator';
import { useToast } from '@/src/components/ui/use-toast';

type QuizEditorViewMode = 'settings' | 'add-slide' | 'editor';

export default function CreateQuizPage() {
    const [viewMode, setViewMode] = useState<QuizEditorViewMode>('settings');
    const triggerQuestionSaveRef = useRef<(() => Promise<boolean>) | null>(null);
    const { toast } = useToast();

    const {
        quizData,
        // setQuizData, // Prefer update functions from hook
        currentSlideIndex,
        setCurrentSlideIndex,
        formMethods, // RHF methods for Settings form
        updateQuizMetadata,
        handleMetadataSubmit,
        addQuestion, // Use this to add the question structure
        updateQuestion,
        deleteQuestion,
        duplicateQuestion,
        resetCreatorState, // If needed
    } = useQuizCreator();

    // Ref for latest data (useful for callbacks that might close over stale state)
    const latestQuizDataRef = useRef(quizData);
    useEffect(() => {
        latestQuizDataRef.current = quizData;
    }, [quizData]);

    // Function to save the currently edited question (if in editor view)
    const saveCurrentQuestionIfNeeded = useCallback(async (): Promise<boolean> => {
        // Only save if in editor and the trigger ref is set.
        // The QuestionEditorView's internal triggerSave will check its own form's isDirty state.
        if (viewMode === 'editor' && triggerQuestionSaveRef.current) {
            console.log(`[CreatePage saveCurrentQuestionIfNeeded] In editor mode. Triggering question save for index ${currentSlideIndex}`);
            // The QuestionEditorView's triggerSave should handle its own isDirty check.
            const success = await triggerQuestionSaveRef.current();
            if (!success) {
                toast({
                    title: "Unsaved Changes",
                    description: `Could not save Slide ${currentSlideIndex + 1} due to errors. Please fix them.`,
                    variant: "destructive",
                });
            }
            console.log(`[CreatePage saveCurrentQuestionIfNeeded] Question save success: ${success}`);
            return success;
        }
        console.log(`[CreatePage saveCurrentQuestionIfNeeded] No save needed for question (viewMode: ${viewMode}, ref: ${!!triggerQuestionSaveRef.current})`);
        return true; // Indicate success if no save was needed (e.g., not in editor mode)
    }, [viewMode, currentSlideIndex, triggerQuestionSaveRef, toast]); // Removed formMethods.formState.isDirty

    // Function to save the overall quiz (placeholder for API call)
    const handleSaveQuiz = useCallback(async () => {
        console.log('[CreatePage] handleSaveQuiz FINAL triggered.');
        let canProceed = true;

        // Save current view's state first
        if (viewMode === 'settings') {
            // Trigger RHF validation and update hook state
            const isValid = await formMethods.trigger();
            if (isValid) {
                handleMetadataSubmit(updateQuizMetadata)(); // Call the submit handler from the hook
            } else {
                canProceed = false;
                toast({ title: "Validation Error", description: "Please fix errors in settings.", variant: "destructive" });
            }

        } else if (viewMode === 'editor') {
            canProceed = await saveCurrentQuestionIfNeeded();
        }

        if (canProceed) {
            // --- Read the LATEST state from the ref ---
            const dataToSave = latestQuizDataRef.current;
            console.log("Current Quiz Data to Save (from Ref):", JSON.stringify(dataToSave, null, 2));
            // TODO: Send `dataToSave` to your backend API.
            toast({
                title: "Save Quiz (Mock)",
                description: "Quiz data logged to console. Backend integration needed.",
            });
        } else {
            console.error("[CreatePage] Cannot save quiz due to errors in the current view.");
            // Error toast is shown within saveCurrentQuestionIfNeeded or settings validation
        }
    }, [viewMode, saveCurrentQuestionIfNeeded, formMethods, handleMetadataSubmit, updateQuizMetadata, toast]); // Added formMethods and handlers


    // --- Combined handler for the main save button in the header ---
    const handleSave = useCallback(async () => {
        console.log('[CreatePage] Header Save Button Clicked.');
        await handleSaveQuiz(); // Just call the main save logic directly now
    }, [handleSaveQuiz]);

    // --- Navigation Handlers ---
    const handleAddSlideClick = useCallback(async () => {
        console.log('[CreatePage] Add Slide button clicked.');
        // If currently editing a slide, attempt to save it.
        // No need to save if not in editor mode (e.g., on settings or add-slide view already)
        if (viewMode === 'editor') {
            let canProceed = await saveCurrentQuestionIfNeeded();
            if (!canProceed) {
                console.log("[CreatePage] Add slide blocked by save failure of current slide.");
                return; // Stop if save failed
            }
        }
        setCurrentSlideIndex(-1); // Deselect current slide
        setViewMode('add-slide');
    }, [viewMode, saveCurrentQuestionIfNeeded, setCurrentSlideIndex, setViewMode]);

    const handleSettingsClick = useCallback(async () => {
        console.log('[CreatePage] Settings button clicked.');
        if (viewMode === 'editor') {
            let canProceed = await saveCurrentQuestionIfNeeded();
            if (!canProceed) {
                console.log("[CreatePage] Settings navigation blocked by save failure.");
                return;
            }
        }
        setCurrentSlideIndex(-1);
        setViewMode('settings');
    }, [viewMode, saveCurrentQuestionIfNeeded, setCurrentSlideIndex, setViewMode]);

    const handleSlideSelect = useCallback(async (index: number) => {
        console.log(`[CreatePage] Slide ${index} selected.`);
        if (index === currentSlideIndex && viewMode === 'editor') return; // Already on this slide

        if (viewMode === 'editor') {
            let canProceed = await saveCurrentQuestionIfNeeded();
            if (!canProceed) {
                console.log("[CreatePage] Slide selection blocked by save failure.");
                // Optionally, revert the visual selection in SlideNavigationSidebar if possible,
                // or simply block navigation and rely on the toast.
                return;
            }
        }
        setCurrentSlideIndex(index);
        setViewMode('editor');
    }, [viewMode, currentSlideIndex, saveCurrentQuestionIfNeeded, setCurrentSlideIndex, setViewMode]);


    const handleAddQuestionAndEdit = useCallback((type: QuestionHost['type'], isTrueFalseOverride: boolean = false) => {
        // No save needed here as we are leaving 'add-slide' view, not 'editor'
        console.log(`[CreatePage] Adding question type: ${type}, isTF: ${isTrueFalseOverride}`);
        const newIndex = addQuestion(type, isTrueFalseOverride);
        setCurrentSlideIndex(newIndex);
        setViewMode('editor');
    }, [addQuestion, setCurrentSlideIndex, setViewMode]);

    const handleQuestionChange = useCallback((index: number, updatedQuestion: QuestionHost | null) => {
        // ... same as before ...
        console.log('[CreatePage handleQuestionChange] CALLED for index:', index, 'with data:', updatedQuestion);
        if (updatedQuestion === null) {
            console.error(`[CreatePage] Received null update for question index ${index}. Save likely failed in child.`);
            toast({ title: "Save Error", description: `Failed to save changes for Slide ${index + 1}.`, variant: "destructive" });
            return;
        }
        if (index >= 0) {
            updateQuestion(index, updatedQuestion);
        }
    }, [updateQuestion, toast]);


    // --- <<< Phase D2: Handle Confirmed Deletion >>> ---
    const handleDeleteCurrentSlideConfirmed = useCallback(async () => {
        console.log(`[CreatePage] Confirmed delete for slide index: ${currentSlideIndex}`);
        if (currentSlideIndex < 0) {
            console.warn("[CreatePage] No slide selected to delete.");
            return;
        }

        // IMPORTANT: We are deleting the *current* slide.
        // We should NOT try to save it before deleting.
        // If other slides were dirty and the user confirms deletion, their state is implicitly accepted as is.

        deleteQuestion(currentSlideIndex); // This will update quizData and currentSlideIndex internally in the hook

        // After deletion, useQuizCreator's setCurrentSlideIndex will have updated the index.
        // We need to react to the new state of quizData and currentSlideIndex from the hook.
        // This will be handled by the useEffect below that watches quizData.questions.length and currentSlideIndex.

        toast({
            title: "Slide Deleted",
            description: `Slide ${currentSlideIndex + 1} has been removed.`,
        });

    }, [currentSlideIndex, deleteQuestion, toast, /* removed setCurrentSlideIndex, setViewMode */]);

    const handleDuplicateCurrentSlideConfirmed = useCallback(async () => {
        console.log(`[CreatePage] Confirmed duplicate for slide index: ${currentSlideIndex}`);
        if (currentSlideIndex < 0) {
            console.warn("[CreatePage] No slide selected to duplicate.");
            toast({ title: "Action Failed", description: "No slide selected to duplicate.", variant: "destructive" });
            return;
        }

        // 1. Save any pending changes on the current slide before duplicating it.
        const canProceed = await saveCurrentQuestionIfNeeded();
        if (!canProceed) {
            console.warn("[CreatePage] Duplication aborted: unsaved changes on the current slide could not be saved.");
            // Toast is shown by saveCurrentQuestionIfNeeded
            return;
        }

        // 2. Call the hook function to duplicate
        // The hook will update quizData and set currentSlideIndex to the new duplicate.
        const newSlideIndex = duplicateQuestion(currentSlideIndex);

        // 3. Ensure view mode is 'editor' to display the new duplicate.
        // The useEffect watching currentSlideIndex should also handle this, but setting explicitly is safer.
        if (viewMode !== 'editor') {
            setViewMode('editor');
        }
        // setCurrentSlideIndex is already handled by the duplicateQuestion hook.

        toast({
            title: "Slide Duplicated",
            description: `Slide ${currentSlideIndex + 1} (original) duplicated as new Slide ${newSlideIndex + 1}.`,
        });

    }, [currentSlideIndex, duplicateQuestion, saveCurrentQuestionIfNeeded, toast, viewMode, setViewMode]);

    // Effect to handle view mode changes after slide deletion or when all slides are gone
    useEffect(() => {
        if (!quizData) return;

        const numQuestions = quizData.questions.length;
        if (numQuestions === 0 && viewMode === 'editor') {
            console.log("[CreatePage Effect] No questions left, switching to add-slide view.");
            setViewMode('add-slide');
            setCurrentSlideIndex(-1); // Ensure index is reset
        } else if (numQuestions > 0 && currentSlideIndex >= 0 && viewMode !== 'editor') {
            // If we have slides and a valid index, but not in editor (e.g., after deleting the last one and index became 0)
            console.log(`[CreatePage Effect] Questions exist and index is ${currentSlideIndex}, ensuring editor view.`);
            setViewMode('editor');
        } else if (numQuestions > 0 && currentSlideIndex === -1 && viewMode === 'editor') {
            // This case might occur if deleteQuestion set index to -1 temporarily but questions remain
            // It's better if deleteQuestion always sets a valid index if questions remain.
            // For now, if this happens, switch to settings to avoid broken editor.
            console.warn("[CreatePage Effect] Index is -1 but questions exist, switching to settings view.");
            setViewMode('settings');
        }

    }, [quizData?.questions.length, currentSlideIndex, viewMode, setViewMode, setCurrentSlideIndex]);


    const handlePreview = useCallback(() => { /* ... */ }, [toast]);

    const renderMainContent = () => {
        switch (viewMode) {
            case 'settings':
                return <QuizSettingsView />;
            case 'add-slide':
                return (<AddSlideView onAddQuestion={handleAddQuestionAndEdit} onBackToSettings={handleSettingsClick} />);
            case 'editor':
                if (!quizData || currentSlideIndex === null || currentSlideIndex < 0 || !quizData.questions?.[currentSlideIndex]) {
                    // If no questions exist after a deletion and currentSlideIndex is -1, the useEffect above should switch view.
                    // This return is a fallback.
                    if (quizData && quizData.questions.length === 0) {
                        // This state should ideally be caught by the useEffect to change viewMode
                        return <div className="flex-grow flex items-center justify-center text-muted-foreground italic p-4">No slides. Add one to get started!</div>;
                    }
                    return <div className="flex-grow flex items-center justify-center text-muted-foreground italic p-4">Loading slide data or select a slide...</div>;
                }
                return (<QuestionEditorView
                    quizData={quizData}
                    currentSlideIndex={currentSlideIndex}
                    onSlideSelect={handleSlideSelect}
                    onQuestionChange={handleQuestionChange}
                    onConfirmDeleteSlide={handleDeleteCurrentSlideConfirmed} // <<< Pass down
                    onConfirmDuplicateSlide={handleDuplicateCurrentSlideConfirmed}
                    triggerSaveRef={triggerQuestionSaveRef}
                />);
            default:
                return <div className="flex-grow flex items-center justify-center">Error: Invalid View State.</div>;
        }
    };

    if (!quizData && viewMode !== 'settings') {
        return (<QuizEditorLayout> <div className="flex-grow flex items-center justify-center">Loading Quiz Editor...</div> </QuizEditorLayout>);
    }

    return (
        <FormProvider {...formMethods}>
            <QuizEditorLayout>
                <QuizEditorHeader
                    onSave={handleSave}
                    onPreview={handlePreview}
                    saveButtonLabel={viewMode === 'settings' ? 'Done' : (quizData?.questions.length === 0 ? 'Add Slide' : 'Save Quiz')}
                />
                <main className="flex-grow flex flex-col overflow-hidden">
                    {renderMainContent()}
                </main>
                <QuizEditorFooter
                    onSettingsClick={handleSettingsClick}
                    onAddSlideClick={handleAddSlideClick}
                    showNavigator={viewMode !== 'add-slide' && quizData !== null && quizData.questions.length > 0}
                    showAddButton={viewMode !== 'add-slide'}
                    showSettingsButton={true}
                >
                    {viewMode !== 'add-slide' && latestQuizDataRef.current && (
                        <div className="text-sm text-muted-foreground truncate px-2">
                            {currentSlideIndex === -1 && viewMode === 'settings'
                                ? "Quiz Settings"
                                : currentSlideIndex === -1 && latestQuizDataRef.current?.questions.length === 0
                                    ? "No Slides"
                                    : currentSlideIndex === -1
                                        ? "Quiz Settings" // Fallback if index is -1 but not in settings (e.g. after all deleted)
                                        : `Slide ${currentSlideIndex + 1} / ${latestQuizDataRef.current?.questions.length ?? 0}`}
                        </div>
                    )}
                </QuizEditorFooter>
            </QuizEditorLayout>
        </FormProvider>
    );
}