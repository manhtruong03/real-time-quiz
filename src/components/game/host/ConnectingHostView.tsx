// src/components/game/host/ConnectingHostView.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

interface ConnectingHostViewProps {
    message: string;
}

export const ConnectingHostView: React.FC<ConnectingHostViewProps> = ({ message }) => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-center">{message}</p>
    </div>
);