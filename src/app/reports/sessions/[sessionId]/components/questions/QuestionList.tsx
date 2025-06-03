// src/app/reports/sessions/[sessionId]/components/questions/QuestionList.tsx
import React from 'react';
import type { QuestionReportItemDto } from '@/src/lib/types/reports';
import QuestionReportCard from './QuestionReportCard';

interface QuestionListProps {
    questions: QuestionReportItemDto[];
    totalPlayersInSession: number;
}

const QuestionList: React.FC<QuestionListProps> = ({
    questions,
    totalPlayersInSession,
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
                    totalPlayersInSession={totalPlayersInSession} // Pass it down
                />
            ))}
        </div>
    );
};
export default QuestionList;