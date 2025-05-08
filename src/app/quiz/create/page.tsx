// src/app/quiz/create/page.tsx
"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FormProvider } from 'react-hook-form';
import { useRouter } from 'next/navigation';

// Layout & UI
import QuizEditorLayout from '@/src/components/quiz-editor/layout/QuizEditorLayout';
import QuizEditorHeader from '@/src/components/quiz-editor/layout/QuizEditorHeader';
import QuizEditorFooter from '@/src/components/quiz-editor/layout/QuizEditorFooter';
import { Button } from '@/src/components/ui/button';
import { useToast } from '@/src/components/ui/use-toast';

// Views
import QuizSettingsView from '@/src/components/quiz-editor/views/QuizSettingsView';
import AddSlideView from '@/src/components/quiz-editor/views/AddSlideView';
import QuestionEditorView from '@/src/components/quiz-editor/views/QuestionEditorView';

// Types & Hooks
import type { QuestionHost } from '@/src/lib/types/quiz-structure';
import { useQuizCreator } from '@/src/hooks/quiz-editor/useQuizCreator';
import type { QuizDTO } from '@/src/lib/types/api'; // <-- Import API DTO type
import { AuthApiError } from '@/src/lib/types/auth'; // <-- Import custom error type

// API Utils
import { createQuiz } from '@/src/lib/api/quizzes'; // <-- Import createQuiz function
import { transformQuizStateToDTO } from '@/src/lib/api-utils/quiz-transformer'; // <-- Import transformer
import { QuizVisibilityEnum } from '@/src/lib/schemas/quiz-settings.schema';

type QuizEditorViewMode = 'settings' | 'add-slide' | 'editor';

export default function CreateQuizPage() {
    const [viewMode, setViewMode] = useState<QuizEditorViewMode>('settings');
    const triggerQuestionSaveRef = useRef<(() => Promise<boolean>) | null>(null);
    const { toast } = useToast();
    const router = useRouter(); // <-- Initialize router

    // Add saving state
    const [isSaving, setIsSaving] = useState(false);

    const {
        quizData,
        currentSlideIndex,
        setCurrentSlideIndex,
        formMethods, // RHF methods for Settings form
        updateQuizMetadata,
        handleMetadataSubmit,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        duplicateQuestion,
        resetCreatorState,
    } = useQuizCreator();
    // Destructure for easier access, especially formState
    const { reset: resetForm, formState: settingsFormState } = formMethods;

    const latestQuizDataRef = useRef(quizData);
    useEffect(() => {
        latestQuizDataRef.current = quizData;
    }, [quizData]);

    // --- REVISED useEffect Hook for Settings Form Reset ---
    useEffect(() => {
        // Only reset the form values IF THE FORM IS NOT DIRTY.
        // This prevents overwriting the user's unsaved changes in the settings form
        // when the underlying quizData changes due to other actions (e.g., saving a question).
        if (!settingsFormState.isDirty) {
            console.log("[CreatePage useEffect] Settings form NOT dirty, resetting form to match central quizData state.");
            resetForm({
                // Explicitly provide values, defaulting if needed
                title: quizData.title ?? "",
                description: quizData.description ?? "",
                visibility:
                    quizData.visibility === 1
                        ? QuizVisibilityEnum.enum.PUBLIC
                        : QuizVisibilityEnum.enum.PRIVATE,
                tags: (quizData as any).tags ?? [], // Use default empty array if tags don't exist
                cover: quizData.cover ?? null,     // Use null if cover doesn't exist
            }, {
                keepDefaultValues: false, // Use these values as the new "default" for isDirty comparison
                keepDirty: false,        // Ensure isDirty is reset to false after this programmatic reset
                keepErrors: false,       // Clear any previous errors
            });
        } else {
            console.log("[CreatePage useEffect] Settings form IS dirty, skipping form reset to preserve user edits.");
        }

        // Dependencies that should trigger this check.
        // Note: We depend on the *values* from quizData, not the object reference itself,
        // to avoid re-running unnecessarily if only e.g. questions changed.
        // We *also* need settingsFormState.isDirty to decide *whether* to reset.
    }, [
        quizData.title,
        quizData.description,
        quizData.visibility,
        quizData.cover,
        // quizData.tags, // Uncomment if/when tags are added to QuizStructureHost
        resetForm,
        settingsFormState.isDirty // Add isDirty here
    ]);

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

    // --- REVISED: handleSaveQuiz - Consolidate state updates before API call ---
    const handleSaveQuiz = useCallback(async () => {
        console.log('[CreatePage] handleSaveQuiz FINAL triggered.');
        setIsSaving(true); // Start saving indicator

        try {
            // Step 1: Check and save Settings Form if dirty and valid
            if (formMethods.formState.isDirty) {
                console.log("[CreatePage handleSaveQuiz] Settings form is dirty. Validating and saving settings...");
                const settingsAreValid = await formMethods.trigger();
                if (settingsAreValid) {
                    handleMetadataSubmit(updateQuizMetadata)(); // Update central state
                    // Allow state update to propagate AFTER settings save
                    await new Promise(resolve => setTimeout(resolve, 50));
                    console.log("[CreatePage handleSaveQuiz] Settings state updated.");
                } else {
                    toast({ title: "Validation Error", description: "Please fix errors in Quiz Settings before saving.", variant: "destructive" });
                    throw new Error("Settings validation failed."); // Stop save process
                }
            } else {
                console.log("[CreatePage handleSaveQuiz] Settings form not dirty. Skipping settings save.");
            }

            // Step 2: Check and save current Question if in editor view
            // Note: saveCurrentQuestionIfNeeded already includes a delay on success
            if (viewMode === 'editor') {
                console.log("[CreatePage handleSaveQuiz] In editor view. Saving current question if needed...");
                const questionSaveSuccess = await saveCurrentQuestionIfNeeded();
                if (!questionSaveSuccess) {
                    throw new Error("Failed to save current question. Please fix errors."); // Stop save process
                }
                console.log("[CreatePage handleSaveQuiz] Current question saved (or no save needed).");
            }

            // Step 3: Get latest state and transform
            // State should now be up-to-date with any committed changes from steps 1 & 2
            const currentQuizState = latestQuizDataRef.current;
            if (!currentQuizState) {
                throw new Error("Quiz data is not available after updates.");
            }

            console.log("Current Quiz Data before transformation:", JSON.stringify(currentQuizState, null, 2));
            const quizPayload = transformQuizStateToDTO(currentQuizState);
            console.log("Transformed Quiz DTO for API:", JSON.stringify(quizPayload, null, 2));

            // Step 4: Frontend Payload Validation
            if (!quizPayload.title || quizPayload.title.trim().length < 3) {
                toast({ title: "Validation Error", description: "Quiz title must be at least 3 characters.", variant: "destructive" });
                throw new Error("Quiz title validation failed");
            }
            if (!quizPayload.questions || quizPayload.questions.length === 0) {
                toast({ title: "Validation Error", description: "Quiz must have at least one slide.", variant: "destructive" });
                throw new Error("Quiz questions validation failed");
            }
            // ... (add more checks if needed)

            // Step 5: Call API
            // TODO: Add update logic check based on currentQuizState.uuid
            console.log("[CreatePage handleSaveQuiz] Calling createQuiz API...");
            const savedQuiz = await createQuiz(quizPayload);

            // Step 6: Handle Success
            toast({
                title: "Quiz Saved!",
                description: `Quiz "${savedQuiz.title}" saved successfully.`,
            });
            router.push(`/my-quizzes`); // Redirect

        } catch (error: unknown) {
            // Step 7: Handle Errors
            console.error("[CreatePage] Error during save process:", error);
            let errorMessage = "An unexpected error occurred. Please try again.";
            let errorTitle = "Save Failed";

            // ... (refined error handling logic from previous step) ...
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
                // Check specific error messages if needed
                if (errorMessage.includes("validation failed")) errorTitle = "Validation Error";
                else if (errorMessage.includes("Failed to save current question")) errorTitle = "Unsaved Changes";
            }

            toast({
                title: errorTitle,
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsSaving(false); // Stop saving indicator
        }
    }, [
        viewMode, // Need viewMode to know if we should save the question
        currentSlideIndex, // Needed by saveCurrentQuestionIfNeeded indirectly
        saveCurrentQuestionIfNeeded,
        formMethods, // Need formMethods for settings form state
        handleMetadataSubmit,
        updateQuizMetadata,
        toast,
        router,
    ]);


    // --- Combined handler for the main save button in the header ---
    const handleSave = useCallback(async () => {
        console.log('[CreatePage] Header Save Button Clicked.');
        await handleSaveQuiz(); // Just call the main save logic directly now
    }, [handleSaveQuiz]);

    // --- Navigation Handlers ---
    const handleAddSlideClick = useCallback(async () => {
        console.log('[CreatePage] Add Slide button clicked.');
        // Only save current question if in editor mode
        if (viewMode === 'editor') {
            const canProceed = await saveCurrentQuestionIfNeeded();
            if (!canProceed) {
                console.log("[CreatePage] Navigation to Add Slide blocked by question save failure.");
                return; // Stop if save failed
            }
        }
        // No longer save settings here
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
        if (index === currentSlideIndex && viewMode === 'editor') return;
        if (viewMode === 'editor') {
            const canProceed = await saveCurrentQuestionIfNeeded();
            if (!canProceed) return;
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
                    isSaving={isSaving}
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
                            { /* ... footer text logic ... */}
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