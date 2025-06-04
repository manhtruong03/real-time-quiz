// src/components/game/settings/GameSettingsDialog.tsx
"use client";

import React, { useMemo } from "react"; // Add useMemo if not already there
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
// --- Define the props for the memoized item ---
interface BackgroundItemProps {
    bg: Background;
    isSelected: boolean;
    onSelect: (id: string) => void;
}

// --- Create a memoized component for the background item ---
const BackgroundItem: React.FC<BackgroundItemProps> = React.memo(({ bg, isSelected, onSelect }) => {
    // console.log(`Rendering BackgroundItem: ${bg.name}`); // Add log to check re-renders
    return (
        <Card
            key={bg.background_id} // Key remains important for React lists
            onClick={() => onSelect(bg.background_id)}
            className={cn(
                "cursor-pointer transition-all hover:shadow-md overflow-hidden",
                isSelected
                    ? "ring-2 ring-primary ring-offset-2"
                    : "ring-1 ring-transparent"
            )}
            title={bg.name} // Add title attribute for accessibility/hover
        >
            <CardContent className="p-0 flex flex-col">
                {/* Thumbnail Area */}
                <div className="aspect-video w-full bg-muted flex items-center justify-center overflow-hidden relative"> {/* Added relative positioning */}
                    {bg.background_file_path ? (
                        <Image
                            src={bg.background_file_path}
                            alt={bg.name}
                            width={160}
                            height={90}
                            className="object-cover w-full h-full"
                            unoptimized
                            // Consider adding priority={false} explicitly if lazy loading is desired
                            // priority={false} // Default is false, but can be explicit
                            loading="lazy" // Explicitly set lazy loading
                            onError={(e) => {
                                console.error(`Failed to load background image: ${bg.background_file_path}`);
                                // Optionally hide or show a placeholder on error
                                (e.currentTarget.style.display = 'none');
                                // Find the placeholder span and display it
                                const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                                if (placeholder) placeholder.style.display = 'flex';
                            }}
                        />
                    ) : bg.background_color ? (
                        <div
                            className="w-full h-full"
                            style={{ backgroundColor: bg.background_color }}
                        />
                    ) : null}
                    {/* Placeholder text for error or missing image/color */}
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground" style={{ display: (bg.background_file_path || bg.background_color) ? 'none' : 'flex' }}>
                        Không xem trước
                    </span>
                </div>
                {/* Name Area */}
                <div className="p-2 text-center">
                    <p className="text-xs font-medium truncate text-card-foreground">{bg.name}</p>
                </div>
            </CardContent>
        </Card>
    );
});
BackgroundItem.displayName = 'BackgroundItem'; // Set display name for DevTools

// --- Main Dialog Component ---
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
                        <DialogTitle>Cài đặt</DialogTitle>
                        <DialogDescription>Đang tải tài nguyên...</DialogDescription>
                    </DialogHeader>
                    <p>Đang tải...</p>
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
                        <DialogTitle>Lỗi</DialogTitle>
                        <DialogDescription>Không thể tải tài nguyên trò chơi.</DialogDescription>
                    </DialogHeader>
                    <p className="text-destructive">{error}</p>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
                {/* ... DialogHeader ... */}
                <DialogHeader>
                    <DialogTitle>Cài đặt</DialogTitle>
                    <DialogDescription>
                        Tùy chỉnh giao diện và âm thanh sảnh trò chơi của bạn.
                    </DialogDescription>
                </DialogHeader>

                {/* Use ScrollArea for potentially long content */}
                <ScrollArea className="flex-grow overflow-y-auto pr-4 -mr-4"> {/* Adjust padding */}
                    <div className="grid gap-6 py-4">
                        {/* --- Background Selection --- */}
                        <div>
                            <h4 className="font-medium mb-3 text-foreground">Hình nền</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {backgrounds.filter(bg => bg.is_active).map((bg) => (
                                    // --- Use the memoized component ---
                                    <BackgroundItem
                                        key={bg.background_id}
                                        bg={bg}
                                        isSelected={selectedBackgroundId === bg.background_id}
                                        onSelect={onBackgroundSelect}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* --- Sound Selection --- */}
                        <div>
                            <h4 className="font-medium mb-3 text-foreground">Nhạc nền</h4>
                            <Select
                                value={selectedSoundId ?? ""} // Use selected ID from props
                                onValueChange={onSoundSelect} // Call prop handler on change
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Chọn nhạc nền..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {lobbySounds.map((sound) => (
                                        <SelectItem key={sound.sound_id} value={sound.sound_id}>
                                            {sound.name}
                                        </SelectItem>
                                    ))}
                                    {lobbySounds.length === 0 && (
                                        <SelectItem value="none" disabled>Không có nhạc nền nào khả dụng</SelectItem>
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