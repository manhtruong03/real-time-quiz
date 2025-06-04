// src/app/admin/images/components/ImagesErrorState.tsx
"use client";

import React from 'react';
import { Button } from '@/src/components/ui/button'; //
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ImagesErrorStateProps {
    error: Error;
    onRetry: () => void;
}

const ImagesErrorState: React.FC<ImagesErrorStateProps> = ({ error, onRetry }) => {
    return (
        <div className="text-center py-10 text-destructive flex flex-col items-center">
            <AlertTriangle className="h-12 w-12 mb-4" />
            <p className="text-xl font-semibold mb-2">Lỗi tải dữ liệu hình ảnh</p>
            <p className="mb-1 text-sm text-text-secondary">
                Đã xảy ra sự cố khi cố gắng tải danh sách hình ảnh.
            </p>
            {error?.message && (
                <p className="mb-4 text-xs text-muted-foreground bg-destructive/10 p-2 rounded-md max-w-md">
                    Chi tiết lỗi: {error.message}
                </p>
            )}
            <Button onClick={onRetry} variant="outline" className="mt-2">
                <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
            </Button>
        </div>
    );
};

export default ImagesErrorState;