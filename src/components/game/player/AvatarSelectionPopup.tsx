// src/components/game/player/AvatarSelectionPopup.tsx
"use client";

import React from "react";
import Image from "next/image";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/src/components/ui/dialog";

import { ScrollArea } from "@/src/components/ui/scroll-area";

import { Card, CardContent } from "@/src/components/ui/card";

import { Avatar as AvatarType } from "@/src/lib/types/assets"; // Import Avatar type

import { cn } from "@/src/lib/utils";


// --- Define the props for the memoized item ---
interface AvatarGridItemProps {
    avatar: AvatarType;
    isSelected: boolean;
    onSelect: (avatar: AvatarType) => void;
}

// --- Create a memoized component for the avatar item ---
const AvatarGridItem: React.FC<AvatarGridItemProps> = React.memo(({ avatar, isSelected, onSelect }) => {
    // console.log(`Rendering AvatarGridItem: ${avatar.name}`);
    return (
        <Card
            key={avatar.avatar_id}
            onClick={() => onSelect(avatar)}
            className={cn(
                "cursor-pointer transition-all hover:shadow-md overflow-hidden aspect-square flex items-center justify-center p-1",

                isSelected
                    ? "ring-2 ring-primary ring-offset-2"
                    : "ring-1 ring-transparent hover:ring-muted-foreground/50",
                !avatar.image_file_path && "bg-muted" // Add background if no image
            )}
            title={avatar.name} // Add title attribute for accessibility/hover

        >
            <CardContent className="p-0">

                {avatar.image_file_path ? (
                    <Image
                        src={avatar.image_file_path}
                        alt={avatar.name}
                        width={80} // Adjust size as needed
                        height={80}
                        className="object-contain w-full h-full"
                        unoptimized

                        loading="lazy" // Explicitly set lazy loading

                        onError={(e) => {
                            console.error(`Failed to load avatar image: ${avatar.image_file_path}`);
                            (e.currentTarget.style.display = 'none');
                            const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.style.display = 'flex';
                        }}
                    />
                ) : (
                    // Placeholder text for error or missing image
                    <span className="flex items-center justify-center text-xs text-muted-foreground" style={{ display: avatar.image_file_path ? 'none' : 'flex' }}>
                        ?
                    </span>

                )}
            </CardContent>
        </Card>
    );
});
AvatarGridItem.displayName = 'AvatarGridItem'; // Set display name for DevTools

// --- Main Dialog Component ---
interface AvatarSelectionPopupProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    avatars: AvatarType[]; // Receive the list of avatars
    currentSelectedId: string | null;
    onSelect: (avatar: AvatarType) => void;
}

export const AvatarSelectionPopup: React.FC<AvatarSelectionPopupProps> = ({
    open,
    onOpenChange,
    avatars,
    currentSelectedId,
    onSelect,
}) => {

    const handleSelect = (avatar: AvatarType) => {
        onSelect(avatar);
        onOpenChange(false); // Close dialog on selection
    };

    const activeAvatars = avatars.filter(a => a.is_active && a.image_file_path);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] max-h-[70vh] flex flex-col">

                <DialogHeader>

                    <DialogTitle>Chọn hình đại diện của bạn</DialogTitle>
                    <DialogDescription>
                        Chọn một hình đại diện để đại diện cho bạn trong trò chơi.
                    </DialogDescription>

                </DialogHeader>

                <ScrollArea className="flex-grow overflow-y-auto pr-4 -mr-4">

                    <div className="grid grid-cols-4 gap-3 py-4">
                        {activeAvatars.length > 0 ? (
                            activeAvatars.map((avatar) => (
                                <AvatarGridItem
                                    key={avatar.avatar_id}
                                    avatar={avatar}
                                    isSelected={currentSelectedId === avatar.avatar_id}
                                    onSelect={handleSelect}
                                />
                            ))
                        ) : (
                            <p className="col-span-4 text-center text-muted-foreground">Không có hình đại diện nào khả dụng.</p>
                        )}
                    </div>
                </ScrollArea>
                {/* Optional Footer for close button if needed */}
            </DialogContent>
        </Dialog>
    );
};