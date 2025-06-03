// src/app/my-quizzes/components/QuizList.tsx
"use client";

import React from 'react';
import type { QuizDTO } from '@/src/lib/types/api';
import QuizCard from './QuizCard';

interface QuizListProps {
    quizzes: QuizDTO[];
    onDelete: (quizId: string | undefined, quizTitle: string | undefined) => void;
    isDeleting: string | null;
}

const QuizList: React.FC<QuizListProps> = ({ quizzes, onDelete, isDeleting }) => {
    return (
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {quizzes.map((quiz) => (
                <QuizCard
                    key={quiz.uuid}
                    quiz={quiz}
                    onDelete={onDelete}
                    isDeleting={isDeleting}
                />
            ))}
        </div>
    );
};

export default QuizList;