import React from 'react';
import type { QuestionReportItemDto } from '@/src/lib/types/reports';
import QuestionReportCard from './QuestionReportCard'; // Assuming this path is correct

interface QuestionListProps {
    questions: QuestionReportItemDto[];
    currentPageZeroIndexed: number;
    pageSize: number;
}

const QuestionList: React.FC<QuestionListProps> = ({
    questions,
    currentPageZeroIndexed,
    pageSize,
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
                />
            ))}
        </div>
    );
};

export default QuestionList;