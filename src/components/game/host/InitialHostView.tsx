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
        <h1 className="text-3xl font-bold mb-6">Start New Quiz Game</h1>
        <p className="text-muted-foreground mb-6">Click the button below to generate a game pin and start hosting.</p>
        <Button size="lg" onClick={onStartGameClick} disabled={isQuizLoading || isDisabled}>
            {isQuizLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isQuizLoading ? 'Loading Quiz...' : 'Get Game Pin & Start Hosting'}
        </Button>
    </div>
);