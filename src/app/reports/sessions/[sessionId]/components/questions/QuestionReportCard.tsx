// src/app/reports/sessions/[sessionId]/components/questions/QuestionReportCard.tsx
import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { MiniDonutChart } from '@/src/components/ui/mini-donut-chart';
import { ImageIcon as ImageIconPlaceholder } from 'lucide-react';
import type { QuestionReportItemDto, AnswerDistributionDto } from '@/src/lib/types/reports';
import AnswerChoiceReportItem from './AnswerChoiceReportItem';
import { cn } from '@/src/lib/utils';

const getQuestionTypeName = (type: string): string => {
    switch (type) {
        case 'quiz': return 'Trắc nghiệm';
        case 'jumble': return 'Sắp xếp';
        case 'open_ended': return 'Trả lời tự do';
        case 'survey': return 'Khảo sát';
        case 'content': return 'Nội dung';
        default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
};

interface QuestionReportCardProps {
    questionReport: QuestionReportItemDto;
    questionNumber: number;
    totalPlayersInSession: number;
}

const QuestionReportCard: React.FC<QuestionReportCardProps> = ({
    questionReport,
    questionNumber,
    totalPlayersInSession, // Use this for AnswerChoiceReportItem
}) => {
    const overallAccuracy =
        questionReport.averageAccuracy !== null && questionReport.averageAccuracy !== undefined
            ? questionReport.averageAccuracy * 100
            : null;

    const questionTypeName = getQuestionTypeName(questionReport.type);
    const isContentSlide = questionReport.type === 'content';
    const hasMedia = !!questionReport.imageUrl;

    const originalChoicesMap = new Map(
        questionReport.choices.map((choice, index) => [index, choice])
    );

    let displayedAnswerDistribution = [...questionReport.answersDistribution];
    const hasNoAnswerEntryFromAPI = questionReport.answersDistribution.some(
        ad => ad.status === 'NO_ANSWER' || ad.answerText?.toLowerCase() === 'không có câu trả lời'
    );

    // Logic for "No Answer" entry (ensure it uses totalPlayersInSession for calculation if needed)
    // This part assumes the logic for "No Answer" count has been addressed to use totalPlayersInSession if applicable.
    if (!isContentSlide && !hasNoAnswerEntryFromAPI) {
        const answeredCountSum = questionReport.answersDistribution
            .filter(ad => ad.status !== 'NO_ANSWER' && ad.choiceIndex !== -1)
            .reduce((sum, ad) => sum + ad.count, 0);
        const noAnswerCount = Math.max(0, totalPlayersInSession - questionReport.totalAnsweredControllers);

        const noAnswerData: AnswerDistributionDto = {
            answerText: "Không có câu trả lời",
            choiceIndex: -1,
            status: "NO_ANSWER",
            count: noAnswerCount,
        };
        displayedAnswerDistribution.push(noAnswerData);
    }


    return (
        <Card className="overflow-hidden shadow-lg bg-card dark:bg-card">
            {/* Row 1: Question Header */}
            <div className="p-4 md:p-5 border-b border-border grid grid-cols-[auto_1fr_auto_auto] gap-x-3 md:gap-x-4 items-center">
                <div className="text-sm md:text-base font-semibold text-primary dark:text-primary">{questionNumber}</div>
                <div className="min-w-0"><h3 className="text-base md:text-lg font-bold text-card-foreground leading-tight break-words" title={questionReport.title}>{questionReport.title}</h3></div>
                <div className="flex-shrink-0"><Badge variant={isContentSlide ? "secondary" : "outline"} className="mr-4 text-xs py-0.5 px-1.5 whitespace-nowrap">{questionTypeName}</Badge></div>
                <div className="flex-shrink-0">
                    {overallAccuracy !== null && !isContentSlide && (
                        <div className="flex items-center space-x-2">
                            <MiniDonutChart
                                percentage={overallAccuracy || 0}
                                size={40}
                            />
                            <p className="text-xs font-bold">
                                {overallAccuracy !== null && overallAccuracy !== undefined ? overallAccuracy.toFixed(0) : '0'}%
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Row 2: Question Body (Image/Placeholder and Options/Description) */}
            <CardContent className="p-4 md:p-5">
                <div className="flex flex-col md:flex-row gap-6 md:items-stretch">
                    {/* Column 1: Image or Placeholder */}
                    <div className="w-full md:w-[30%] flex-shrink-0">
                        <div className={cn(
                            "relative bg-muted dark:bg-muted/70 rounded-lg overflow-hidden flex items-center justify-center",
                            "aspect-[4/3]"
                        )}>
                            {hasMedia ? (
                                <Image
                                    src={questionReport.imageUrl!}
                                    alt={`Media for: ${questionReport.title}`}
                                    fill
                                    className="object-contain"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 40vw, 33vw"
                                    priority={questionNumber <= 2}
                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/e2e8f0/94a3b8?text=Image+Error'; (e.target as HTMLImageElement).srcset = ''; }}
                                />
                            ) : (
                                <ImageIconPlaceholder className="w-16 h-16 text-slate-400 dark:text-slate-500" />
                            )}
                        </div>
                    </div>

                    {/* Column 2: Options Box (for non-content slides) or Description (for content slides) */}
                    <div className="w-full md:flex-1 min-w-0 flex flex-col">
                        {isContentSlide ? (
                            <div className="flex-grow flex flex-col justify-center">
                                {questionReport.description ? (
                                    <div
                                        className="prose prose-sm dark:prose-invert max-w-none text-card-foreground/90 dark:text-card-foreground/80 whitespace-pre-wrap break-words"
                                    // Using prose for nice text formatting, adjust classes as needed
                                    >
                                        {questionReport.description}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground py-4">Không có mô tả cho nội dung này.</p>
                                )}
                            </div>
                        ) : (
                            <>
                                {displayedAnswerDistribution.length > 0 ? (
                                    <div className="flex flex-col flex-grow justify-around">
                                        {displayedAnswerDistribution.map((distItem) => {
                                            const originalChoice = distItem.choiceIndex !== -1 ? originalChoicesMap.get(distItem.choiceIndex) : undefined;
                                            const isNoAnswer = distItem.choiceIndex === -1 && distItem.status === "NO_ANSWER";
                                            return (
                                                <AnswerChoiceReportItem
                                                    key={isNoAnswer ? 'no-answer-entry' : `${distItem.choiceIndex}-${distItem.answerText.slice(0, 10)}`}
                                                    answerDistribution={distItem}
                                                    totalPlayersInSession={totalPlayersInSession}
                                                    choiceIndexInQuestion={distItem.choiceIndex}
                                                    isCorrectChoiceInDefinition={originalChoice?.correct}
                                                    isNoAnswerEntry={isNoAnswer}
                                                />
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex-grow flex items-center justify-center">
                                        <p className="text-sm text-muted-foreground py-4">Không có lựa chọn trả lời.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
export default QuestionReportCard;