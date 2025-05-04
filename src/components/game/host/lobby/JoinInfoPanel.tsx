// src/components/game/host/lobby/JoinInfoPanel.tsx
"use client"; // Needed for useState, navigator.clipboard

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/src/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/src/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/src/components/ui/tooltip';
import { Card, CardContent } from '@/src/components/ui/card'; // Use Card for consistent styling
import { Copy, QrCode } from 'lucide-react';
import { cn } from '@/src/lib/utils';
// Optional: Import useToast for copy feedback
// import { useToast } from '@/src/components/ui/use-toast';

interface JoinInfoPanelProps {
    gamePin: string | null;
    accessUrl: string; // e.g., "VuiQuiz.com"
    className?: string;
}

export const JoinInfoPanel: React.FC<JoinInfoPanelProps> = ({
    gamePin,
    accessUrl,
    className,
}) => {
    const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
    const [copyTooltipText, setCopyTooltipText] = useState('Copy PIN');
    // Optional: const { toast } = useToast();

    const joinUrl = `https://${accessUrl}`; // Construct full URL
    // Value for QR Code - using the PIN is usually best for mobile scanning
    const qrValue = gamePin ?? '';

    const handleCopyPin = async () => {
        if (!gamePin) return;
        try {
            await navigator.clipboard.writeText(gamePin);
            setCopyTooltipText('Copied!');
            // Optional: Show toast notification
            // toast({ title: "Success", description: "Game PIN copied to clipboard!" });
            setTimeout(() => setCopyTooltipText('Copy PIN'), 2000); // Reset tooltip after 2 seconds
        } catch (err) {
            console.error('Failed to copy PIN: ', err);
            setCopyTooltipText('Failed to copy');
            // Optional: Show error toast
            // toast({ variant: "destructive", title: "Error", description: "Could not copy PIN." });
            setTimeout(() => setCopyTooltipText('Copy PIN'), 2000);
        }
    };

    return (
        <Card className={cn("w-full bg-card/80 dark:bg-card/60 backdrop-blur-md shadow-lg border border-border/50 overflow-hidden", className)}>
            <CardContent className="p-4 md:p-6 flex flex-col md:flex-row items-center justify-around gap-4 md:gap-6">

                {/* Left Side: Text Instructions & PIN */}
                <div className="flex flex-col items-center text-center md:items-start md:text-left">
                    <p className="text-lg font-medium text-card-foreground">
                        Join at <a href={joinUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">{accessUrl}</a>
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">Enter Game PIN:</p>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-5xl md:text-6xl lg:text-7xl font-bold text-primary tracking-widest break-all">
                            {gamePin || '------'}
                        </span>
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleCopyPin}
                                        disabled={!gamePin}
                                        className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-foreground"
                                        aria-label="Copy Game PIN"
                                    >
                                        <Copy className="h-4 w-4 md:h-5 md:w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{copyTooltipText}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                {/* Right Side: QR Code */}
                <div className="flex-shrink-0">
                    <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DialogTrigger asChild>
                                        <div
                                            className={cn(
                                                "p-2 bg-white rounded-lg shadow-md cursor-pointer hover:scale-105 transition-transform duration-150",
                                                !gamePin && "opacity-50 cursor-not-allowed" // Dim if no PIN
                                            )}
                                            onClick={(e) => { if (!gamePin) e.preventDefault(); }} // Prevent trigger if no PIN
                                            aria-label="Show QR Code"
                                        >
                                            <QRCodeSVG
                                                value={qrValue}
                                                size={80} // Smaller inline size
                                                bgColor={"#ffffff"}
                                                fgColor={"#000000"}
                                                level={"Q"}
                                                includeMargin={false}
                                            />
                                        </div>
                                    </DialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Show QR Code</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <DialogContent className="sm:max-w-[300px] p-6 flex flex-col items-center">
                            <DialogHeader className="mb-4">
                                <DialogTitle className="text-center">Scan to Join</DialogTitle>
                            </DialogHeader>
                            <div className="p-4 bg-white rounded-lg">
                                <QRCodeSVG
                                    value={qrValue}
                                    size={240} // Larger size for dialog
                                    bgColor={"#ffffff"}
                                    fgColor={"#000000"}
                                    level={"Q"}
                                    includeMargin={true}
                                />
                            </div>
                            <p className="mt-4 text-center text-lg font-semibold text-primary">{gamePin}</p>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    );
};