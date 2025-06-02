'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import useSessionQuestionsData from '@/src/app/reports/hooks/useSessionQuestionsData';
import { ReportsPaginationComponent } from '@/src/app/reports/components/ReportsPagination';
import { ReportsErrorState } from '@/src/app/reports/components/ReportsErrorState';
import { ReportsEmptyState } from '@/src/app/reports/components/ReportsEmptyState';
import QuestionsLoadingSkeleton from './QuestionsLoadingSkeleton';
import QuestionList from './QuestionList'; // Ensure this path is correct relative to QuestionsTabContent.tsx

const PAGE_SIZE = 5;

const QuestionsTabContent: React.FC = () => {
    const params = useParams();
    const sessionId = typeof params.sessionId === 'string' ? params.sessionId : null;

    const {
        questionsData,
        isLoading,
        error,
        currentPage,
        totalPages,
        goToPage,
        loadQuestions,
    } = useSessionQuestionsData({ sessionId, pageSize: PAGE_SIZE });

    const handlePageChange = (pageOneIndexed: number) => {
        goToPage(pageOneIndexed - 1);
    };

    if (isLoading && !questionsData) {
        return <QuestionsLoadingSkeleton count={PAGE_SIZE} />;
    }

    if (error) {
        return (
            <ReportsErrorState
                error={error.message || 'Không thể tải dữ liệu câu hỏi.'}
                onRetry={() => sessionId && loadQuestions(currentPage)}
            />
        );
    }

    if (!questionsData || questionsData.content.length === 0) {
        return (
            <ReportsEmptyState />
        );
    }

    return (
        <div className="space-y-6 pb-8">
            <QuestionList
                questions={questionsData.content}
                currentPageZeroIndexed={questionsData.number}
                pageSize={questionsData.size}
            />

            {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                    <ReportsPaginationComponent
                        currentPage={currentPage + 1}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}
        </div>
    );
};

export default QuestionsTabContent;