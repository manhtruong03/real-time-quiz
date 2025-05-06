// src/components/quiz-editor/views/QuizSettingsView.tsx
"use client";

import React from 'react';
// No longer need useFormContext or Form here, context is provided by parent
import SettingsContentLayout from '@/src/components/quiz-editor/settings/SettingsContentLayout';
import QuizMetadataForm from '@/src/components/quiz-editor/settings/QuizMetadataForm';
import { MediaManager } from '@/src/components/media/MediaManager';
import { QuizMetadataSchemaType } from '@/src/lib/schemas/quiz-settings.schema';

interface QuizSettingsViewProps { }

export const QuizSettingsView: React.FC<QuizSettingsViewProps> = () => {
    // Components inside QuizMetadataForm will use context from the parent's FormProvider

    const mediaManager = (
        <MediaManager<QuizMetadataSchemaType>
            name="cover"
            label="Cover Image"
            aspectRatio={16 / 9}
            placeholderText="Add Cover Image (16:9 Recommended)"
            className="h-full min-h-[200px]"
        />
    );

    return (
        // Render the layout and form directly.
        // The <form> tag and FormProvider are in CreateQuizPage
        <SettingsContentLayout
            mediaManagerSlot={mediaManager}
            metadataFormSlot={<QuizMetadataForm className="w-full" />}
        />
    );
};

export default QuizSettingsView;