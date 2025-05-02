// src/components/game/host/DisconnectedHostView.tsx
import React from 'react';
import { Button } from "@/src/components/ui/button";
import { WifiOff } from 'lucide-react';

interface DisconnectedHostViewProps {
    onStartNewGame: () => void;
    onReconnect?: () => void; // Optional reconnect handler
    gamePin?: string | null; // Optional pin for reconnect button
}

export const DisconnectedHostView: React.FC<DisconnectedHostViewProps> = ({
    onStartNewGame,
    onReconnect,
    gamePin
}) => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <WifiOff className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Disconnected</h2>
        <p className="text-muted-foreground mb-4">The WebSocket connection was closed.</p>
        <Button onClick={onStartNewGame}>Start New Game</Button>
        {onReconnect && gamePin && (
            <Button variant="outline" className="mt-2" onClick={onReconnect}>
                Reconnect (Pin: {gamePin})
            </Button>
        )}
    </div>
);