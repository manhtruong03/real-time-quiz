// src/app/reports/page.tsx
"use client";

import React from 'react';
import { AppHeader } from '@/src/components/layout/AppHeader';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';
import { Brain } from 'lucide-react';

// Import new components
import { ReportsPageHeader } from './components/ReportsPageHeader';
import { SessionReportList } from './components/SessionReportList';
import { ReportsPaginationComponent } from './components/ReportsPagination';
import { ReportsLoadingSkeleton } from './components/ReportsLoadingSkeleton';
import { ReportsEmptyState } from './components/ReportsEmptyState';
import { ReportsErrorState } from './components/ReportsErrorState';

// Import the new hook
import { useUserReportsData } from './hooks/useUserReportsData';

const ReportsPageContent: React.FC = () => {
    const {
        reports,
        totalPages,
        currentPage,
        isLoading,
        error,
        handlePageChange,
        retryLoadReports,
        totalElements
    } = useUserReportsData(0, 9); // 0-indexed initial page, 9 items per page

    const currentYear = new Date().getFullYear();

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            <AppHeader />

            <main className="flex-1 py-8 md:py-12">
                <div className="container mx-auto px-4">
                    <ReportsPageHeader totalReports={totalElements} />

                    {isLoading && <ReportsLoadingSkeleton itemCount={9} />}
                    {!isLoading && error && <ReportsErrorState error={error} onRetry={retryLoadReports} />}
                    {!isLoading && !error && reports.length === 0 && <ReportsEmptyState />}
                    {!isLoading && !error && reports.length > 0 && (
                        <>
                            <SessionReportList reports={reports} />
                            <ReportsPaginationComponent
                                currentPage={currentPage} // hook provides 0-indexed
                                totalPages={totalPages}
                                onPageChange={handlePageChange} // expects 0-indexed
                            />
                        </>
                    )}
                </div>
            </main>

            <footer className="bg-muted/30 border-t border-border py-8 mt-auto">
                <div className="container mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Brain className="h-7 w-7 text-primary" />
                        <span className="text-xl font-bold text-foreground">VUI QUIZ</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        &copy; {currentYear} VUI QUIZ. Đã đăng ký Bản quyền.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default function ReportsPage() {
    return (
        <ProtectedRoute>
            <ReportsPageContent />
        </ProtectedRoute>
    );
}