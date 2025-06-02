import React from 'react';
import {
    CheckIcon,
    XIcon,
    Triangle as IconTriangle,
    Diamond as IconDiamond,
    Square as IconSquare,
    Circle as IconCircle,
    MinusCircleIcon, // For the main icon of "No Answer"
} from 'lucide-react';
import { Progress } from '@/src/components/ui/progress'; //
import { cn } from '@/src/lib/utils'; //
import type { AnswerDistributionDto } from '@/src/lib/types/reports'; //

interface AnswerChoiceReportItemProps {
    answerDistribution: AnswerDistributionDto;
    totalAnsweredForQuestion: number;
    choiceIndexInQuestion: number;
    isCorrectChoiceInDefinition?: boolean;
    isNoAnswerEntry?: boolean;
}

const choiceIcons = [IconTriangle, IconDiamond, IconSquare, IconCircle];

const AnswerChoiceReportItem: React.FC<AnswerChoiceReportItemProps> = ({
    answerDistribution,
    totalAnsweredForQuestion,
    choiceIndexInQuestion,
    isCorrectChoiceInDefinition,
    isNoAnswerEntry = false,
}) => {
    const percentage =
        !isNoAnswerEntry && totalAnsweredForQuestion > 0 && answerDistribution.count > 0
            ? (answerDistribution.count / totalAnsweredForQuestion) * 100
            : 0;

    const ChoiceListIconComponent = !isNoAnswerEntry ? choiceIcons[choiceIndexInQuestion % choiceIcons.length] : MinusCircleIcon;

    let textColor = 'text-card-foreground/90 dark:text-card-foreground/80';
    let progressBarColorClass = 'bg-slate-300 dark:bg-slate-600';
    let StatCorrectnessIconComponent = <div className="w-5 h-5" />; // Default placeholder

    if (isNoAnswerEntry) {
        textColor = 'text-muted-foreground italic';
        // For "No Answer", StatCorrectnessIconComponent remains an empty div (no specific tick/X in this slot)
    } else if (isCorrectChoiceInDefinition === true) {
        textColor = 'text-constructive dark:text-constructive-dark font-semibold';
        progressBarColorClass = 'bg-constructive dark:bg-constructive-dark';
        StatCorrectnessIconComponent = <CheckIcon className="w-5 h-5 text-constructive dark:text-constructive-dark" />;
    } else if (isCorrectChoiceInDefinition === false) { // Explicitly incorrect
        if (answerDistribution.count > 0) { // And chosen by someone
            progressBarColorClass = 'bg-destructive dark:bg-destructive-dark';
            StatCorrectnessIconComponent = <XIcon className="w-5 h-5 text-destructive dark:text-destructive-dark" />;
        } else { // Incorrect, but not chosen by anyone
            // StatCorrectnessIconComponent remains a placeholder div (no X if not chosen, matches HTML)
            // progressBarColorClass also remains default gray for unchosen incorrect options
        }
    }

    return (
        <div className="flex items-center space-x-2 py-2.5 border-b border-border/60 last:border-b-0 text-sm hover:bg-muted/50 dark:hover:bg-muted/30 -mx-2 px-2 rounded-md">
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                <ChoiceListIconComponent className={cn("w-full h-full", isNoAnswerEntry ? "text-muted-foreground" : "text-muted-foreground")} />
            </div>

            <div className="flex-grow min-w-0">
                <p className={cn('truncate', textColor)} title={answerDistribution.answerText}>
                    {answerDistribution.answerText}
                </p>
            </div>

            {!isNoAnswerEntry && (
                <div className="flex items-center flex-shrink-0 space-x-2 md:space-x-3 ml-auto">
                    <div className="w-5 flex items-center justify-center">
                        {StatCorrectnessIconComponent}
                    </div>
                    <div className="w-20 md:w-24">
                        <Progress
                            value={percentage}
                            className={cn(
                                'h-2.5 rounded-full w-full',
                                (answerDistribution.count > 0) ? progressBarColorClass : 'bg-slate-200 dark:bg-slate-700'
                            )}
                        />
                    </div>
                    <span className="w-7 text-sm font-medium text-muted-foreground text-right">
                        {answerDistribution.count}
                    </span>
                </div>
            )}
            {isNoAnswerEntry && (
                <div className="flex items-center flex-shrink-0 space-x-2 md:space-x-3 ml-auto">
                    <div className="w-5"></div> {/* Placeholder for Tick/X alignment */}
                    <div className="w-20 md:w-24"></div> {/* Placeholder for Progress alignment */}
                    <span className="w-7 text-sm font-medium text-muted-foreground text-right">
                        {answerDistribution.count}
                    </span>
                </div>
            )}
        </div>
    );
};
export default AnswerChoiceReportItem;