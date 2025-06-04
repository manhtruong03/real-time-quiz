// src/components/game/host/InitialHostView.tsx
import React from 'react';
import { Button } from "@/src/components/ui/button";
import { Loader2 } from 'lucide-react';

interface InitialHostViewProps {
    onStartGameClick: () => void;
    isQuizLoading: boolean;
    isDisabled: boolean;
}

export const InitialHostView: React.FC<InitialHostViewProps> = ({
    onStartGameClick,
    isQuizLoading,
    isDisabled,
}) => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-3xl font-bold mb-6">Bắt đầu phiên đố mới</h1>
        <p className="text-muted-foreground mb-6">Nhấp vào nút bên dưới để tạo mã PIN trò chơi và bắt đầu tổ chức.</p>
        <Button size="lg" onClick={onStartGameClick} disabled={isQuizLoading || isDisabled}>
            {isQuizLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isQuizLoading ? 'Đang tải câu đố...' : 'Nhận mã PIN & Bắt đầu tổ chức'}
        </Button>
    </div>
);