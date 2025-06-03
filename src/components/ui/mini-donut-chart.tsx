// src/components/ui/mini-donut-chart.tsx (MODIFIED)
import React from 'react';
import { cn } from '@/src/lib/utils'; //

interface MiniDonutChartProps {
    percentage: number; // This is the "correct" percentage
    size?: number;
    strokeWidth?: number;
    className?: string;
    correctColorClassName?: string; // Tailwind color class for the "correct" segment (blue)
    incorrectColorClassName?: string; // Tailwind color class for the "incorrect" segment (red)
    showPercentageText?: boolean;
    textClassName?: string;
    textToShow?: string; // Optional text to show instead of percentage
}

export const MiniDonutChart: React.FC<MiniDonutChartProps> = ({
    percentage,
    size = 36,
    strokeWidth = 5,
    className,
    correctColorClassName = 'text-green-500', // Default to blue for correct
    incorrectColorClassName = 'text-red-500', // Default to red for incorrect
    showPercentageText = false,
    textClassName = 'text-xs font-medium text-foreground',
    textToShow,
}) => {
    const viewBoxSize = 36; // Using a fixed internal viewBox for consistent pathing

    // r is the radius of the centerline of the stroke.
    // For a viewBox of 36 and a strokeWidth of 5, the outer radius is 18.
    // The inner radius is 18 - 5 = 13.
    // The centerline radius is (18 + 13) / 2 = 15.5.
    // Or, viewBoxSize / 2 - strokeWidth / 2 = 18 - 2.5 = 15.5.
    // However, the value 15.9155 (from previous examples) makes circumference ~100.
    // Let's use radius that makes circumference ~100 for easier percentage mapping.
    const r = 15.9155; // Results in circumference of approx. 100
    const circumference = 2 * Math.PI * r; // Approx 100

    // Path 'd' attribute for a circle starting at 12 o'clock
    // M{center_x} {center_y - radius} a {radius} {radius} 0 1 1 0 {2*radius} a {radius} {radius} 0 1 1 0 -{2*radius}
    // For viewBoxSize=36, center_x=18, center_y=18.
    // M18 (18-r) ...
    const dPath = `M${viewBoxSize / 2} ${viewBoxSize / 2 - r} 
                 a ${r} ${r} 0 1 1 0 ${2 * r} 
                 a ${r} ${r} 0 1 1 0 -${2 * r}`;

    const correctPercentage = Math.max(0, Math.min(100, percentage)); // Clamp between 0 and 100
    const incorrectPercentage = 100 - correctPercentage;

    const correctStrokeVal = (correctPercentage / 100) * circumference;
    const correctDashArray = `${correctStrokeVal} ${circumference}`;

    const incorrectStrokeVal = (incorrectPercentage / 100) * circumference;
    const incorrectDashArray = `${incorrectStrokeVal} ${circumference}`;

    // Rotation for the incorrect (red) segment:
    // It should start after the correct (blue) segment ends.
    // The rotation is by the angle covered by the correct segment.
    const rotationAngle = (correctPercentage / 100) * 360;
    const rotationTransform = `rotate(${rotationAngle} ${viewBoxSize / 2} ${viewBoxSize / 2})`;

    const displayText = textToShow !== undefined ? textToShow : `${Math.round(correctPercentage)}%`;

    return (
        <div className={cn("relative", className)} style={{ width: size, height: size }}>
            <svg className="w-full h-full" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
                {/* Incorrect Segment (Red) - Drawn first, then rotated */}
                {incorrectPercentage > 0 && (
                    <path
                        className={incorrectColorClassName}
                        d={dPath}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        strokeDasharray={incorrectDashArray}
                        strokeLinecap="butt" // Use "butt" for sharp edges if they meet, or "round"
                        transform={rotationTransform} // Rotate this segment
                    />
                )}

                {/* Correct Segment (Blue) - Drawn on top, no rotation needed if red is rotated */}
                {correctPercentage > 0 && (
                    <path
                        className={correctColorClassName}
                        d={dPath}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        strokeDasharray={correctDashArray}
                        strokeLinecap="butt" // Use "butt" for sharp edges
                    />
                )}
            </svg>
            {showPercentageText && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={textClassName}>
                        {displayText}
                    </span>
                </div>
            )}
        </div>
    );
};