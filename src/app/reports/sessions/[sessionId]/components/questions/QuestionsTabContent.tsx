// src/app/reports/sessions/[sessionId]/components/questions/QuestionsTabContent.tsx
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import useSessionQuestionsData from '@/src/app/reports/hooks/useSessionQuestionsData';
import { useSessionSummaryData } from '../../hooks/useSessionSummaryData'; // Import summary hook
import { ReportsPaginationComponent } from '@/src/app/reports/components/ReportsPagination';
import { ReportsErrorState } from '@/src/app/reports/components/ReportsErrorState';
import { ReportsEmptyState } from '@/src/app/reports/components/ReportsEmptyState';
import QuestionsLoadingSkeleton from './QuestionsLoadingSkeleton';
import QuestionList from './QuestionList';

const PAGE_SIZE = 5;

const QuestionsTabContent: React.FC = () => {
    const params = useParams();
    const sessionId = typeof params.sessionId === 'string' ? params.sessionId : null;

    const {
        summaryData, // Get summary data
        isLoading: isLoadingSummary,
        error: summaryError,
    } = useSessionSummaryData(sessionId);

    const {
        questionsData,
        isLoading: isLoadingQuestions,
        error: questionsError,
        currentPage,
        totalPages,
        goToPage,
        loadQuestions,
    } = useSessionQuestionsData({ sessionId, pageSize: PAGE_SIZE });

    const handlePageChange = (pageOneIndexed: number) => {
        goToPage(pageOneIndexed - 1);
    };

    const totalPlayersInSessionForCards = summaryData?.controllersCount ?? 0;


    // Combined loading state
    if ((isLoadingQuestions && !questionsData) || (isLoadingSummary && !summaryData && !questionsError)) {
        return <QuestionsLoadingSkeleton count={PAGE_SIZE} />;
    }

    const displayError = questionsError || summaryError;
    if (displayError) {
        return (
            <ReportsErrorState
                error={displayError.message || 'Không thể tải dữ liệu.'}
                onRetry={() => sessionId && loadQuestions(currentPage)} // Or a combined refetch
            />
        );
    }

    if (!questionsData || questionsData.content.length === 0) {
        return <ReportsEmptyState />;
    }

    return (
        <div className="space-y-6 pb-8">
            <QuestionList
                questions={questionsData.content}
                currentPageZeroIndexed={questionsData.number}
                pageSize={questionsData.size}
                totalPlayersInSession={totalPlayersInSessionForCards} // Pass it down
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