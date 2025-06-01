// src/app/my-quizzes/components/MyQuizzesErrorState.tsx
"use client";

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert';
import { Button } from '@/src/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface MyQuizzesErrorStateProps {
    error: string | null;
    onRetry: () => void;
}

const MyQuizzesErrorState: React.FC<MyQuizzesErrorStateProps> = ({ error, onRetry }) => {
    if (!error) return null;

    return (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive text-destructive-foreground">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lỗi tải Quiz</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 border-destructive text-destructive-foreground hover:bg-destructive/20">
                Thử lại
            </Button>
        </Alert>
    );
};

export default MyQuizzesErrorState;