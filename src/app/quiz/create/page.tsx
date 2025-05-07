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
        let canProceed = await saveCurrentQuestionIfNeeded();
        if (canProceed) {
            setCurrentSlideIndex(-1); // Deselect current slide
            setViewMode('add-slide'); // Switch view
        } else { console.log("[CreatePage] Add slide blocked by save failure."); }
    }, [saveCurrentQuestionIfNeeded, setCurrentSlideIndex, setViewMode]);

    const handleSettingsClick = useCallback(async () => {
        console.log('[CreatePage] Settings button clicked.');
        let canProceed = await saveCurrentQuestionIfNeeded();
        if (canProceed) {
            setCurrentSlideIndex(-1);
            setViewMode('settings');
        } else { console.log("[CreatePage] Settings navigation blocked by save failure."); }
    }, [saveCurrentQuestionIfNeeded, setCurrentSlideIndex, setViewMode]);


    const handleSlideSelect = useCallback(async (index: number) => {
        console.log(`[CreatePage] Slide ${index} selected.`);
        if (index === currentSlideIndex && viewMode === 'editor') return;

        let canProceed = await saveCurrentQuestionIfNeeded();
        if (canProceed) {
            setCurrentSlideIndex(index);
            setViewMode('editor');
        } else {
            console.log("[CreatePage] Slide selection blocked by save failure.");
        }
    }, [currentSlideIndex, viewMode, saveCurrentQuestionIfNeeded, setCurrentSlideIndex, setViewMode]);


    // --- Handler for adding a question and switching to editor ---
    // --- This now directly sets the state ---
    const handleAddQuestionAndEdit = useCallback((type: QuestionHost['type'], isTrueFalseOverride: boolean = false) => {
        console.log(`[CreatePage] Adding question type: ${type}, isTF: ${isTrueFalseOverride}`);
        // 1. Add question structure to state (triggers quizData update)
        const newIndex = addQuestion(type, isTrueFalseOverride);
        console.log(`[CreatePage] Question added at index: ${newIndex}. Switching view to editor.`);
        // 2. Set current index and view mode immediately
        setCurrentSlideIndex(newIndex);
        setViewMode('editor');
    }, [addQuestion, setCurrentSlideIndex, setViewMode]);


    // --- Callback for when QuestionEditorView saves changes ---
    const handleQuestionChange = useCallback((index: number, updatedQuestion: QuestionHost | null) => {
        if (updatedQuestion === null) {
            console.error(`[CreatePage] Received null update for question index ${index}. Save likely failed in child.`);
            toast({ title: "Save Error", description: `Failed to save changes for Slide ${index + 1}.`, variant: "destructive" });
            return;
        }
        if (index >= 0) {
            // Call the update function from the hook
            updateQuestion(index, updatedQuestion);
        }
    }, [updateQuestion, toast]);

    // --- Preview Handler ---
    const handlePreview = useCallback(() => {
        toast({ title: "Preview", description: "Preview function not implemented." });
        console.log('[CreatePage] Preview button clicked (Not Implemented)')
    }, [toast]);


    // --- Rendering Logic ---
    const renderMainContent = () => {
        switch (viewMode) {
            case 'settings':
                // Settings view uses the formMethods from useQuizCreator directly
                return <QuizSettingsView />;
            case 'add-slide':
                // Pass the direct state update handler
                return (<AddSlideView onAddQuestion={handleAddQuestionAndEdit} onBackToSettings={handleSettingsClick} />);
            case 'editor':
                // Guard against rendering editor without valid data/index
                if (!quizData || currentSlideIndex === null || currentSlideIndex < 0 || !quizData.questions?.[currentSlideIndex]) {
                    console.log(`[RenderMainContent EDITOR] Waiting for data. Index: ${currentSlideIndex}, Question Exists: ${!!quizData?.questions[currentSlideIndex]}`);
                    return <div className="flex-grow flex items-center justify-center text-muted-foreground italic p-4">Loading slide data...</div>;
                }
                // Render editor view, passing necessary props
                return (<QuestionEditorView
                    quizData={quizData}
                    currentSlideIndex={currentSlideIndex}
                    onSlideSelect={handleSlideSelect}
                    onQuestionChange={handleQuestionChange} // Pass callback for updates
                    triggerSaveRef={triggerQuestionSaveRef} // Pass ref for saving
                />);
            default:
                return <div className="flex-grow flex items-center justify-center">Error: Invalid View State.</div>;
        }
    };

    // Check if main quiz data is loading (optional)
    if (!quizData && viewMode !== 'settings') {
        return (<QuizEditorLayout> <div className="flex-grow flex items-center justify-center">Loading Quiz Editor...</div> </QuizEditorLayout>);
    }

    return (
        // Provide the form context for the Settings view
        <FormProvider {...formMethods}>
            <QuizEditorLayout>
                <QuizEditorHeader
                    onSave={handleSave} // Use combined save handler
                    onPreview={handlePreview}
                    saveButtonLabel={viewMode === 'settings' ? 'Done' : 'Save Quiz'}
                />
                {/* Conditional rendering based on viewMode */}
                {viewMode === 'settings' ? (
                    // Settings form is handled by RHF context, no explicit <form> needed here if button is in header
                    <div className="flex-grow flex flex-col overflow-hidden">
                        {renderMainContent()}
                    </div>
                ) : (
                    <main className="flex-grow flex flex-col overflow-hidden">
                        {renderMainContent()}
                    </main>
                )}
                <QuizEditorFooter
                    onSettingsClick={handleSettingsClick}
                    onAddSlideClick={handleAddSlideClick}
                    showNavigator={viewMode !== 'add-slide'}
                    showAddButton={viewMode !== 'add-slide'}
                    showSettingsButton={true}
                >
                    {/* Display current context (Settings or Slide X / Y) */}
                    {viewMode !== 'add-slide' && latestQuizDataRef.current && (
                        <div className="text-sm text-muted-foreground truncate px-2">
                            {currentSlideIndex === -1 ? "Quiz Settings" : `Slide ${currentSlideIndex + 1} / ${latestQuizDataRef.current?.questions.length ?? 0}`}
                        </div>
                    )}
                </QuizEditorFooter>
            </QuizEditorLayout>
        </FormProvider>
    );
}