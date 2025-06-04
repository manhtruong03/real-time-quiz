// src/components/game/host/lobby/ParticipantListItem.tsx
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Button, buttonVariants } from '@/src/components/ui/button';
import { UserX } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/src/components/ui/alert-dialog';
import { LivePlayerState } from '@/src/lib/types';
import { useGameAssets } from '@/src/context/GameAssetsContext';
import { cn } from '@/src/lib/utils';

interface ParticipantListItemProps {
    participant: LivePlayerState;
    onKickPlayer: (playerId: string) => void;
    className?: string;
}

export const ParticipantListItem: React.FC<ParticipantListItemProps> = ({
    participant,
    onKickPlayer,
    className,
}) => {
    const { avatars, isLoading: assetsLoading } = useGameAssets();

    const avatarUrl = React.useMemo(() => {
        if (assetsLoading || !participant.avatarId || !avatars) {
            return null;
        }
        return avatars.find(a => a.avatar_id === participant.avatarId)?.image_file_path ?? null;
    }, [participant.avatarId, avatars, assetsLoading]);

    const handleKickConfirm = (e: React.MouseEvent) => {
        e.stopPropagation();
        onKickPlayer(participant.cid);
    };

    return (
        // Back to flex row, items-center, group for hover
        <div
            className={cn(
                "group relative flex items-center gap-2 p-2 rounded-md border bg-background/60 backdrop-blur-sm shadow-sm min-w-[120px] max-w-[180px] transition-colors hover:bg-muted/70", // Removed text-center from root
                className
            )}
        >
            {/* Avatar (Flex Shrink 0) */}
            <Avatar className="h-8 w-8 flex-shrink-0 border">
                {assetsLoading ? (
                    <div className="h-full w-full rounded-full bg-muted animate-pulse"></div>
                ) : (
                    <>
                        <AvatarImage src={avatarUrl ?? undefined} alt={participant.nickname} />
                        <AvatarFallback className="text-xs">
                            {participant.nickname?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                    </>
                )}
            </Avatar>

            {/* Nickname Wrapper (Flex Grow, Centered Text) */}
            <div className="flex-grow text-center overflow-hidden mr-4"> {/* Added margin-right for kick button space */}
                <span className="font-medium text-xs break-words whitespace-normal"> {/* Removed w-full */}
                    {participant.nickname}
                </span>
            </div>

            {/* Kick Button (Absolutely positioned) */}
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0 transition-opacity duration-150" // Adjusted positioning slightly if needed
                        aria-label={`Đuổi ${participant.nickname}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <UserX className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Đuổi người chơi?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc muốn đuổi <strong className="text-foreground">{participant.nickname}</strong> ra khỏi trò chơi không?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleKickConfirm} className={cn(buttonVariants({ variant: "destructive" }))}>
                            Đuổi người chơi
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};