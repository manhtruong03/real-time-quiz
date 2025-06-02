// Path: @/src/components/ui/mini-donut-chart.tsx
import React from 'react';
import { cn } from '@/src/lib/utils'; // Assuming cn is available from utils

interface MiniDonutChartProps {
    percentage: number; // 0-100
    size?: number; // in pixels
    className?: string;
    chartColor?: string;
    emptyColor?: string;
}

export const MiniDonutChart: React.FC<MiniDonutChartProps> = ({
    percentage,
    size = 24, // Default size from visual reference
    className,
    chartColor = '#2ECC71', // Default --chart-green from screen-10-report-player.html
    emptyColor = '#3A3A40', // Default --chart-empty-color from screen-10-report-player.html
}) => {
    const boundedPercentage = Math.max(0, Math.min(100, percentage));

    const chartStyle: React.CSSProperties = {
        width: `${size}px`,
        height: `${size}px`,
        background: `conic-gradient(${chartColor} 0% ${boundedPercentage}%, ${emptyColor} ${boundedPercentage}% 100%)`,
        borderRadius: '50%',
    };

    return <div style={chartStyle} className={cn(className)} />;
};

export default MiniDonutChart;