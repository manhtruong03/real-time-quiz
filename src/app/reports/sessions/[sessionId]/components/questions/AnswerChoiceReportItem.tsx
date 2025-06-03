// src/app/reports/sessions/[sessionId]/components/questions/AnswerChoiceReportItem.tsx
import React from 'react';
import {
    CheckIcon,
    XIcon,
    Triangle as IconTriangle,
    Diamond as IconDiamond,
    Square as IconSquare,
    Circle as IconCircle,
    MinusCircleIcon,
} from 'lucide-react';
import { Progress } from '@/src/components/ui/progress';
import { cn } from '@/src/lib/utils';
import type { AnswerDistributionDto } from '@/src/lib/types/reports';
import { ShapeIcon } from '@/src/components/ui/ShapeIcon'; // Import the new ShapeIcon

interface AnswerChoiceReportItemProps {
    answerDistribution: AnswerDistributionDto;
    totalPlayersInSession: number; // Changed from totalAnsweredForQuestion
    choiceIndexInQuestion: number;
    isCorrectChoiceInDefinition?: boolean;
    isNoAnswerEntry?: boolean;
}

// Define the choice icon styles using ShapeIcon
const choiceIconsAndStyles = [
    // For Triangle: bg-yellow-500, icon (stroke) text-red-200, fill white
    { Icon: IconTriangle, containerBg: 'bg-red-500', iconStroke: 'text-red-200', name: 'Triangle' },
    // For Diamond: bg-blue-500, icon (stroke) text-blue-200, fill white
    { Icon: IconDiamond, containerBg: 'bg-blue-500', iconStroke: 'text-blue-200', name: 'Diamond' },
    // For Circle: bg-yellow-500 (as per example for triangle, but usually orange/yellow from AnswerButton), icon text-yellow-200, fill white
    // Let's assume Circle should be yellow background, yellow-200 stroke based on AnswerButton analogy
    { Icon: IconCircle, containerBg: 'bg-yellow-500', iconStroke: 'text-yellow-200', name: 'Circle' },
    // For Square: bg-green-500, icon (stroke) text-green-200, fill white
    { Icon: IconSquare, containerBg: 'bg-green-500', iconStroke: 'text-green-200', name: 'Square' },
];

const AnswerChoiceReportItem: React.FC<AnswerChoiceReportItemProps> = ({
    answerDistribution,
    totalPlayersInSession, // Use total players for "No Answer" percentage
    choiceIndexInQuestion,
    isCorrectChoiceInDefinition,
    isNoAnswerEntry = false,
}) => {
    // Calculate percentage for the progress bar
    // For "No answer", percentage is based on totalPlayersInSession
    // For actual answers, percentage is based on totalPlayersInSession who answered (or all players if that's desired)
    // Let's assume totalPlayersInSession is the base for all percentages for consistency in this view.
    const percentage =
        totalPlayersInSession > 0 && answerDistribution.count > 0
            ? (answerDistribution.count / totalPlayersInSession) * 100
            : 0;

    let iconDetails;
    let ListIconComponent;

    if (isNoAnswerEntry) {
        ListIconComponent = <MinusCircleIcon className="w-8 h-8 text-muted-foreground" />;
    } else {
        iconDetails = choiceIconsAndStyles[choiceIndexInQuestion % choiceIconsAndStyles.length];
        ListIconComponent = (
            <ShapeIcon
                IconComponent={iconDetails.Icon}
                containerClassName={cn('w-7 h-77 rounded-sm', iconDetails.containerBg)} // Added rounded-sm for "slightly rounded corners"
                iconProps={{
                    className: cn('w-7 h-7', iconDetails.iconStroke), // Adjust size of icon itself
                    fill: 'white', // Fill the inside of the shape with white
                    strokeWidth: 1, // Adjust for desired border thickness
                }}
            />
        );
    }

    let itemTextColor = 'text-card-foreground/90 dark:text-card-foreground/80';
    let progressIndicatorColor = 'bg-slate-300 dark:bg-slate-700'; // Default progress bar
    let StatCorrectnessIconComponent = <div className="w-7 h-7" />; // Placeholder for alignment

    const correctnessIconSizeClass = "w-7 h-7";
    const correctnessIconStrokeWidth = 2.5;

    if (isCorrectChoiceInDefinition === true) {
        itemTextColor = 'text-constructive dark:text-constructive-dark font-semibold';
        progressIndicatorColor = 'bg-constructive dark:bg-constructive';
        StatCorrectnessIconComponent = (
            <CheckIcon
                className={cn(correctnessIconSizeClass, "text-constructive dark:text-constructive-dark")}
                strokeWidth={correctnessIconStrokeWidth}
            />
        );
    } else {
        progressIndicatorColor = 'bg-destructive dark:bg-destructive';
        StatCorrectnessIconComponent = (
            <XIcon
                className={cn(correctnessIconSizeClass, "text-destructive dark:text-destructive-dark")}
                strokeWidth={correctnessIconStrokeWidth}
            />
        );
    }


    return (
        <div className="pl-4 flex items-center space-x-4 py-2.5 border-b border-border/60 last:border-b-0 text-sm hover:bg-muted/50 dark:hover:bg-muted/30 -mx-2 px-2 rounded-md">
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                {ListIconComponent}
            </div>

            <div className="flex-grow min-w-0">
                <p className={cn('whitespace-normal break-words', itemTextColor)} title={answerDistribution.answerText}>
                    {answerDistribution.answerText}
                </p>
            </div>

            <div className="flex items-center flex-shrink-0 space-x-2 md:space-x-3 ml-auto">
                <div className={cn("flex items-center justify-center", correctnessIconSizeClass)}>
                    {StatCorrectnessIconComponent}
                </div>
                <div className="w-32 md:w-40">
                    <Progress
                        value={percentage}
                        className={cn('h-2.5 rounded-full w-full')} // Base class for progress bar
                        indicatorClassName={progressIndicatorColor} // Dynamic color for the indicator
                    />
                </div>
                <span className="w-2 text-sm font-medium text-right">
                    {answerDistribution.count}
                </span>
            </div>
        </div>
    );
};
export default AnswerChoiceReportItem;