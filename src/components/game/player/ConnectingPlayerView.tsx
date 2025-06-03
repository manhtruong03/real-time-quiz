// src/components/game/player/ConnectingPlayerView.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

interface ConnectingPlayerViewProps {
    message: string;
}

export const ConnectingPlayerView: React.FC<ConnectingPlayerViewProps> = ({ message }) => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-center">{message}</p>
    </div>
);