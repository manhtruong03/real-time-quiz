// src/components/quiz-editor/editor/answer-editors/QuizSurveyAnswerEditor.tsx
"use client";

import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/src/components/ui/button';
import { PlusCircle } from 'lucide-react';
import AnswerGrid from './AnswerGrid';
import AnswerInput from './AnswerInput';
import type { QuestionHostSchemaType } from '@/src/lib/schemas/quiz-question.schema';
import { createDefaultChoice } from '@/src/lib/game-utils/quiz-creation'; // Keep this import

interface QuizSurveyAnswerEditorProps { }

export const QuizSurveyAnswerEditor: React.FC<QuizSurveyAnswerEditorProps> = () => {
    const { control, watch } = useFormContext<QuestionHostSchemaType>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "choices",
        keyName: "fieldId"
    });

    const questionType = watch('type'); // Watch the type
    const choicesValues = watch('choices');

    const isSurvey = questionType === 'survey';
    // Determine T/F status (no change here)
    const isTrueFalse =
        questionType === 'quiz' &&
        choicesValues?.length === 2 &&
        choicesValues.every((c: QuestionHostSchemaType['choices'][number]) => c.answer === "True" || c.answer === "False");

    const handleAddAnswer = () => {
        // *** FIX: Create choice based on type ***
        const isCorrectForNewChoice = isSurvey; // Surveys treat all options as 'correct' structurally
        append(createDefaultChoice(isCorrectForNewChoice, ''));
        // *** END FIX ***
    };

    const maxAnswers = isTrueFalse ? 2 : 4; // Limit to 4 for now, can increase later
    const canAddMore = fields.length < maxAnswers;

    return (
        <div className="space-y-3 mt-4">
            <AnswerGrid>
                {fields.map((field, index) => (
                    <AnswerInput
                        key={field.fieldId}
                        index={index}
                        onRemove={remove}
                        fieldId={field.fieldId}
                        isSurvey={isSurvey} // Pass isSurvey down
                    />
                ))}
            </AnswerGrid>

            {!isTrueFalse && ( // Don't show add button for T/F
                <div className="flex justify-center pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddAnswer}
                        disabled={!canAddMore}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Answer
                    </Button>
                </div>
            )}
            {fields.length < 2 && !isSurvey && ( // Only show min 2 error for quiz
                <p className="text-xs text-destructive text-center mt-1">Quiz requires at least 2 answer options.</p>
            )}
            {/* Add warning for survey if needed */}
            {isSurvey && fields.length < 2 && (
                <p className="text-xs text-destructive text-center mt-1">Polls require at least 2 answer options.</p>
            )}
        </div>
    );
};

export default QuizSurveyAnswerEditor;