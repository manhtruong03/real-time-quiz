// src/components/game/player/PinInputForm.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Loader2, LogIn } from 'lucide-react';

interface PinInputFormProps {
    gamePin: string;
    onGamePinChange: (pin: string) => void;
    onSubmit: () => void;
    errorMessage: string | null;
    isConnecting: boolean; // Use to disable button
}

export const PinInputForm: React.FC<PinInputFormProps> = ({
    gamePin,
    onGamePinChange,
    onSubmit,
    errorMessage,
    isConnecting,
}) => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900">
        <Card className="w-full max-w-sm shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">Join Game</CardTitle>
                <CardDescription className="text-center text-muted-foreground">Enter the 6 or 7 digit PIN.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input
                    type="number"
                    placeholder="Game PIN"
                    value={gamePin}
                    onChange={(e) => onGamePinChange(e.target.value.replace(/[^0-9]/g, '').slice(0, 7))}
                    className="text-center text-2xl h-14 tracking-widest"
                    maxLength={7}
                    aria-label="Game PIN"
                    disabled={isConnecting}
                />
                {errorMessage && <p className="text-sm text-red-600 dark:text-red-400 text-center">{errorMessage}</p>}
                <Button onClick={onSubmit} className="w-full" size="lg" disabled={isConnecting}>
                    {isConnecting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
                    {isConnecting ? 'Connecting...' : 'Enter'}
                </Button>
            </CardContent>
        </Card>
    </div>
);