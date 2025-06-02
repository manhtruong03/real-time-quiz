// File: @/src/app/reports/sessions/[sessionId]/components/overview/AccuracyChartCard.tsx
'use client';

import React from 'react';
import { Card, CardContent } from '@/src/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/src/components/ui/chart';
import { PieChart, Pie, Cell, Label } from 'recharts';
// cn utility is not strictly needed here anymore unless you add conditional classes
// import { cn } from '@/src/lib/utils';

interface AccuracyChartCardProps {
    accuracy: number;
}

const AccuracyChartCard: React.FC<AccuracyChartCardProps> = ({ accuracy }) => {
    const percentage = Math.round(accuracy * 100);
    const chartFillColor = 'hsl(var(--primary))';
    const chartTrackColor = 'hsl(var(--border))';

    const data = [
        { name: 'Đúng', value: percentage, fill: chartFillColor },
        { name: 'Sai', value: 100 - percentage, fill: chartTrackColor },
    ];

    return (
        <Card className="flex flex-col h-full bg-card border-border p-6 shadow-lg">
            <CardContent className="flex-1 flex flex-col items-center justify-center p-0">
                <ChartContainer
                    config={{}}
                    className="mx-auto aspect-square max-h-[250px] w-full mb-4"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel className="bg-popover text-popover-foreground border-border" />}
                        />
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            innerRadius="75%"
                            outerRadius="100%"
                            startAngle={90}
                            endAngle={-270}
                            cy="50%"
                            cx="50%"
                            strokeWidth={0}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                        const { cx, cy } = viewBox;
                                        return (
                                            <text
                                                x={cx}
                                                y={cy} // Anchor point for the text block
                                                textAnchor="middle"
                                                dominantBaseline="central" // Use 'central' for better multi-line alignment
                                                fill="hsl(var(--foreground))"
                                            >
                                                <tspan
                                                    x={cx}
                                                    // Adjust dy to move percentage slightly up to make space for "Correct"
                                                    dy="-0.1em"
                                                    className="text-4xl font-bold fill-[hsl(var(--foreground))]"
                                                >
                                                    {`${percentage}%`}
                                                </tspan>
                                                <tspan
                                                    x={cx}
                                                    // Adjust dy to position "Correct" below the percentage
                                                    dy="2.4em" // Relative to the previous tspan's new baseline
                                                    className="text-sm font-medium fill-[hsl(var(--muted-foreground))]" // Smaller, muted color
                                                >
                                                    Đúng
                                                </tspan>
                                            </text>
                                        );
                                    }
                                    return null;
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>
                <p className="text-center text-lg font-medium text-foreground mt-1">
                    Tỷ lệ trả lời đúng
                </p>
            </CardContent>
        </Card>
    );
};

export { AccuracyChartCard };