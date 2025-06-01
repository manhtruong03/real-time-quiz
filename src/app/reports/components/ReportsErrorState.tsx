// src/app/reports/components/ReportsErrorState.tsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/src/components/ui/button';

interface ReportsErrorStateProps {
    error: string | null;
    onRetry: () => void;
}

export const ReportsErrorState: React.FC<ReportsErrorStateProps> = ({ error, onRetry }) => {
    return (
        <div className="text-center py-16 border border-dashed border-destructive/50 rounded-lg bg-destructive/10 text-destructive-foreground">
            <AlertTriangle className="mx-auto h-16 w-16 mb-6" />
            <h3 className="text-2xl font-semibold mb-3">
                Rất tiếc, đã xảy ra lỗi
            </h3>
            <p className="mb-8 max-w-md mx-auto">
                {error || "Không thể tải lịch sử phiên của bạn. Vui lòng kiểm tra kết nối mạng và thử lại."}
            </p>
            <Button
                variant="outline"
                onClick={onRetry}
                className="border-destructive text-destructive-foreground hover:bg-destructive/20 hover:text-destructive-foreground focus:ring-destructive"
                size="lg"
            >
                Thử lại
            </Button>
        </div>
    );
};