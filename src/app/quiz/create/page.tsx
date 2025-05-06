// src/app/quiz/create/page.tsx
"use client";

import React, { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import QuizEditorLayout from '@/src/components/quiz-editor/layout/QuizEditorLayout';
import QuizEditorHeader from '@/src/components/quiz-editor/layout/QuizEditorHeader';
import QuizEditorFooter from '@/src/components/quiz-editor/layout/QuizEditorFooter';
import type { QuestionHost } from '@/src/lib/types/quiz-structure';

// View Components
import QuizSettingsView from '@/src/components/quiz-editor/views/QuizSettingsView';
import AddSlideView from '@/src/components/quiz-editor/views/AddSlideView';
import { Button } from '@/src/components/ui/button'; // For placeholders

// Custom Hook for State Management
import { useQuizCreator } from '@/src/hooks/quiz-editor/useQuizCreator'; // Adjust path if needed

// Define the different views the editor can be in
type QuizEditorViewMode = 'settings' | 'add-slide' | 'editor';

/**
 * Main page component for the Quiz Creator.
 * Acts as an orchestrator, managing the current view mode and connecting
 * the state management hook (`useQuizCreator`) with the appropriate view components.
 */
export default function CreateQuizPage() {
    // State to control which part of the editor UI is displayed
    const [viewMode, setViewMode] = useState<QuizEditorViewMode>('settings');

    // Use the custom hook to manage all quiz data and related logic
    const {
        quizData,
        currentSlideIndex,
        setCurrentSlideIndex,
        formMethods, // RHF methods from the hook (for the settings form)
        updateQuizMetadata, // Function to update state from settings form data
        handleMetadataSubmit, // RHF submit trigger linked to updateQuizMetadata
        addQuestion,
        resetCreatorState,
    } = useQuizCreator();

    // --- Page-Level Action Handlers ---

    /** Saves the current Quiz Settings form data to the main quiz state. */
    const handleSaveSettings = () => {
        console.log('[CreatePage] handleSaveSettings triggered.');
        // Use the submit handler from the hook, passing our state update function as the callback
        handleMetadataSubmit(updateQuizMetadata)();
        // User feedback (optional, could be toast)
        // alert('Quiz Settings Saved (Check Console and State)');
    }

    /** Placeholder for saving the entire quiz structure (e.g., to backend). */
    const handleSaveQuiz = () => {
        console.log('[CreatePage] handleSaveQuiz triggered.');
        // 1. Ensure latest metadata is saved (if currently in settings view)
        if (viewMode === 'settings') {
            handleSaveSettings();
        }
        // 2. TODO: Add logic here to send the 'quizData' object to your backend API.
        alert('Save Quiz functionality needs backend integration.');
        console.log("Current Quiz Data to Save:", quizData);
    }

    /** Handler for the main Save/Done button in the header. */
    const handleSave = () => {
        if (viewMode === 'settings') {
            handleSaveSettings(); // Save just the metadata if on settings view
        } else {
            handleSaveQuiz(); // Save the entire quiz otherwise
        }
    };

    /** Switches the view to the 'Add Slide' selection screen. */
    const handleAddSlideClick = () => {
        console.log('[CreatePage] Add Slide button clicked.');
        // Save settings if switching away from that view
        if (viewMode === 'settings') {
            handleSaveSettings();
        }
        setViewMode('add-slide');
    };

    /** Switches the view back to the Quiz Settings screen. */
    const handleSettingsClick = () => {
        console.log('[CreatePage] Settings button clicked.');
        setCurrentSlideIndex(-1); // Set index to indicate settings view
        setViewMode('settings');
    };

    /** Adds a new question based on selected type and switches to the editor view. */
    const handleAddQuestionAndEdit = (type: QuestionHost['type'], isTrueFalseOverride: boolean = false) => {
        console.log(`[CreatePage] Adding question type: ${type}, T/F: ${isTrueFalseOverride}`);
        // The hook handles adding the question and updating the index
        addQuestion(type, isTrueFalseOverride);
        // Switch view to the editor after the state update
        setViewMode('editor');
    };

    /** Placeholder for quiz preview functionality. */
    const handlePreview = () => console.log('[CreatePage] Preview button clicked (Not Implemented)');

    // --- Content Rendering Logic ---

    /** Renders the main content area based on the current viewMode. */
    const renderMainContent = () => {
        // console.log("[CreatePage] Rendering view:", viewMode, "Index:", currentSlideIndex);
        switch (viewMode) {
            case 'settings':
                // QuizSettingsView uses context from FormProvider below
                return <QuizSettingsView />;
            case 'add-slide':
                return (
                    <AddSlideView
                        onAddQuestion={handleAddQuestionAndEdit}
                        onBackToSettings={handleSettingsClick} // Use dedicated handler
                    />
                );
            case 'editor':
                // --- Placeholder for the actual Question Editor component ---
                // This will be built in subsequent phases.
                return (
                    <div className="flex-grow flex flex-col items-center justify-center p-6">
                        <h2 className="text-2xl font-semibold mb-4">Question Editor</h2>
                        <p className="text-muted-foreground mb-4">
                            {/* Display current slide context */}
                            {currentSlideIndex >= 0
                                ? `Editing Slide ${currentSlideIndex + 1} / ${quizData?.questions.length ?? 0}`
                                : 'Editor Placeholder (No Slide Selected)'}
                            {currentSlideIndex >= 0 && quizData?.questions[currentSlideIndex] ? ` (${quizData.questions[currentSlideIndex].type})` : ''}
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                            (Full Editor UI coming soon...)
                        </p>
                        {/* Display data for the currently selected question */}
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-w-lg w-full mb-4 h-64">
                            {currentSlideIndex >= 0 && quizData?.questions[currentSlideIndex]
                                ? JSON.stringify(quizData.questions[currentSlideIndex], null, 2)
                                : '(No question data to display)'
                            }
                        </pre>
                        <div className="flex gap-4">
                            <Button variant="outline" onClick={() => setViewMode('add-slide')}>
                                Add Another Slide
                            </Button>
                            <Button variant="outline" onClick={handleSettingsClick}>
                                Back to Settings
                            </Button>
                        </div>
                    </div>
                );
            default:
                // Fallback for unexpected view mode
                console.error("Unknown view mode:", viewMode);
                return <div className="flex-grow flex items-center justify-center">Error: Invalid View State.</div>;
        }
    };

    // --- Main Component Return ---

    // Show loading skeleton or message if quizData hasn't initialized
    if (!quizData) {
        return (
            <QuizEditorLayout>
                {/* Minimal layout during initial load */}
                <QuizEditorHeader showPreviewButton={false} showSaveButton={false} />
                <div className="flex-grow flex items-center justify-center">Loading Quiz Editor...</div>
                <QuizEditorFooter showNavigator={false} showAddButton={false} showSettingsButton={false} />
            </QuizEditorLayout>
        );
    }

    return (
        // Provide RHF methods to all children, needed by QuizSettingsView
        <FormProvider {...formMethods}>
            <QuizEditorLayout>
                <QuizEditorHeader
                    onSave={handleSave}
                    onPreview={handlePreview}
                    saveButtonLabel={viewMode === 'settings' ? 'Done' : 'Save Quiz'}
                />

                {/* Conditionally render the form tag only for the settings view */}
                {viewMode === 'settings' ? (
                    <form
                        // Submission is triggered by handleSaveSettings via the header button
                        className="flex-grow flex flex-col overflow-hidden" // Added overflow
                        noValidate
                        // Prevent default browser submission if Enter is pressed in form
                        onSubmit={(e) => e.preventDefault()}
                    >
                        {renderMainContent()}
                        <button type="submit" onClick={handleSaveSettings} className="hidden" aria-hidden="true">
                            Submit Settings Form
                        </button>
                    </form>
                ) : (
                    // Render other views directly within a main element
                    <main className="flex-grow flex flex-col overflow-hidden">
                        {renderMainContent()}
                    </main>
                )}

                <QuizEditorFooter
                    onSettingsClick={handleSettingsClick}
                    onAddSlideClick={handleAddSlideClick}
                    showNavigator={viewMode !== 'add-slide'} // Show navigator unless adding slide
                    showAddButton={viewMode !== 'add-slide'} // Show add button unless adding slide
                >
                    {/* Display context in footer (outside add-slide view) */}
                    {viewMode !== 'add-slide' && (
                        <div className="text-sm text-muted-foreground truncate px-2">
                            {currentSlideIndex === -1 ? "Quiz Settings" : `Slide ${currentSlideIndex + 1} / ${quizData?.questions.length ?? 0}`}
                        </div>
                    )}
                </QuizEditorFooter>
            </QuizEditorLayout>
        </FormProvider>
    );
}