// src/components/game/display/AnswerStatsChart.tsx
"use client";

import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { GameBlock } from '@/src/lib/types';
import { cn } from '@/src/lib/utils';
import { Icon } from 'lucide-react';

export interface ChartBarData {
    label: string; // Count as a string
    value: number; // Original count value (can be used by tooltip or logic)
    percentage: number; // Percentage (0-100) - THIS WILL DRIVE BAR HEIGHT
    color: string;
    icon?: React.ElementType;
    tooltipLabel?: string;
}

interface AnswerStatsChartProps {
    statsData: ChartBarData[] | null;
    questionType: GameBlock['type'] | null;
    className?: string;
}

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

    // --- FIX: Set Y-axis domain for percentage ---
    const yDomainMax = 105; // Fixed domain for percentage (0-100 + 5 padding)

    return (
        <div className={cn("w-full h-full min-h-[150px] md:min-h-[200px]", className)}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={statsData}
                    margin={{ top: 10, right: 5, left: 5, bottom: 40 }}
                    barCategoryGap="20%"
                >
                    {/* --- FIX: Use fixed domain for percentage --- */}
                    <YAxis
                        hide={true}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, yDomainMax]} // Domain from 0% to 100% (+ padding)
                    />
                    <XAxis
                        dataKey="index"
                        axisLine={false}
                        tickLine={false}
                        tick={false}
                    />
                    <Tooltip
                        cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data: ChartBarData = payload[0].payload;
                                const label = data.tooltipLabel || `Answer ${payload[0].payload.index + 1}`;
                                return (
                                    <div className="rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md">
                                        {/* --- FIX: Show count clearly in tooltip --- */}
                                        <p className="font-medium">{label} ({data.percentage.toFixed(0)}%)</p>
                                        <p className="text-muted-foreground">{`${data.value} vote(s)`}</p>
                                        {/* --- End FIX --- */}
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    {/* --- FIX: Use 'percentage' for dataKey to determine height --- */}
                    <Bar
                        dataKey="percentage" // Bar height based on percentage
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={false}
                        minPointSize={1} // Show a tiny stub even for 0%
                    >
                        {statsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        {/* Label below bar still shows the count (label property) */}
                        <LabelList
                            dataKey="label" // This should contain the COUNT string
                            position="bottom"
                            offset={8}
                            fontSize={12}
                            fontWeight="bold"
                            fill="hsl(var(--foreground))"
                        />
                        {/* Icon rendering (unchanged) */}
                        {statsData.some(d => d.icon) && (
                            <LabelList /* ... icon rendering logic ... */
                                dataKey="icon"
                                position="bottom"
                                offset={22}
                                content={(props: any) => { /* ... icon renderer ... */
                                    const { x, y, width, height, index } = props;
                                    const entry = statsData?.[index];
                                    const IconComponent = entry?.icon;
                                    if (IconComponent && entry.percentage > 0) { // Only show icon if percentage > 0
                                        const iconX = x + width / 2;
                                        const iconY = y + height + 15;
                                        return (<g transform={`translate(${iconX},${iconY})`}> <foreignObject x={-8} y={-16} width={16} height={16} style={{ overflow: 'visible' }}> <IconComponent className="h-4 w-4" style={{ color: 'hsl(var(--foreground) / 0.8)' }} /> </foreignObject> </g>);
                                    } return null;
                                }}
                            />
                        )}
                    </Bar>
                    {/* --- End FIX --- */}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};