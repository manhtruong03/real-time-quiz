// src/app/reports/sessions/[sessionId]/components/questions/QuestionList.tsx
import React from 'react';
import type { QuestionReportItemDto } from '@/src/lib/types/reports';
import QuestionReportCard from './QuestionReportCard';

interface QuestionListProps {
    questions: QuestionReportItemDto[];
    currentPageZeroIndexed: number;
    pageSize: number;
    totalPlayersInSession: number; // <-- Add this prop
}

const QuestionList: React.FC<QuestionListProps> = ({
    questions,
    currentPageZeroIndexed,
    pageSize,
    totalPlayersInSession, // <-- Use this prop
}) => {
    if (!questions || questions.length === 0) {
        return null;
    }

    return (
        <div className="space-y-5 md:space-y-6">
            {questions.map((question, indexInPage) => (
                <QuestionReportCard
                    key={question.slideIndex + '-' + question.title}
                    questionReport={question}
                    questionNumber={currentPageZeroIndexed * pageSize + indexInPage + 1}
                    totalPlayersInSession={totalPlayersInSession} // Pass it down
                />
            ))}
        </div>
    );
};
export default QuestionList;