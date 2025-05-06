// src/components/quiz-editor/settings/QuizMetadataForm.tsx
"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form'; // No longer need useForm, FormProvider, SubmitHandler here
import {
    QuizMetadataSchema,
    QuizMetadataSchemaType,
    QuizVisibilityEnum, // Import enum
} from '@/src/lib/schemas/quiz-settings.schema';
// Form component is used in the parent page
import { RHFTextField } from '@/src/components/rhf/RHFTextField';
import { RHFTextAreaField } from '@/src/components/rhf/RHFTextAreaField';
import { RHFSelectField } from '@/src/components/rhf/RHFSelectField'; // Import Select wrapper
import { RHFTagInputField } from '@/src/components/rhf/RHFTagInputField'; // Import Tag wrapper
import { cn } from '@/src/lib/utils'; //

interface QuizMetadataFormProps {
    // onSubmit is now handled by the parent page via handleSubmit
    className?: string;
}

// Example options for selects
const visibilityOptions = [
    { value: QuizVisibilityEnum.enum.PRIVATE, label: 'Private (Only you can see)' },
    { value: QuizVisibilityEnum.enum.PUBLIC, label: 'Public (Visible to everyone)' },
];

const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'vi', label: 'Vietnamese' },
    { value: 'es', label: 'Spanish' },
    // Add more languages as needed
];


const QuizMetadataForm: React.FC<QuizMetadataFormProps> = ({ className }) => {
    // Get methods from context provided by parent page
    const { control } = useFormContext<QuizMetadataSchemaType>();

    return (
        // The FormProvider and <form> tag are now in the parent page
        <div className={cn('space-y-4 md:space-y-6', className)}>
            <RHFTextField<QuizMetadataSchemaType>
                name="title"
                label="Quiz Title"
                placeholder="Enter your quiz title..."
                required
            />

            <RHFTextAreaField<QuizMetadataSchemaType>
                name="description"
                label="Description"
                placeholder="Add a short description (optional)..."
                rows={4}
            />

            {/* --- PHASE 3 FIELDS --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <RHFSelectField<QuizMetadataSchemaType>
                    name="visibility"
                    label="Visibility"
                    options={visibilityOptions}
                    placeholder="Select visibility..."
                />
                {/* <RHFSelectField<QuizMetadataSchemaType>
                    name="language"
                    label="Language"
                    options={languageOptions}
                    placeholder="Select language (optional)..."
                /> */}
            </div>

            <RHFTagInputField<QuizMetadataSchemaType>
                name="tags"
                label="Tags"
                placeholder="Add relevant tags (e.g., math, history)..."
                maxTags={10} // Example limit from schema
                description="Press Enter or comma (,) to add a tag. Max 10 tags."
            />
            {/* --- End PHASE 3 --- */}

            {/* Placeholder for Cover (Phase 4) - maybe remove this placeholder now */}
            {/* <div className="h-20 bg-muted/50 rounded-md flex items-center justify-center text-muted-foreground border border-dashed text-sm">
                Cover Image - Phase 4
            </div> */}
        </div>
    );
};

export default QuizMetadataForm;