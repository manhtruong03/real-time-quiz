// src/components/game/player/NicknameInputForm.tsx
import React, { useState } from 'react'; // Add useState for button loading
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Loader2, UserPlus } from 'lucide-react'; // Import Loader2

interface NicknameInputFormProps {
    gamePin: string;
    nickname: string;
    onNicknameChange: (name: string) => void;
    onSubmit: () => Promise<boolean>; // Indicate it's async
    errorMessage: string | null;
}

export const NicknameInputForm: React.FC<NicknameInputFormProps> = ({
    gamePin,
    nickname,
    onNicknameChange,
    onSubmit,
    errorMessage,
}) => {
    const [isJoining, setIsJoining] = useState(false); // Local loading state for button

    const handleSubmit = async () => {
        setIsJoining(true);
        await onSubmit(); // Call the async function passed via props
        setIsJoining(false); // Reset loading state regardless of success/fail (page state will change)
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900 dark:to-teal-900">
            <Card className="w-full max-w-sm shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Enter Nickname</CardTitle>
                    <CardDescription className="text-center text-muted-foreground">Game PIN: {gamePin}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input
                        type="text"
                        placeholder="Your Nickname"
                        value={nickname}
                        onChange={(e) => onNicknameChange(e.target.value)}
                        maxLength={25}
                        className="text-center text-lg h-12"
                        aria-label="Nickname"
                        disabled={isJoining} // Disable input while joining
                    />
                    {errorMessage && <p className="text-sm text-red-600 dark:text-red-400 text-center">{errorMessage}</p>}
                    <Button onClick={handleSubmit} className="w-full" size="lg" disabled={isJoining || !nickname.trim()}>
                        {isJoining ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
                        {isJoining ? 'Joining...' : 'Join Game'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};