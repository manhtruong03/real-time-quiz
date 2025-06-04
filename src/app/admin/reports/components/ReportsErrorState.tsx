// src/app/admin/reports/components/ReportsErrorState.tsx
import React from 'react';
import { Button } from '@/src/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ReportsErrorStateProps {
    errorMessage?: string;
    onRetry: () => void;
}

export const ReportsErrorState: React.FC<ReportsErrorStateProps> = ({
    errorMessage = 'Đã có lỗi xảy ra khi tải danh sách báo cáo.',
    onRetry,
}) => {
    return (
        <div className="flex flex-col items-center justify-center rounded-md border border-destructive/50 bg-destructive/10 p-8 text-center text-destructive">
            <AlertCircle className="mb-4 h-12 w-12" />
            <h3 className="mb-2 text-xl font-semibold">Lỗi!</h3>
            <p className="mb-6">{errorMessage}</p>
            <Button onClick={onRetry} variant="destructive" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                <RotateCcw className="mr-2 h-4 w-4" />
                Thử lại
            </Button>
        </div>
    );
};
