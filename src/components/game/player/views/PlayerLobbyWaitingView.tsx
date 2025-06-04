// src/components/game/player/views/PlayerLobbyWaitingView.tsx
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';

import { Button } from '@/src/components/ui/button';

import { Pencil } from 'lucide-react';

import { cn } from '@/src/lib/utils';


interface PlayerLobbyWaitingViewProps {
    nickname: string;
    avatarUrl: string | null;
    onEditAvatar: () => void; // Callback to open the avatar popup
}

export const PlayerLobbyWaitingView: React.FC<PlayerLobbyWaitingViewProps> = ({
    nickname,
    avatarUrl,
    onEditAvatar,
}) => {
    return (
        <div className="flex flex-col items-center justify-center text-center p-6 md:p-10 flex-grow">
            {/* Centered Avatar and Nickname */}
            <div className="relative group mb-4">
                <Avatar className="h-28 w-28 md:h-32 md:h-32 border-4 border-primary shadow-lg">
                    <AvatarImage src={avatarUrl ?? undefined} alt={nickname} />
                    <AvatarFallback className="text-4xl">
                        {nickname?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                </Avatar>
                {/* Edit Button */}
                <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                        "absolute -bottom-2 -right-2 h-9 w-9 rounded-full bg-background/90 hover:bg-background transition-opacity",
                        "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100" // Show on hover/focus
                    )}
                    onClick={onEditAvatar}
                    title="Choose Avatar"
                >
                    <Pencil className="h-5 w-5" />
                </Button>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4">{nickname || 'Player'}</h3>

            {/* Confirmation Text */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-md">
                Bạn đã tham gia! Thấy biệt danh của bạn trên màn hình người tổ chức chưa?
            </p>
            <p className="text-sm mt-6 text-muted-foreground/80">
                Đang chờ người tổ chức bắt đầu...
            </p>
        </div>
    );
};