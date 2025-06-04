// src/components/quiz-editor/editor/QuestionEditorPanel.tsx
"use client";

import React from 'react';
import { useFormContext, type Path } from 'react-hook-form';
import { cn } from '@/src/lib/utils';
import type { QuestionHostSchemaType } from '@/src/lib/schemas/quiz-question.schema'; // QuestionHostSchemaType includes questionImageUploadKey
import { RHFTextAreaField } from '@/src/components/rhf/RHFTextAreaField';
import { MediaManager } from '@/src/components/media/MediaManager';
import QuizSurveyAnswerEditor from './answer-editors/QuizSurveyAnswerEditor';
import SortableAnswerList from './answer-editors/SortableAnswerList';

interface QuestionEditorPanelProps {
    className?: string;
}

const QuestionEditorPanel: React.FC<QuestionEditorPanelProps> = ({
    className
}) => {
    const { control, watch } = useFormContext<QuestionHostSchemaType>();
    const watchedType = watch('type');

    const isQuiz = watchedType === 'quiz';
    const isSurvey = watchedType === 'survey';
    const isJumble = watchedType === 'jumble';
    const isContent = watchedType === 'content';
    const isOpenEnded = watchedType === 'open_ended';

    const getPrimaryTextInputName = (type: QuestionHostSchemaType['type'] | undefined): Path<QuestionHostSchemaType> => {
        return type === 'content' ? 'title' : 'question';
    };
    const getSecondaryTextInputName = (type: QuestionHostSchemaType['type'] | undefined): Path<QuestionHostSchemaType> | null => {
        return type === 'content' ? 'description' : null;
    };

    const primaryInputName = getPrimaryTextInputName(watchedType);
    const secondaryInputName = getSecondaryTextInputName(watchedType);
    const primaryPlaceholder = isContent ? "Nhập tiêu đề trang chiếu..." : "Nhập câu hỏi của bạn tại đây...";
    const secondaryPlaceholder = isContent ? "Nhập mô tả trang chiếu..." : "";

    return (
        <div className={cn("flex-grow flex flex-col gap-4", className)}>
            {/* Top Section: Question/Title + Description */}
            <div className="bg-background p-4 rounded-lg shadow-sm border">
                <RHFTextAreaField<QuestionHostSchemaType>
                    name={primaryInputName}
                    placeholder={primaryPlaceholder}
                    className="text-lg md:text-xl font-semibold border-none focus-visible:ring-0 p-2 mb-2 bg-transparent"
                    rows={3}
                />
                {secondaryInputName && (
                    <RHFTextAreaField<QuestionHostSchemaType>
                        name={secondaryInputName}
                        placeholder={secondaryPlaceholder}
                        className="text-sm md:text-base border-none focus-visible:ring-0 p-2 bg-transparent"
                        rows={3}
                    />
                )}
            </div>

            {/* Middle Section: Media */}
            <div className="flex justify-center">
                <MediaManager<QuestionHostSchemaType>
                    name="image" // RHF field for the image URL string
                    fileFieldName="imageFile" // RHF field for the File object
                    // MODIFIED: Add the new prop for the upload key field name
                    imageUploadKeyFieldName="questionImageUploadKey"
                    aspectRatio={16 / 9}
                    placeholderText="Thêm Phương Tiện cho Câu Hỏi"
                    className="w-full max-w-md"
                />
            </div>

            {/* Bottom Section: Answer Editor */}
            <div className="flex-grow mt-2 p-4 border rounded-lg bg-background/50 flex flex-col justify-start min-h-[250px]">
                {(isQuiz || isSurvey) ? (
                    <QuizSurveyAnswerEditor />
                ) : isJumble ? (
                    <SortableAnswerList className="w-full max-w-lg mx-auto" />
                ) : isContent ? (
                    <p className="text-muted-foreground italic text-center self-center my-auto">
                        (Trang chiếu nội dung - không cần đáp án)
                    </p>
                ) : isOpenEnded ? (
                    <p className="text-muted-foreground italic text-center self-center my-auto">
                        (Trình chỉnh sửa câu trả lời mở)
                    </p>
                ) : (
                    <p className="text-muted-foreground italic text-center self-center my-auto">
                        {watchedType ? `(Trình chỉnh sửa đáp án ${watchedType})` : "Chọn loại câu hỏi..."}
                    </p>
                )}
            </div>
        </div>
    );
};

export default QuestionEditorPanel;