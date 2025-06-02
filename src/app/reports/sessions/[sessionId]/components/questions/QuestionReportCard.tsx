import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/src/components/ui/card'; //
import { Badge } from '@/src/components/ui/badge'; //
import { MiniDonutChart } from '@/src/components/ui/mini-donut-chart'; //
import { ImageIcon as ImageIconPlaceholder } from 'lucide-react';
import type { QuestionReportItemDto, AnswerDistributionDto } from '@/src/lib/types/reports'; //
import AnswerChoiceReportItem from './AnswerChoiceReportItem';
import { cn } from '@/src/lib/utils'; //

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
}

const QuestionReportCard: React.FC<QuestionReportCardProps> = ({
    questionReport,
    questionNumber,
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

    if (!isContentSlide && !hasNoAnswerEntryFromAPI) {
        // Add "No Answer" if not present. Count is 0 as per current DTO limitations.
        const noAnswerData: AnswerDistributionDto = {
            answerText: "Không có câu trả lời",
            choiceIndex: -1,
            status: "NO_ANSWER",
            count: 0, // Defaulting to 0. Accurate count needs backend support.
        };
        displayedAnswerDistribution.push(noAnswerData);
    }

    return (
        <Card className="overflow-hidden shadow-lg bg-card dark:bg-card">
            {/* Row 1: Question Header */}
            <div className="p-4 md:p-5 border-b border-border grid grid-cols-[auto_1fr_auto_auto] gap-x-3 md:gap-x-4 items-center">
                <div className="text-sm md:text-base font-semibold text-primary/90 dark:text-primary/80">Câu {questionNumber}</div>
                <div className="min-w-0"><h3 className="text-base md:text-lg font-bold text-card-foreground leading-tight truncate" title={questionReport.title}>{questionReport.title}</h3></div>
                <div className="flex-shrink-0"><Badge variant={isContentSlide ? "secondary" : "outline"} className="text-xs py-0.5 px-1.5 whitespace-nowrap">{questionTypeName}</Badge></div>
                <div className="flex-shrink-0">
                    {overallAccuracy !== null && !isContentSlide && (
                        <div className="text-center space-y-0.5">
                            <MiniDonutChart percentage={overallAccuracy} size={48} />
                            <p className="text-xs font-medium text-muted-foreground">{overallAccuracy.toFixed(0)}%</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Row 2: Question Body (Image/Placeholder and Options/Description) */}
            {!isContentSlide && (
                <CardContent className="p-4 md:p-5">
                    {/* Flex container for Image and Options columns, with items-stretch for equal height */}
                    <div className="flex flex-col md:flex-row gap-6 md:items-stretch">
                        {/* Column 1: Image or Placeholder */}
                        <div className="w-full md:w-2/5 flex-shrink-0"> {/* Fixed width part of the row */}
                            <div className="relative aspect-[16/9] bg-muted dark:bg-muted/70 rounded-lg overflow-hidden flex items-center justify-center">
                                {hasMedia ? (
                                    <Image
                                        src={questionReport.imageUrl!}
                                        alt={`Media for: ${questionReport.title}`}
                                        fill
                                        className="object-contain"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 40vw, 33vw"
                                        priority={questionNumber <= 2}
                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x225/e2e8f0/94a3b8?text=Image+Error'; (e.target as HTMLImageElement).srcset = ''; }}
                                    />
                                ) : (
                                    <ImageIconPlaceholder className="w-16 h-16 text-slate-400 dark:text-slate-500" />
                                )}
                            </div>
                        </div>

                        {/* Column 2: Options Box */}
                        <div className="w-full md:flex-1 min-w-0 flex flex-col"> {/* flex-1 to take remaining space, flex-col to manage children */}
                            {/* The parent is items-stretch, this column will stretch.
                  Its children will stack. If the content is less than the stretched height,
                  justify-center on this div could center them, or the inner div can grow.
              */}
                            {displayedAnswerDistribution.length > 0 ? (
                                <div className="flex flex-col flex-grow justify-around"> {/* flex-grow to use available space, justify-around for spacing */}
                                    {displayedAnswerDistribution.map((distItem) => {
                                        const originalChoice = distItem.choiceIndex !== -1 ? originalChoicesMap.get(distItem.choiceIndex) : undefined;
                                        const isNoAnswer = distItem.choiceIndex === -1 && distItem.status === "NO_ANSWER";
                                        return (
                                            <AnswerChoiceReportItem
                                                key={isNoAnswer ? 'no-answer-entry' : `${distItem.choiceIndex}-${distItem.answerText.slice(0, 10)}`}
                                                answerDistribution={distItem}
                                                totalAnsweredForQuestion={questionReport.totalAnsweredControllers}
                                                choiceIndexInQuestion={distItem.choiceIndex}
                                                isCorrectChoiceInDefinition={originalChoice?.correct}
                                                isNoAnswerEntry={isNoAnswer}
                                            />
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex-grow flex items-center justify-center"> {/* Centering placeholder text */}
                                    <p className="text-sm text-muted-foreground py-4">Không có lựa chọn trả lời.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            )}

            {isContentSlide && (
                <CardContent className="p-4 md:p-5">
                    {hasMedia ? (
                        <div className="relative aspect-[16/9] bg-muted dark:bg-muted/70 rounded-lg overflow-hidden">
                            <Image
                                src={questionReport.imageUrl!}
                                alt={`Content: ${questionReport.title}`}
                                fill className="object-contain"
                                sizes="(max-width: 768px) 100vw, 80vw"
                                priority={questionNumber <= 1}
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x338/e2e8f0/94a3b8?text=Image+Error'; (e.target as HTMLImageElement).srcset = ''; }}
                            />
                        </div>
                    ) : (
                        <div className="py-4 min-h-[150px] flex items-center justify-center bg-muted dark:bg-muted/70 rounded-lg">
                            <p className="text-sm text-muted-foreground text-center px-4">
                                Nội dung này không có hình ảnh đi kèm.
                            </p>
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
};
export default QuestionReportCard;