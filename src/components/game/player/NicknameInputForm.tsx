// src/components/game/player/NicknameInputForm.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';

import { Input } from '@/src/components/ui/input';

import { Button } from '@/src/components/ui/button';

import { Loader2, UserPlus, RefreshCw, Pencil } from 'lucide-react'; // Import Pencil icon
import { useGameAssets } from '@/src/context/GameAssetsContext';
import { Avatar as AvatarType } from '@/src/lib/types/assets';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Skeleton } from '@/src/components/ui/skeleton';
import { AvatarSelectionPopup } from './AvatarSelectionPopup'; // Import the new popup component
import { cn } from '@/src/lib/utils'; // Import cn

interface NicknameInputFormProps {
    gamePin: string;
    nickname: string;
    onNicknameChange: (name: string) => void;

    onSubmit: () => Promise<boolean>;
    errorMessage: string | null;

    onAvatarSelected: (avatarId: string | null) => void;
}

export const NicknameInputForm: React.FC<NicknameInputFormProps> = ({
    gamePin,
    nickname,
    onNicknameChange,
    onSubmit,
    errorMessage,
    onAvatarSelected,
}) => {
    const [isJoining, setIsJoining] = useState(false);

    const { avatars, isLoading: assetsLoading, error: assetsError } = useGameAssets();
    const [selectedAvatar, setSelectedAvatar] = useState<AvatarType | null>(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false); // State to control popup visibility

    // --- Avatar Selection Logic (mostly unchanged from Stage 1) ---
    const selectRandomAvatar = () => {
        if (assetsLoading || assetsError || !avatars || avatars.length === 0) {
            return;
        }
        const activeAvatars = avatars.filter(a => a.is_active && a.image_file_path);
        if (activeAvatars.length > 0) {
            const randomIndex = Math.floor(Math.random() * activeAvatars.length);
            const randomAvatar = activeAvatars[randomIndex];
            setSelectedAvatar(randomAvatar);
            onAvatarSelected(randomAvatar.avatar_id);
            console.log("[NicknameForm] Random avatar selected:", randomAvatar.name, randomAvatar.avatar_id);
        } else {
            console.warn("[NicknameForm] No active avatars found to select from.");
            setSelectedAvatar(null);
            onAvatarSelected(null);
        }
    };

    useEffect(() => {
        if (!assetsLoading && !selectedAvatar) {
            selectRandomAvatar();
        }
    }, [assetsLoading, avatars, selectedAvatar]);

    // --- Handle Selection from Popup ---
    const handleAvatarSelectFromPopup = (avatar: AvatarType) => {
        setSelectedAvatar(avatar);
        onAvatarSelected(avatar.avatar_id); // Pass ID up
        setIsPopupOpen(false); // Close popup
    };

    // --- Handle Form Submission ---
    const handleSubmit = async () => {
        setIsJoining(true);

        if (selectedAvatar) {
            onAvatarSelected(selectedAvatar.avatar_id);
        } else {
            onAvatarSelected(null);
        }
        await onSubmit();

        setIsJoining(false);
    };

    const activeAvatars = avatars.filter(a => a.is_active && a.image_file_path);

    return (
        <>
            <div className="flex flex-col items-center justify-center min-h-screen p-4 from-green-100 to-teal-100 dark:from-green-900 dark:to-teal-900">
                <Card className="w-full max-w-sm shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center">Nhập biệt danh</CardTitle>
                        <CardDescription className="text-center text-muted-foreground">Game PIN: {gamePin}</CardDescription>

                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Avatar Display Area */}
                        <div className="flex flex-col items-center gap-2 mb-4">
                            <div className="relative group">
                                {/* Avatar Display */}
                                {assetsLoading ? (
                                    <Skeleton className="h-24 w-24 rounded-full" />
                                ) : selectedAvatar ? (
                                    <Avatar className="h-24 w-24 border-2 border-primary shadow-md cursor-pointer" onClick={() => setIsPopupOpen(true)}>
                                        <AvatarImage src={selectedAvatar.image_file_path ?? undefined} alt={selectedAvatar.name} />
                                        <AvatarFallback className="text-2xl">
                                            {selectedAvatar.name?.charAt(0).toUpperCase() || '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                ) : (
                                    <Avatar className="h-24 w-24 border-2 border-muted shadow-md bg-secondary cursor-pointer" onClick={() => setIsPopupOpen(true)}>
                                        <AvatarFallback className="text-2xl">?</AvatarFallback>
                                    </Avatar>
                                )}

                                {/* Edit Button */}
                                {!assetsLoading && activeAvatars.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className={cn(
                                            "absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-background/80 hover:bg-background transition-opacity",
                                            "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100" // Show on hover/focus
                                        )}
                                        onClick={() => setIsPopupOpen(true)}
                                        title="Choose Avatar"
                                        disabled={isJoining}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                )}

                                {/* Randomize Button (kept for convenience) */}
                                {!assetsLoading && activeAvatars.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className={cn(
                                            "absolute -bottom-1 -left-1 h-8 w-8 rounded-full bg-background/80 hover:bg-background transition-opacity",
                                            "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100" // Show on hover/focus
                                        )}
                                        onClick={selectRandomAvatar}
                                        title="Randomize Avatar"
                                        disabled={isJoining}
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            {/* Avatar Name Display */}
                            {assetsLoading ? (
                                <Skeleton className="h-4 w-20 mt-1" />
                            ) : (
                                <p className="text-sm text-muted-foreground h-4 mt-1">
                                    {selectedAvatar ? selectedAvatar.name : (assetsError ? "Lỗi khi tải hình đại diện" : "Không có hình đại diện")}
                                </p>
                            )}
                        </div>

                        <Input
                            type="text"

                            placeholder="Biệt danh của bạn"
                            value={nickname}
                            onChange={(e) => onNicknameChange(e.target.value)}
                            maxLength={25}
                            className="text-center text-lg h-12"

                            aria-label="Biệt danh"
                            disabled={isJoining}
                        />
                        {errorMessage && <p className="text-sm text-red-600 dark:text-red-400 text-center">{errorMessage}</p>}

                        <Button onClick={handleSubmit} className="w-full" size="lg" disabled={isJoining || !nickname.trim() || assetsLoading}>

                            {isJoining ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}

                            {isJoining ? 'Đang tham gia...' : 'Tham gia'}

                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Render the Popup */}
            <AvatarSelectionPopup
                open={isPopupOpen}
                onOpenChange={setIsPopupOpen}
                avatars={activeAvatars} // Pass only active ones
                currentSelectedId={selectedAvatar?.avatar_id ?? null}
                onSelect={handleAvatarSelectFromPopup} // Handle selection
            />
        </>
    );

};