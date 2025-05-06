// src/app/quiz/create/page.tsx
"use client";

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import QuizEditorLayout from '@/src/components/quiz-editor/layout/QuizEditorLayout';
import QuizEditorHeader from '@/src/components/quiz-editor/layout/QuizEditorHeader';
import QuizEditorFooter from '@/src/components/quiz-editor/layout/QuizEditorFooter';
import SettingsContentLayout from '@/src/components/quiz-editor/settings/SettingsContentLayout';
import QuizMetadataForm from '@/src/components/quiz-editor/settings/QuizMetadataForm';
import { MediaManager } from '@/src/components/media/MediaManager'; // <-- Import MediaManager
import {
    QuizMetadataSchema,
    QuizMetadataSchemaType,
    QuizVisibilityEnum,
} from '@/src/lib/schemas/quiz-settings.schema';
import { Form } from '@/src/components/ui/form';

export default function CreateQuizPage() {
    const formMethods = useForm<QuizMetadataSchemaType>({
        resolver: zodResolver(QuizMetadataSchema),
        defaultValues: {
            title: '',
            description: '',
            visibility: QuizVisibilityEnum.enum.PRIVATE,
            // language: '',
            tags: [],
            cover: null, // Initialize cover as null
        },
        mode: 'onChange',
    });

    const { control, setValue } = formMethods; // Extract control and setValue

    // Submit Handler (mock behavior)
    const handleFormSubmit = (data: QuizMetadataSchemaType) => {
        console.log('--- Quiz Settings Submitted (Final Phase Check) ---');
        console.log(data);
        // Replace alert with a more modern notification if desired, e.g., using shadcn Toast
        // toast({ title: "Success", description: "Quiz settings submitted (Check Console)" });
        alert('Quiz Settings Submitted (Check Console)');
    };

    // Header Save Button Action
    const handleSave = () => {
        console.log('Header Save/Done clicked, triggering form submit...');
        formMethods.handleSubmit(handleFormSubmit)(); // Triggers validation and submit
    };

    // --- Other Placeholder Handlers ---
    const handlePreview = () => console.log('Preview button clicked');
    const handleSettings = () => console.log('Settings button clicked (already on settings)');
    const handleAddSlide = () => console.log('Add Slide button clicked');

    // --- Media Manager Component Instance ---
    const mediaManager = (
        // Pass the field name and RHF methods directly
        // control and setValue are available via FormProvider context within MediaManager
        <MediaManager<QuizMetadataSchemaType>
            name="cover"
            label="Cover Image"
            aspectRatio={16 / 9}
            placeholderText="Add Cover Image (16:9 Recommended)"
            className="h-full min-h-[200px]" // Ensure it takes height in the grid
        />
    );

    return (
        <FormProvider {...formMethods}>
            <QuizEditorLayout>
                <QuizEditorHeader
                    onSave={handleSave}
                    onPreview={handlePreview} // Use placeholder handler
                    saveButtonLabel="Done"
                />
                <Form {...formMethods}>
                    <form
                        onSubmit={formMethods.handleSubmit(handleFormSubmit)}
                        className="flex-grow flex flex-col"
                        noValidate
                    >
                        <SettingsContentLayout
                            mediaManagerSlot={mediaManager}
                            metadataFormSlot={<QuizMetadataForm className="w-full" />}
                        />
                        <button type="submit" className="hidden" aria-hidden="true">
                            Submit
                        </button>
                    </form>
                </Form>
                <QuizEditorFooter
                    onSettingsClick={handleSettings} // Use placeholder handler
                    onAddSlideClick={handleAddSlide} // Use placeholder handler
                    showNavigator={true} // Keep navigator placeholder visible for context
                />
            </QuizEditorLayout>
        </FormProvider>
    );
}