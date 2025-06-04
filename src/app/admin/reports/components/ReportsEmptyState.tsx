// src/app/admin/reports/components/ReportsEmptyState.tsx
import React from 'react';
import { FolderSearch } from 'lucide-react'; // Or use Info icon

export const ReportsEmptyState: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center text-muted-foreground">
            <FolderSearch className="mb-4 h-16 w-16" />
            <h3 className="mb-2 text-xl font-semibold">Không tìm thấy báo cáo nào</h3>
            <p>Hiện tại chưa có báo cáo phiên quiz nào được ghi nhận.</p>
            {/* Optionally, you could add a button/link here if there's a relevant action,
          e.g., "Xem hướng dẫn tạo quiz" or similar, but likely not needed for reports. */}
        </div>
    );
};
