// Path: @/src/app/reports/sessions/[sessionId]/components/players/PlayerRow.tsx
import React from 'react';
import { PlayerReportItemDto } from '@/src/lib/types/reports';
import MiniDonutChart from '@/src/components/ui/mini-donut-chart'; // Corrected import path
import {
    TableRow,
    TableCell,
} from '@/src/components/ui/table'; // Assuming you'll use shadcn table components

interface PlayerRowProps {
    player: PlayerReportItemDto;
}

const PlayerRow: React.FC<PlayerRowProps> = ({ player }) => {
    const accuracyPercentage = parseFloat((player.averageAccuracy * 100).toFixed(1));

    // Styling classes here are conceptual based on screen-10-report-player.html
    // Adapt them to your Tailwind CSS setup or global styles.
    // For example, text alignment and padding will come from Shadcn's TableCell or custom classes.

    return (
        <TableRow className="hover:bg-muted/50"> {/* Using Shadcn's hover style conceptually */}
            <TableCell className="py-3 px-4 text-sm text-text-primary font-medium"> {/* Conceptual: nickname class */}
                {player.nickname}
            </TableCell>
            <TableCell className="py-3 px-4 text-sm text-text-secondary text-center"> {/* Conceptual: rank class */}
                {player.rank}
            </TableCell>
            <TableCell className="py-3 px-4 text-sm text-text-secondary"> {/* Conceptual: mini-donut-chart-cell class */}
                <div className="flex items-center justify-center space-x-2">
                    <MiniDonutChart percentage={accuracyPercentage} />
                    <span>{accuracyPercentage}%</span>
                </div>
            </TableCell>
            <TableCell className="py-3 px-4 text-sm text-text-secondary text-center"> {/* Conceptual: unanswered class */}
                {player.unansweredCount > 0 ? player.unansweredCount : '—'}
            </TableCell>
            <TableCell className="py-3 px-4 text-sm text-text-primary font-semibold text-right"> {/* Conceptual: final-score class */}
                {player.totalPoints.toLocaleString()}
            </TableCell>
        </TableRow>
    );
};

export default PlayerRow;