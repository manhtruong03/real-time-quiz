// src/app/reports/sessions/[sessionId]/components/questions/QuestionsTabContent.tsx
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import useSessionQuestionsData from '@/src/app/reports/hooks/useSessionQuestionsData';
import { useSessionSummaryData } from '../../hooks/useSessionSummaryData';
import { ReportsErrorState } from '@/src/app/reports/components/ReportsErrorState';
import { ReportsEmptyState } from '@/src/app/reports/components/ReportsEmptyState';
import QuestionsLoadingSkeleton from './QuestionsLoadingSkeleton';
import QuestionsFilters from './QuestionsFilters';
import SortControls from './SortControls';
import QuestionList from './QuestionList';
import { Button } from '@/src/components/ui/button';
import { Loader2 } from 'lucide-react'; // For loading spinner on the button

const PAGE_SIZE_FOR_HOOK = 5; // Define the page size to be used by the hook

const QuestionsTabContent: React.FC = () => {
    const params = useParams();
    const sessionId = typeof params.sessionId === 'string' ? params.sessionId : null;

    const {
        summaryData,
        isLoading: isLoadingSummary,
        error: summaryError,
    } = useSessionSummaryData(sessionId);

    const {
        displayedQuestions,
        isLoading, // True for initial load or when sorting/filtering resets data
        isLoadingMore, // True when fetching additional data via "load more"
        error: questionsError,
        loadMore,
        hasMore,
        retryLoad,
        searchTerm,
        setSearchTerm,
        activeFilter,
        setActiveFilter,
        sortBy,
        currentSortProperty,
        currentSortDirection,
        // totalDisplayedQuestions, // Available if needed
    } = useSessionQuestionsData({
        sessionId,
        pageSize: PAGE_SIZE_FOR_HOOK, // Pass the desired page size
        initialSortProperty: 'slideIndex',
        initialSortDirection: 'asc',
    });

    const totalPlayersInSession = summaryData?.controllersCount ?? 0;

    // Determine if any questions have been successfully loaded at least once (even if the list is empty now due to filters)
    const hasAttemptedInitialLoad = !isLoading && (displayedQuestions.length > 0 || !questionsError);


    const displayError = questionsError || summaryError;
    // Show error state if there's an error and we are not in an initial combined loading phase
    if (displayError && !isLoading && !isLoadingSummary && !isLoadingMore) {
        return (
            <ReportsErrorState
                error={displayError.message || 'Không thể tải dữ liệu câu hỏi.'}
                onRetry={retryLoad}
            />
        );
    }

    const noQuestionsToShow = displayedQuestions.length === 0;

    return (
        <div className="space-y-4 pb-8">
            <QuestionsFilters
                activeFilterTab={activeFilter}
                onFilterTabChange={setActiveFilter}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
            />
            <SortControls
                currentSortProperty={currentSortProperty}
                currentSortDirection={currentSortDirection}
                onSortChange={sortBy}
            />

            {/* Initial Loading Skeleton */}
            {isLoading && noQuestionsToShow && <QuestionsLoadingSkeleton count={PAGE_SIZE_FOR_HOOK} />}

            {/* Display Question List or Empty State */}
            {!isLoading && noQuestionsToShow && (
                <ReportsEmptyState />
            )}

            {!noQuestionsToShow && (
                <QuestionList
                    questions={displayedQuestions}
                    // currentPageZeroIndexed and pageSize are removed as they are not relevant for "load more"
                    totalPlayersInSession={totalPlayersInSession}
                />
            )}

            {/* "See more" Button and its Loading State */}
            {hasMore && !isLoading && !isLoadingMore && !displayError && (
                <div className="mt-8 flex justify-center">
                    <Button onClick={loadMore} variant="outline" size="lg">
                        See more questions
                    </Button>
                </div>
            )}
            {isLoadingMore && (
                <div className="mt-8 flex justify-center items-center text-sm text-text-secondary">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading more questions...
                </div>
            )}
        </div>
    );
};
export default QuestionsTabContent;