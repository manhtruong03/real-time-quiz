// src/components/game/host/views/HostLoadingView.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

interface HostLoadingViewProps {
    message?: string;
}

export const HostLoadingView: React.FC<HostLoadingViewProps> = ({ message = "Loading..." }) => (
    <div className="flex flex-col items-center justify-center text-center p-10 flex-grow">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">{message}</p>
    </div>
);