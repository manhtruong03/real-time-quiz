// src/app/reports/components/SessionReportList.tsx
import React from 'react';
import { SessionReportCard, SessionReportCardProps } from './SessionReportCard'; // Assuming UserSessionHistoryItemDto is part of SessionReportCardProps
import type { UserSessionHistoryItemDto } from '@/src/lib/types/api';

interface SessionReportListProps {
    reports: UserSessionHistoryItemDto[];
}

export const SessionReportList: React.FC<SessionReportListProps> = ({ reports }) => {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
                <SessionReportCard key={report.sessionId} report={report} />
            ))}
        </div>
    );
};