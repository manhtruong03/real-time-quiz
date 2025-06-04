// src/components/game/host/ErrorHostView.tsx
import React from 'react';
import { Button } from "@/src/components/ui/button";
import { WifiOff } from 'lucide-react';

interface ErrorHostViewProps {
    errorMessage: string | null;
    onRetry: () => void;
}

export const ErrorHostView: React.FC<ErrorHostViewProps> = ({ errorMessage, onRetry }) => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <WifiOff className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive mb-2">Thất bại</h2>
        <p className="text-muted-foreground mb-4">{errorMessage || "Lỗi không xác định."}</p>
        <Button onClick={onRetry}>Thử lại</Button>
    </div>
);