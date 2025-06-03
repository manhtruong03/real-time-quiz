// src/components/game/host/lobby/ParticipantList.tsx
import React from 'react';
import { Users } from 'lucide-react';
import { ParticipantListItem } from './ParticipantListItem';
import { LivePlayerState } from '@/src/lib/types';
import { cn } from '@/src/lib/utils';

interface ParticipantListProps {
    participants: LivePlayerState[];
    onKickPlayer: (playerId: string) => void;
    className?: string;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
    participants,
    onKickPlayer,
    className,
}) => {
    // Reverse the list so newest players appear first
    const displayedParticipants = React.useMemo(() => {
        return [...participants].reverse();
    }, [participants]);

    return (
        <div className={cn("flex flex-col h-full", className)}>
            {/* Header - Larger Count */}
            <div className="flex-shrink-0 flex items-center justify-center gap-2 mb-3 md:mb-4 text-center">
                <Users className="h-6 w-6 text-muted-foreground" />
                <span className="text-xl md:text-2xl font-bold">{participants.length}</span>
                <h3 className="text-lg md:text-xl font-semibold text-muted-foreground">Participants</h3>
            </div>

            {/* Player Grid Area (Handles Wrapping and Scrolling Internally) */}
            <div className="flex-grow overflow-y-auto px-2 pb-2"> {/* Add scrollbar if content overflows */}
                {displayedParticipants.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-base text-center text-muted-foreground italic py-4">
                            Waiting for players...
                        </p>
                    </div>
                ) : (
                    // Flex container for wrapping and centering items
                    <div className="flex flex-wrap justify-center items-start gap-2 md:gap-3">
                        {displayedParticipants.map((participant) => (
                            <ParticipantListItem
                                key={participant.cid}
                                participant={participant}
                                onKickPlayer={onKickPlayer}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};