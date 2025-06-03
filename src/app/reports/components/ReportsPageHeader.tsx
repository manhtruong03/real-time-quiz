// src/app/reports/components/ReportsPageHeader.tsx
import React from 'react';

interface ReportsPageHeaderProps {
    totalReports?: number; // Optional: if you want to display total count
}

export const ReportsPageHeader: React.FC<ReportsPageHeaderProps> = ({ totalReports }) => {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Lịch sử phiên Quiz
            </h1>
            {/* No create button, but you could add filters or other actions here if needed */}
            {totalReports !== undefined && totalReports > 0 && (
                <p className="text-muted-foreground mt-2 sm:mt-0">Tổng cộng: {totalReports} phiên</p>
            )}
        </div>
    );
};