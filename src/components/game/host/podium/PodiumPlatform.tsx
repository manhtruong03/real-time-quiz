// src/components/game/host/podium/PodiumPlatform.tsx
import React from 'react';
import { LivePlayerState } from '@/src/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/src/components/ui/card'; // Removed CardTitle
import { useGameAssets } from '@/src/context/GameAssetsContext';
import { cn } from '@/src/lib/utils';
import { Trophy, Award, Medal } from 'lucide-react'; // Added more icon options

interface PodiumPlatformProps {
    player: LivePlayerState;
    position: 1 | 2 | 3;
}

export const PodiumPlatform: React.FC<PodiumPlatformProps> = ({ player, position }) => {
    const { avatars, isLoading: assetsLoading } = useGameAssets();

    const avatarUrl = React.useMemo(() => {
        if (assetsLoading || !player.avatarId || !avatars || avatars.length === 0) {
            return null;
        }
        return avatars.find(a => a.avatar_id === player.avatarId)?.image_file_path ?? null;
    }, [player.avatarId, avatars, assetsLoading]);

    const platformStyles = {
        1: { // 1st place
            heightClass: 'min-h-[16rem] md:min-h-[20rem]', // Use min-height for better scaling
            colorClass: 'bg-yellow-500/90 border-yellow-400 shadow-yellow-500/50',
            textColor: 'text-yellow-900', // Darker text for gold
            icon: <Trophy className="h-6 w-6 md:h-7 md:w-7 text-yellow-700" />,
            rankText: '1st Place',
            scaleClass: "scale-105 z-20", // Most prominent
            orderClass: "md:order-2 order-1", // Center on md, first on sm
        },
        2: { // 2nd place
            heightClass: 'min-h-[14rem] md:min-h-[18rem]',
            colorClass: 'bg-slate-400/90 border-slate-300 shadow-slate-400/50',
            textColor: 'text-slate-800', // Darker text for silver
            icon: <Award className="h-5 w-5 md:h-6 md:w-6 text-slate-600" />,
            rankText: '2nd Place',
            scaleClass: "z-10",
            orderClass: "md:order-1 order-2",
        },
        3: { // 3rd place
            heightClass: 'min-h-[12rem] md:min-h-[16rem]',
            colorClass: 'bg-orange-600/90 border-orange-500 shadow-orange-600/50',
            textColor: 'text-orange-100', // Lighter text for bronze
            icon: <Medal className="h-5 w-5 md:h-6 md:w-6 text-orange-300" />,
            rankText: '3rd Place',
            scaleClass: "z-0",
            orderClass: "md:order-3 order-3",
        },
    };

    const styles = platformStyles[position];

    return (
        <Card className={cn(
            "flex flex-col items-center justify-end p-3 pt-6 md:p-4 md:pt-8 text-center shadow-2xl transform transition-all duration-500 w-full mx-auto rounded-t-lg", // Rounded top
            styles.heightClass,
            styles.colorClass,
            styles.scaleClass,
            "border-b-8"
        )}>
            <CardHeader className="p-0 mb-2 md:mb-4">
                <Avatar className="h-16 w-16 md:h-24 md:w-24 border-4 border-white/80 shadow-xl">
                    {assetsLoading ? (
                        <div className="h-full w-full rounded-full bg-muted animate-pulse"></div>
                    ) : (
                        <>
                            <AvatarImage src={avatarUrl ?? undefined} alt={player.nickname} />
                            <AvatarFallback className={cn("text-3xl md:text-4xl", styles.textColor === 'text-yellow-900' ? 'bg-yellow-300/50' : styles.textColor === 'text-slate-800' ? 'bg-slate-300/50' : 'bg-orange-400/50')}>
                                {player.nickname?.charAt(0).toUpperCase() || '?'}
                            </AvatarFallback>
                        </>
                    )}
                </Avatar>
            </CardHeader>
            <CardContent className="p-0 flex flex-col items-center">
                <p className={cn("text-lg md:text-xl font-bold truncate w-full px-1", styles.textColor)} title={player.nickname}>
                    {player.nickname}
                </p>
                <p className={cn("text-2xl md:text-3xl font-extrabold my-1", styles.textColor)}>
                    {player.totalScore.toLocaleString()}
                </p>
                <div className={cn("flex items-center justify-center mt-1", styles.textColor, styles.textColor === 'text-yellow-900' ? 'text-yellow-700' : styles.textColor === 'text-slate-800' ? 'text-slate-600' : 'text-orange-200')}>
                    {styles.icon}
                    <span className="font-semibold text-sm md:text-base ml-1.5">{styles.rankText}</span>
                </div>
            </CardContent>
        </Card>
    );
};