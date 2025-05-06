// src/components/quiz-editor/views/AddSlideView.tsx
"use client";

import React from 'react';
import QuestionTypeSelectorGrid from '@/src/components/quiz-editor/add-slide/QuestionTypeSelectorGrid';
import QuestionTypeSelectorCard from '@/src/components/quiz-editor/add-slide/QuestionTypeSelectorCard';
import { Button } from '@/src/components/ui/button';
import type { QuestionHost } from '@/src/lib/types/quiz-structure';
import {
    HelpCircle, CheckSquare, ListOrdered, Vote, Type, Newspaper
} from 'lucide-react';

// Define Props
interface AddSlideViewProps {
    // Renamed prop for clarity - it adds a question
    onAddQuestion: (type: QuestionHost['type'], isTrueFalseOverride?: boolean) => void;
    onBackToSettings: () => void;
}

// Data remains the same
const slideTypesData = [
    { type: 'quiz', title: 'Quiz (Multiple Choice)', description: 'Ask a question with multiple text or image answer options.', icon: HelpCircle },
    { type: 'quiz', title: 'True / False', description: 'Ask a question with True and False as the only options.', icon: CheckSquare },
    { type: 'jumble', title: 'Jumble', description: 'Ask players to arrange items in the correct order.', icon: ListOrdered },
    { type: 'survey', title: 'Poll / Survey', description: 'Gather opinions from players, no points awarded.', icon: Vote },
    { type: 'open_ended', title: 'Type Answer', description: 'Ask players to type a short text answer.', icon: Type },
    { type: 'content', title: 'Content Slide', description: 'Add an informational slide with text and media.', icon: Newspaper },
];

export const AddSlideView: React.FC<AddSlideViewProps> = ({
    onAddQuestion, // Use the new prop name
    onBackToSettings,
}) => {
    // Internal handler to check for True/False selection
    const handleCardClick = (type: QuestionHost['type'], title: string) => {
        const isTrueFalse = type === 'quiz' && title === 'True / False';
        onAddQuestion(type, isTrueFalse); // Call the passed handler
    };

    return (
        <div className="flex-grow flex flex-col items-center p-4 md:p-6">
            <h1 className="text-2xl font-bold mb-6 text-center">
                Add a new slide
            </h1>
            <QuestionTypeSelectorGrid>
                {slideTypesData.map((slideType) => (
                    <QuestionTypeSelectorCard
                        key={slideType.title}
                        type={slideType.type as QuestionHost['type']}
                        title={slideType.title}
                        description={slideType.description}
                        icon={slideType.icon}
                        // Call the internal handler
                        onClick={() => handleCardClick(slideType.type as QuestionHost['type'], slideType.title)}
                    />
                ))}
            </QuestionTypeSelectorGrid>
            <Button variant="outline" onClick={onBackToSettings} className="mt-8">
                Back to Settings
            </Button>
        </div>
    );
};

export default AddSlideView;