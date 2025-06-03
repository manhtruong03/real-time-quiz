// src/components/quiz-editor/editor/answer-editors/QuizSurveyAnswerEditor.tsx
"use client";

import React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { cn } from '@/src/lib/utils';
import type { QuestionHostSchemaType } from '@/src/lib/schemas/quiz-question.schema';
import { Button } from '@/src/components/ui/button';
import { Plus } from 'lucide-react';
import AnswerInput from './AnswerInput';
import AnswerGrid from './AnswerGrid';

interface QuizSurveyAnswerEditorProps {
    className?: string;
}

const QuizSurveyAnswerEditor: React.FC<QuizSurveyAnswerEditorProps> = ({
    className,
}) => {
    const { control, watch } = useFormContext<QuestionHostSchemaType>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'choices',
    });
    const watchedType = watch('type');
    const isSurvey = watchedType === 'survey';

    const handleAddAnswer = () => {
        if (fields.length < 6) {
            // Add a new choice, include 'image' field as undefined
            append({ answer: '', correct: false, image: undefined });
        }
    };

    const handleRemoveAnswer = (index: number) => {
        remove(index);
    };

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            <AnswerGrid>
                {fields.map((field, index) => (
                    <AnswerInput
                        key={field.id}
                        index={index}
                        onRemove={() => handleRemoveAnswer(index)}
                        isSurvey={isSurvey}
                    />
                ))}
            </AnswerGrid>
            {fields.length < 6 && (
                <Button
                    type="button"
                    variant="default"
                    onClick={handleAddAnswer}
                    // Changed self-start to self-center
                    className="self-center bg-editor-accent-color text-white hover:bg-editor-accent-hover px-[18px] py-[8px] text-sm font-medium rounded-[6px]"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm đáp án (Tối đa 6)
                </Button>
            )}
        </div>
    );
};

export default QuizSurveyAnswerEditor;