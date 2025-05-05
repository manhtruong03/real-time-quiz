// src/components/game/display/AnswerStatsChart.tsx
"use client";

import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { GameBlock } from '@/src/lib/types';
import { cn } from '@/src/lib/utils';
import { CheckCircle, XCircle, Minus } from 'lucide-react'; // Import icons

// Updated Interface
export interface ChartBarData {
    label: string; // Count as string
    value: number; // Original count value
    percentage: number; // Percentage (0-100)
    color: string;
    icon?: React.ElementType; // Can likely remove this now
    tooltipLabel?: string;
    isCorrect?: boolean | null; // Added correctness flag
}

interface AnswerStatsChartProps {
    statsData: ChartBarData[] | null;
    questionType: GameBlock['type'] | null;
    className?: string;
}

// --- Custom Label Component for Bottom Section ---
const CustomBottomLabel = (props: any) => {
    const { x, y, width, height, index, data } = props;
    const entry: ChartBarData | undefined = data?.[index];

    if (!entry) {
        return null;
    }

    const barCenterX = x + width / 2;
    const iconSize = 20; // Icon height/width
    const countFontSize = 20; // Approx height for calculation, adjust based on actual CSS
    const verticalPadding = 4; // Padding above icon and below count
    const spacing = 6; // Space between icon and count

    const backgroundHeight = iconSize + spacing + countFontSize + (verticalPadding * 2);
    const backgroundWidth = 36; // Fixed width for the background box

    // Position the background box below the bar
    const backgroundY = y + height + 8; // Start 8px below the bar

    // Position icon centered horizontally, near the top of the background box
    const iconY = backgroundY + verticalPadding + (iconSize / 2);

    // Position count centered horizontally, below the icon
    const countY = iconY + (iconSize / 2) + spacing + (countFontSize / 2);

    let CorrectnessIcon = null;
    let iconColor = 'text-muted-foreground';

    if (entry.isCorrect === true) {
        CorrectnessIcon = CheckCircle;
        iconColor = 'text-green-300'; // Brighter green for visibility on dark bg
    } else if (entry.isCorrect === false) {
        CorrectnessIcon = XCircle;
        iconColor = 'text-red-400'; // Brighter red
    }

    return (
        <g transform={`translate(${barCenterX}, 0)`}>
            {/* Background Rectangle */}
            <rect
                x={-(backgroundWidth / 2)} // Center the background
                y={backgroundY}
                width={backgroundWidth}
                height={backgroundHeight}
                rx={4} // Rounded corners
                ry={4}
                fill="hsl(var(--card) / 0.6)" // Semi-transparent card background
                className="backdrop-blur-sm" // Optional blur
            />

            {/* Correctness Icon (now above count) */}
            {CorrectnessIcon && (
                <foreignObject x={-(iconSize / 2)} y={iconY - (iconSize / 2)} width={iconSize} height={iconSize} style={{ overflow: 'visible' }}>
                    <CorrectnessIcon className={cn(`h-${iconSize / 4} w-${iconSize / 4}`, iconColor)} />
                </foreignObject>
            )}

            {/* Count Label (Larger Font, below icon) */}
            <text
                x={0}
                y={countY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-base font-bold fill-foreground" // Use text-base for larger size
            >
                {entry.label} {/* Display the count */}
            </text>
        </g>
    );
};
// --- End Custom Label Component ---


export const AnswerStatsChart: React.FC<AnswerStatsChartProps> = ({
    statsData,
    questionType,
    className,
}) => {
    if (questionType === 'content' || !statsData || statsData.length === 0) {
        return (
            <div className={cn("flex items-center justify-center h-full text-muted-foreground text-sm italic", className)}>
                {/* No stats */}
            </div>
        );
    }

    const yDomainMax = 105;

    return (
        <div className={cn("w-full h-full min-h-[150px] md:min-h-[200px]", className)}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={statsData}
                    margin={{ top: 20, right: 5, left: 5, bottom: 30 }} // Increased bottom margin further
                    barCategoryGap="25%"
                >
                    <YAxis hide={true} domain={[0, yDomainMax]} />
                    <XAxis dataKey="index" axisLine={false} tickLine={false} tick={false} />
                    <Tooltip
                        cursor={false} // Keep hover effect disabled
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data: ChartBarData = payload[0].payload;
                                const label = data.tooltipLabel || `Answer ${payload[0].payload.index + 1}`;
                                return (
                                    <div className="rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md">
                                        <p className="font-medium">{label} ({data.percentage.toFixed(0)}%)</p>
                                        <p className="text-muted-foreground">{`${data.value} vote(s)`}</p>
                                        {data.isCorrect === true && <p className="text-green-600">Correct</p>}
                                        {data.isCorrect === false && <p className="text-red-600">Incorrect</p>}
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar
                        dataKey="percentage"
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={false}
                        minPointSize={1} // Ensure even 0% bars have a small visual stub
                    >
                        {statsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}

                        {/* Percentage Label Inside Bar */}
                        <LabelList
                            dataKey="percentage"
                            position="center" // Center vertically
                            // Remove angle prop to keep horizontal
                            formatter={(value: number) => `${value.toFixed(0)}%`}
                            className="fill-white text-xs md:text-sm font-semibold drop-shadow-sm pointer-events-none" // Added pointer-events-none
                        // Conditionally render based on value to avoid 0% clutter if desired,
                        // Or always render by removing the filter. Let's always render for consistency.
                        // filter={(item: any) => item.value > 0} // Optional: hide 0% labels
                        />

                        {/* Custom Bottom Label (Icon + Count) */}
                        <LabelList
                            content={<CustomBottomLabel data={statsData} />}
                            dataKey="label" // Still need a dataKey
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};