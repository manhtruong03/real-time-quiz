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
    { value: QuizVisibilityEnum.enum.PRIVATE, label: 'Riêng tư (Chỉ bạn có thể xem)' },
    { value: QuizVisibilityEnum.enum.PUBLIC, label: 'Công khai (Hiển thị cho mọi người)' },
];

const languageOptions = [
    { value: 'en', label: 'Tiếng Anh' },
    { value: 'vi', label: 'Tiếng Việt' },
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
                label="Tiêu đề bài Quiz"
                placeholder="Nhập tiêu đề bài quiz của bạn..."
                required
            />

            <RHFTextAreaField<QuizMetadataSchemaType>
                name="description"
                label="Mô tả"
                placeholder="Thêm mô tả ngắn (tùy chọn)..."
                rows={4}
            />

            {/* --- PHASE 3 FIELDS --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <RHFSelectField<QuizMetadataSchemaType>
                    name="visibility"
                    label="Chế độ hiển thị"
                    options={visibilityOptions}
                    placeholder="Chọn chế độ hiển thị..."
                />
                {/* <RHFSelectField<QuizMetadataSchemaType>
                    name="language"
                    label="Ngôn ngữ"
                    options={languageOptions}
                    placeholder="Chọn ngôn ngữ (tùy chọn)..."
                /> */}
            </div>

            <RHFTagInputField<QuizMetadataSchemaType>
                name="tags"
                label="Thẻ (Tags)"
                placeholder="Thêm các thẻ liên quan (ví dụ: toán, lịch sử)..."
                maxTags={10} // Example limit from schema
                description="Nhấn Enter hoặc dấu phẩy (,) để thêm thẻ. Tối đa 10 thẻ."
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