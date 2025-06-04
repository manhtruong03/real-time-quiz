// src/components/game/host/lobby/ParticipantList.tsx
import React from 'react';
import { Users } from 'lucide-react';
import { ParticipantListItem } from './ParticipantListItem';
import { LivePlayerState } from '@/src/lib/types'; // Ensure LivePlayerState is imported
import { cn } from '@/src/lib/utils';

interface ParticipantListProps {
    participants: LivePlayerState[];
    onKickPlayer: (playerId: string) => void;
    className?: string;
    // It might be useful to receive hostUserId if you want to distinguish the host in the list,
    // but it's not strictly necessary for the filtering logic itself.
    // hostUserId?: string | null; 
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
    participants,
    onKickPlayer,
    className,
}) => {
    const displayedParticipants = React.useMemo(() => {
        return participants
            .filter(
                (p) =>
                    // Player must be connected
                    p.isConnected &&
                    // Player status must not be KICKED
                    p.playerStatus !== "KICKED" &&
                    // Player status must not be LEFT
                    p.playerStatus !== "LEFT"
            )
            .reverse(); // Reverse the filtered list so newest active players appear first
    }, [participants]);

    return (
        <div className={cn("flex flex-col h-full", className)}>
            {/* Header - Count reflects displayed (filtered) participants */}
            <div className="flex-shrink-0 flex items-center justify-center gap-2 mb-3 md:mb-4 text-center">
                <Users className="h-6 w-6 text-muted-foreground" />
                {/* MODIFIED: Use the length of the filtered list */}
                <span className="text-xl md:text-2xl font-bold">{displayedParticipants.length}</span>
                <h3 className="text-lg md:text-xl font-semibold text-muted-foreground">Participants</h3>
            </div>

            {/* Player Grid Area */}
            <div className="flex-grow overflow-y-auto px-2 pb-2">
                {displayedParticipants.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-base text-center text-muted-foreground italic py-4">
                            Waiting for active players...
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-wrap justify-center items-start gap-2 md:gap-3">
                        {displayedParticipants.map((participant) => (
                            <ParticipantListItem
                                key={participant.cid}
                                participant={participant} // Pass the LivePlayerState object
                                onKickPlayer={onKickPlayer}
                            // isHost={participant.cid === hostUserId} // Example if hostUserId were passed
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};