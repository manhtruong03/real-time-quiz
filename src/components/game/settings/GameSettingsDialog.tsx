// src/components/game/settings/GameSettingsDialog.tsx
"use client";

import React from "react";
import Image from "next/image";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter, // If needed later
} from "@/src/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { useGameAssets } from "@/src/context/GameAssetsContext";
import type { Background, Sound } from "@/src/lib/types/assets";
import { cn } from "@/src/lib/utils";

interface GameSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // Props to receive selected IDs and callbacks to update them in HostView
    selectedBackgroundId: string | null;
    onBackgroundSelect: (id: string) => void;
    selectedSoundId: string | null;
    onSoundSelect: (id: string) => void;
}

export const GameSettingsDialog: React.FC<GameSettingsDialogProps> = ({
    open,
    onOpenChange,
    selectedBackgroundId,
    onBackgroundSelect,
    selectedSoundId,
    onSoundSelect,
}) => {
    const { backgrounds, sounds, isLoading, error } = useGameAssets();

    // Filter for lobby sounds only
    const lobbySounds = React.useMemo(() => {
        return sounds.filter(s => s.sound_type === 'LOBBY' && s.is_active);
    }, [sounds]);

    if (isLoading) {
        // Optional: Render a loading state inside the dialog
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Game Settings</DialogTitle>
                        <DialogDescription>Loading assets...</DialogDescription>
                    </DialogHeader>
                    <p>Loading...</p>
                </DialogContent>
            </Dialog>
        );
    }

    if (error) {
        // Optional: Render an error state
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Error</DialogTitle>
                        <DialogDescription>Could not load game assets.</DialogDescription>
                    </DialogHeader>
                    <p className="text-destructive">{error}</p>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Game Settings</DialogTitle>
                    <DialogDescription>
                        Customize the look and sound of your game lobby.
                    </DialogDescription>
                </DialogHeader>

                {/* Use ScrollArea for potentially long content */}
                <ScrollArea className="flex-grow overflow-y-auto pr-4 -mr-4"> {/* Adjust padding */}
                    <div className="grid gap-6 py-4">
                        {/* --- Background Selection --- */}
                        <div>
                            <h4 className="font-medium mb-3 text-foreground">Lobby Background</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {backgrounds.filter(bg => bg.is_active).map((bg) => (
                                    <Card
                                        key={bg.background_id}
                                        onClick={() => onBackgroundSelect(bg.background_id)}
                                        className={cn(
                                            "cursor-pointer transition-all hover:shadow-md overflow-hidden",
                                            selectedBackgroundId === bg.background_id
                                                ? "ring-2 ring-primary ring-offset-2"
                                                : "ring-1 ring-transparent"
                                        )}
                                    >
                                        <CardContent className="p-0 flex flex-col">
                                            {/* Thumbnail Area */}
                                            <div className="aspect-video w-full bg-muted flex items-center justify-center overflow-hidden">
                                                {bg.background_file_path ? (
                                                    <Image
                                                        src={bg.background_file_path}
                                                        alt={bg.name}
                                                        width={160} // Example size, adjust as needed
                                                        height={90}
                                                        className="object-cover w-full h-full"
                                                        unoptimized // Consider if optimization needed here
                                                        onError={(e) => (e.currentTarget.style.display = 'none')} // Hide on error
                                                    />
                                                ) : bg.background_color ? (
                                                    <div
                                                        className="w-full h-full"
                                                        style={{ backgroundColor: bg.background_color }}
                                                    />
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">No Preview</span>
                                                )}
                                            </div>
                                            {/* Name Area */}
                                            <div className="p-2 text-center">
                                                <p className="text-xs font-medium truncate text-card-foreground">{bg.name}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* --- Sound Selection --- */}
                        <div>
                            <h4 className="font-medium mb-3 text-foreground">Lobby Music</h4>
                            <Select
                                value={selectedSoundId ?? ""} // Use selected ID from props
                                onValueChange={onSoundSelect} // Call prop handler on change
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select lobby music..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {lobbySounds.map((sound) => (
                                        <SelectItem key={sound.sound_id} value={sound.sound_id}>
                                            {sound.name}
                                        </SelectItem>
                                    ))}
                                    {lobbySounds.length === 0 && (
                                        <SelectItem value="none" disabled>No lobby music available</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </ScrollArea>

                {/* Optional Footer for close button if needed */}
                {/* <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter> */}
            </DialogContent>
        </Dialog>
    );
};