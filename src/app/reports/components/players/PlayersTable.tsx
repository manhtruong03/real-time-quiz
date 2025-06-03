// Path: @/src/app/reports/sessions/[sessionId]/components/players/PlayersTable.tsx
import React from 'react';
import { PlayerReportItemDto } from '@/src/lib/types/reports';
import PlayerRow from './PlayerRow';
import {
    Table,
    TableHeader,
    TableRow,
    TableCell,
    TableHead,
    TableBody,
} from '@/src/components/ui/table'; //
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/src/components/ui/button'; // For clickable headers
import { cn } from '@/src/lib/utils'; //

interface PlayersTableProps {
    players: PlayerReportItemDto[];
    onSort: (sortProperty: keyof PlayerReportItemDto | string) => void;
    currentSortProperty: keyof PlayerReportItemDto | string | null;
    currentSortDirection: 'asc' | 'desc' | null;
}

type SortableHeader = {
    label: string;
    key: keyof PlayerReportItemDto | string; // Allow string for flexibility if API keys differ slightly
    className?: string;
    sortable: boolean;
    textAlignment?: 'text-left' | 'text-center' | 'text-right';
};

const headers: SortableHeader[] = [
    { label: 'Nickname', key: 'nickname', sortable: true, textAlignment: 'text-left', className: "w-[30%]" },
    { label: 'Rank', key: 'rank', sortable: true, textAlignment: 'text-center', className: "w-[15%]" },
    { label: 'Correct answers', key: 'averageAccuracy', sortable: true, textAlignment: 'text-center', className: "w-[25%]" },
    { label: 'Unanswered', key: 'unansweredCount', sortable: false, textAlignment: 'text-center', className: "w-[15%]" },
    { label: 'Final Score', key: 'totalPoints', sortable: true, textAlignment: 'text-right', className: "w-[15%]" },
];

const PlayersTable: React.FC<PlayersTableProps> = ({
    players,
    onSort,
    currentSortProperty,
    currentSortDirection,
}) => {
    const renderSortIcon = (columnKey: keyof PlayerReportItemDto | string) => {
        if (currentSortProperty !== columnKey) {
            return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />;
        }
        if (currentSortDirection === 'asc') {
            return <ArrowUp className="ml-2 h-4 w-4 text-accent" />;
        }
        if (currentSortDirection === 'desc') {
            return <ArrowDown className="ml-2 h-4 w-4 text-accent" />;
        }
        return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />;
    };

    return (
        <div className="rounded-md border bg-background-card"> {/* Conceptual: participants-table-container, using card background from theme */}
            <Table className="min-w-full"> {/* Conceptual: participants-table from screen-10-report-player.html */}
                <TableHeader>
                    <TableRow className="border-b border-border-neutral bg-background-elevated"> {/* Style based on HTML header */}
                        {headers.map((header) => (
                            <TableHead
                                key={header.key}
                                className={cn(
                                    "py-3 px-4 text-xs font-medium uppercase tracking-wider text-text-secondary",
                                    header.textAlignment,
                                    header.className,
                                    header.sortable ? "cursor-pointer hover:bg-muted/50" : ""
                                )}
                                onClick={header.sortable ? () => onSort(header.key) : undefined}
                            >
                                <div className={cn("flex items-center",
                                    header.textAlignment === 'text-center' ? 'justify-center' :
                                        header.textAlignment === 'text-right' ? 'justify-end' : 'justify-start'
                                )}>
                                    {header.label}
                                    {header.sortable && renderSortIcon(header.key)}
                                </div>
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {players.length > 0 ? (
                        players.map((player, index) => (
                            <PlayerRow key={player.playerId || `player-${index}`} player={player} />
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={headers.length}
                                className="py-8 px-4 text-center text-sm text-text-secondary"
                            >
                                No players found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default PlayersTable;