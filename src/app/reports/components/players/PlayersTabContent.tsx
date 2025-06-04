// Path: @/src/app/reports/sessions/[sessionId]/components/players/PlayersTabContent.tsx
'use client'; // This component uses hooks and client-side interactions

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation'; // To get sessionId if not passed as prop

import { useSessionPlayersData } from '../../hooks/useSessionPlayersData';
import PlayersFilters, { PlayerFilterSubTabKey } from './PlayersFilters';
import PlayersTable from './PlayersTable';
import { ReportsPaginationComponent } from '@/src/app/reports/components/ReportsPagination'; //
import { Skeleton } from '@/src/components/ui/skeleton'; //
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'; //
import { AlertCircle } from 'lucide-react';
import type { PlayerReportItemDto } from '@/src/lib/types/reports';

interface PlayersTabContentProps {
    sessionId: string;
}

const PlayersLoadingSkeleton: React.FC<{ itemsPerPage: number }> = ({ itemsPerPage }) => (
    <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            <div className="flex items-center space-x-1 border border-border-neutral rounded-md p-1 bg-background-elevated h-[40px] w-[280px]">
                <Skeleton className="h-[28px] w-[80px]" />
                <Skeleton className="h-[28px] w-[100px]" />
                <Skeleton className="h-[28px] w-[100px]" />
            </div>
            <Skeleton className="h-10 w-full sm:w-[250px]" />
        </div>
        <div className="rounded-md border bg-background-card p-4">
            <Skeleton className="h-10 w-full mb-4" /> {/* Table Header */}
            {Array.from({ length: itemsPerPage / 2 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full mb-2" /> // Table Rows
            ))}
        </div>
        <Skeleton className="h-10 w-1/3 mx-auto" /> {/* Pagination */}
    </div>
);

const PlayersTabContent: React.FC<PlayersTabContentProps> = ({ sessionId }) => {
    const {
        playersData,
        isLoading,
        error,
        currentPage, // 0-indexed
        totalPages,
        setPage,      // expects 0-indexed
        sortBy,
        searchTerm,
        setSearchTerm,
        currentSort,
        itemsPerPage,
    } = useSessionPlayersData(sessionId);

    const [activeSubTab, setActiveSubTab] = useState<PlayerFilterSubTabKey>('all');

    const filteredAndSearchedPlayers = useMemo(() => {
        let filtered = playersData?.content || [];

        // Apply sub-tab filtering
        if (activeSubTab === 'needHelp') {
            filtered = filtered.filter(player => player.averageAccuracy < 0.5);
        } else if (activeSubTab === 'didNotFinish') {
            // Assuming 'did not finish' means they have unanswered questions.
            // Adjust this logic if there's a more specific field or definition.
            filtered = filtered.filter(player => player.unansweredCount > 0);
        }

        // Apply search term filtering (client-side)
        if (searchTerm) {
            filtered = filtered.filter(player =>
                player.nickname.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return filtered;
    }, [playersData?.content, activeSubTab, searchTerm]);

    if (isLoading && !playersData) { // Show full skeleton only on initial load
        return <PlayersLoadingSkeleton itemsPerPage={itemsPerPage} />;
    }

    if (error) {
        return (
            <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Lỗi khi tải dữ liệu người chơi</AlertTitle>
                <AlertDescription>
                    {error.message || 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.'}
                </AlertDescription>
            </Alert>
        );
    }

    // Handle case where playersData is null after loading (e.g., API returned empty or unexpected error after initial load)
    if (!playersData && !isLoading) {
        return (
            <div className="py-4">
                <PlayersFilters
                    activeSubTab={activeSubTab}
                    onSubTabChange={setActiveSubTab}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                />
                <p className="text-center text-text-secondary mt-8">Không có dữ liệu người chơi nào cho phiên này.</p>
            </div>
        );
    }

    // If loading more pages but data already exists, we might want a less intrusive loading state,
    // but for now, the table will just update.

    return (
        <div className="py-4">
            <PlayersFilters
                activeSubTab={activeSubTab}
                onSubTabChange={setActiveSubTab}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
            />
            {isLoading && <p className="text-center text-text-secondary my-4">Đang tải thêm người chơi...</p>}
            {!isLoading && playersData && (
                <>
                    <PlayersTable
                        players={filteredAndSearchedPlayers}
                        onSort={sortBy}
                        currentSortProperty={currentSort.property}
                        currentSortDirection={currentSort.direction}
                    />
                    {totalPages > 0 && ( // Show pagination only if there are pages
                        <div className="mt-6 flex justify-center">
                            <ReportsPaginationComponent
                                currentPage={currentPage + 1} // Convert 0-indexed to 1-indexed for component
                                totalPages={totalPages}
                                onPageChange={(oneIndexedPage) => setPage(oneIndexedPage - 1)} // Convert 1-indexed back to 0-indexed
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PlayersTabContent;