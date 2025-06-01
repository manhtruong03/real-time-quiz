// src/components/quiz-editor/views/QuizSettingsView.tsx
"use client";

import React from 'react';
import SettingsContentLayout from '@/src/components/quiz-editor/settings/SettingsContentLayout';
import QuizMetadataForm from '@/src/components/quiz-editor/settings/QuizMetadataForm';
import { MediaManager } from '@/src/components/media/MediaManager';
import { QuizMetadataSchemaType } from '@/src/lib/schemas/quiz-settings.schema'; // QuizMetadataSchemaType includes coverImageUploadKey

interface QuizSettingsViewProps { }

export const QuizSettingsView: React.FC<QuizSettingsViewProps> = () => {
    const mediaManager = (
        <MediaManager<QuizMetadataSchemaType>
            name="cover" // RHF field for the image URL string
            fileFieldName="coverImageFile" // RHF field for the File object
            // MODIFIED: Add the new prop for the upload key field name
            imageUploadKeyFieldName="coverImageUploadKey"
            label="Cover Image"
            aspectRatio={16 / 9}
            placeholderText="Add Cover Image (16:9 Recommended)"
            className="h-full min-h-[200px]"
        />
    );

    return (
        <SettingsContentLayout
            mediaManagerSlot={mediaManager}
            metadataFormSlot={<QuizMetadataForm className="w-full" />}
        />
    );
};

export default QuizSettingsView;