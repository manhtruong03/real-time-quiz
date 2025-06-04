// src/components/game/player/views/PlayerKickedView.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button"; //
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"; //

export const PlayerKickedView: React.FC = () => {
    const router = useRouter();

    const handleReturnHome = () => {
        router.push("/"); // Navigate to the homepage
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 p-4">
            <Card className="w-full max-w-md text-center shadow-2xl">
                <CardHeader>
                    <CardTitle className="flex flex-col items-center justify-center text-2xl font-bold">
                        <AlertTriangle className="h-12 w-12 text-destructive mb-3" />
                        You Have Been Kicked
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-6">
                        The host has removed you from the game session.
                    </p>
                    <Button
                        onClick={handleReturnHome}
                        variant="destructive"
                        className="w-full"
                    >
                        Return to Home
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};