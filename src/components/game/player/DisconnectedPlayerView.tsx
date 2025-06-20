// src/components/game/player/DisconnectedPlayerView.tsx
import React from 'react';
import { Button } from '@/src/components/ui/button';
import { WifiOff } from 'lucide-react';

interface DisconnectedPlayerViewProps {
    errorMessage: string | null;
    onJoinNewGame: () => void;
}

export const DisconnectedPlayerView: React.FC<DisconnectedPlayerViewProps> = ({ errorMessage, onJoinNewGame }) => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <WifiOff className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Mất kết nối</h2>
        <p className="text-muted-foreground mb-4">{errorMessage || "Mất kết nối. Vui lòng thử tham gia lại."}</p>
        <Button onClick={onJoinNewGame}>Tham gia phiên quiz mới</Button>
    </div>
);