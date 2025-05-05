// src/components/game/host/views/HostAnswerStatsView.tsx
import React, { useState, useMemo } from 'react';
import {
    GameBlock,
    isJumbleQuestion,
    QuestionHost,
    ChoiceHost,
    QuizStructureHost,
    QuestionAnswerStats,
    IndexedAnswerStats,
    JumbleAnswerStats,
    AnswerOptionStats,
    QuizChoicePlayer
} from '@/src/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { cn } from '@/src/lib/utils';
import QuestionDisplay from '../../display/QuestionDisplay';
import AnswerInputArea from '../../inputs/AnswerInputArea';
import MediaDisplay from '../../display/MediaDisplay';
import { Button } from '@/src/components/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose
} from "@/src/components/ui/dialog";
import { Image as ImageIcon, X, CheckCircle, XCircle, Triangle, Diamond, Circle, Square } from 'lucide-react';
import AnswerButton from '../../inputs/AnswerButton';
import { AnswerStatsChart, ChartBarData } from '../../display/AnswerStatsChart';

// --- Props Definition ---
interface HostAnswerStatsViewProps {
    currentBlock: GameBlock | null; // Player-formatted block
    quizData: QuizStructureHost | null; // Full quiz data with correct answers
    answerStats: QuestionAnswerStats | null; // Calculated statistics passed from parent
    className?: string;
}

// Button mapping
const playerButtonMapping = [
    { Icon: Triangle, colorHex: '#EF4444' }, // Red-500
    { Icon: Diamond, colorHex: '#3B82F6' }, // Blue-500
    { Icon: Circle, colorHex: '#EAB308' }, // Yellow-500
    { Icon: Square, colorHex: '#22C55E' }, // Green-500
];

export const HostAnswerStatsView: React.FC<HostAnswerStatsViewProps> = ({
    currentBlock,
    quizData,
    answerStats, // Use the real stats prop
    className,
}) => {
    const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);

    if (!currentBlock) {
        // TODO: Consider a more specific loading/error state passed via props if needed
        return <div className={cn("flex items-center justify-center h-full", className)}>Loading question data...</div>;
    }

    const isJumble = isJumbleQuestion(currentBlock);
    const viewMode = 'showingResults';

    // --- Get Host Question Details from quizData prop ---
    const hostQuestion = useMemo((): QuestionHost | null => {
        if (!quizData || !currentBlock || currentBlock.questionIndex < 0 || currentBlock.questionIndex >= quizData.questions.length) {
            console.warn(`[HostAnswerStatsView] Could not retrieve hostQuestion. Index: ${currentBlock?.questionIndex}, Quiz questions available: ${quizData?.questions?.length}`);
            return null;
        }
        return quizData.questions[currentBlock.questionIndex];
    }, [quizData, currentBlock?.questionIndex]);

    // --- Helper Function (Moved before useMemo) ---
    const isImageChoice = (choice: any): choice is QuizChoicePlayer & { image: object } => {
        return typeof choice === 'object' && choice !== null && 'image' in choice && !!choice.image;
    };

    // --- Data Transformation for Chart (Uses real answerStats prop) ---
    const chartData = useMemo((): ChartBarData[] | null => {
        // Guard clauses
        if (!currentBlock || !answerStats || !hostQuestion || currentBlock.type === 'content') {
            // console.log("[ChartData] Returning null. Block:", !!currentBlock, "Stats:", !!answerStats, "HostQ:", !!hostQuestion);
            return null;
        }


        const colors = playerButtonMapping.map(b => b.colorHex);
        const icons = playerButtonMapping.map(b => b.Icon);

        try { // Add try-catch for robustness during data transformation
            if ((currentBlock.type === 'quiz' || currentBlock.type === 'survey') && currentBlock.choices) {
                const indexedStats = answerStats as IndexedAnswerStats;
                return currentBlock.choices.map((choice, index) => {
                    const stats = indexedStats?.[index.toString()]; // Safely access stats
                    const count = stats?.count ?? 0;
                    const percentage = stats?.percentage ?? 0;
                    const choiceText = isImageChoice(choice) ? `Option ${index + 1}` : choice.answer;
                    return {
                        label: String(count), value: count, percentage: percentage,
                        color: colors[index % colors.length] || '#8884d8',
                        icon: icons[index % icons.length], tooltipLabel: choiceText ?? `Option ${index + 1}`
                    };
                });
            } else if (currentBlock.type === 'jumble') {
                const jumbleStats = answerStats as JumbleAnswerStats;
                const correctCount = jumbleStats.correct?.count ?? 0;
                const incorrectCount = jumbleStats.incorrect?.count ?? 0;
                const correctPerc = jumbleStats.correct?.percentage ?? 0;
                const incorrectPerc = jumbleStats.incorrect?.percentage ?? 0;
                return [
                    { label: String(correctCount), value: correctCount, percentage: correctPerc, color: '#22C55E', icon: CheckCircle, tooltipLabel: 'Correct' },
                    { label: String(incorrectCount), value: incorrectCount, percentage: incorrectPerc, color: '#EF4444', icon: XCircle, tooltipLabel: 'Incorrect' },
                ];
            } else if (currentBlock.type === 'open_ended' && hostQuestion.choices) {
                const openEndedStats = answerStats as IndexedAnswerStats;
                const bars: ChartBarData[] = [];

                hostQuestion.choices.forEach((hChoice: ChoiceHost, index: number) => {
                    const key = index.toString();
                    const stats = openEndedStats?.[key];
                    if (stats) {
                        bars.push({ label: String(stats.count), value: stats.count, percentage: stats.percentage, color: colors[index % colors.length] || '#8884d8', tooltipLabel: `Correct: "${hChoice.answer}"` });
                    }
                });

                const incorrectStats = openEndedStats?.['incorrect'];
                if (incorrectStats) {
                    bars.push({ label: String(incorrectStats.count), value: incorrectStats.count, percentage: incorrectStats.percentage, color: '#EF4444', icon: XCircle, tooltipLabel: 'Incorrect / Other' });
                }
                return bars.length > 0 ? bars : null; // Return null if no bars generated
            }
        } catch (error) {
            console.error("[ChartData] Error transforming stats data:", error, { answerStats, currentBlockType: currentBlock.type });
            return null; // Return null on error
        }

        return null; // Fallback for unhandled types
    }, [currentBlock, answerStats, hostQuestion]); // Dependencies


    return (
        <Dialog open={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen}>
            <div
                className={cn(
                    'flex flex-col flex-grow h-full w-full p-4 md:p-6 gap-4 md:gap-6',
                    className
                )}
            >
                {/* Question Title */}
                <div className="flex-shrink-0">
                    <QuestionDisplay
                        title={currentBlock.title}
                        className="bg-background/70 backdrop-blur-sm shadow-md"
                    />
                </div>

                {/* Conditional Layout Container */}
                <div
                    className={cn(
                        'flex-grow flex min-h-0 gap-4 md:gap-6',
                        isJumble ? 'flex-row items-stretch' : 'flex-col items-center'
                    )}
                >
                    {/* Middle Area / Left Column (Chart + Media Button) */}
                    <div
                        className={cn(
                            'flex flex-col items-center justify-center gap-3',
                            isJumble ? 'flex-1 min-w-0 h-full' : 'flex-grow min-h-0 w-full max-w-3xl'
                        )}
                    >
                        {/* Render the Chart with calculated data */}
                        <AnswerStatsChart
                            statsData={chartData} // Use the processed chartData
                            questionType={currentBlock.type}
                            className="w-full h-full"
                        />

                        {/* Show Media Button */}
                        {currentBlock.image && (
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="flex-shrink-0 mt-2">
                                    <ImageIcon className="mr-2 h-4 w-4" />
                                    Show Media
                                </Button>
                            </DialogTrigger>
                        )}
                    </div>

                    {/* Bottom Area / Right Column (Answer Options) */}
                    <div
                        className={cn(
                            'flex flex-col',
                            isJumble
                                ? 'flex-1 min-w-0 h-full overflow-y-auto pt-1 pr-1'
                                : 'flex-shrink-0 w-full max-w-4xl mx-auto mt-auto'
                        )}
                    >
                        {/* --- RENDER BUTTONS USING REAL PROPS --- */}
                        {(currentBlock.type === 'quiz' || currentBlock.type === 'survey') && currentBlock.choices && hostQuestion?.choices && (
                            <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3", "p-2 bg-transparent rounded-md")}>
                                {currentBlock.choices.map((playerChoice, index) => {
                                    // Determine correctness using hostQuestion
                                    const isCorrect = hostQuestion.choices[index]?.correct ?? null;
                                    // Get stats for this specific index from the answerStats prop
                                    const statsForOption = (answerStats as IndexedAnswerStats)?.[index.toString()] ?? null;

                                    return (
                                        <AnswerButton
                                            key={index}
                                            choice={playerChoice as any} // Cast needed as player choice lacks 'correct'
                                            index={index}
                                            onClick={() => { }} // No-op
                                            isDisabled={true} // Always disabled
                                            viewMode={viewMode} // Set mode
                                            // Pass real correctness (null for survey) and stats
                                            isCorrectOption={hostQuestion.type === 'survey' ? null : isCorrect}
                                            stats={statsForOption}
                                        />
                                    );
                                })}
                            </div>
                        )}
                        {/* Render JumbleInput via AnswerInputArea */}
                        {isJumble && (
                            <AnswerInputArea
                                questionData={currentBlock}
                                onAnswerSubmit={() => { }}
                                isSubmitting={false}
                                isInteractive={false}
                                className="p-2 bg-transparent rounded-md"
                            // Jumble buttons don't show individual stats/correctness
                            />
                        )}
                        {/* --- UPDATED Open-Ended Display --- */}
                        {currentBlock.type === 'open_ended' && hostQuestion?.choices && hostQuestion.choices.length > 0 && (
                            <Card className="mt-4 bg-background/80 backdrop-blur-sm border-primary/50 shadow-md max-w-md w-full mx-auto">
                                <CardHeader className="pb-2 pt-3">
                                    <CardTitle className="text-center text-base font-semibold text-primary">
                                        Correct Answer(s)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 pb-4">
                                    <ul className="space-y-1 text-center">
                                        {hostQuestion.choices
                                            .filter(choice => choice.answer && choice.correct) // Filter only correct ones with text
                                            .map((choice, index) => (
                                                <li key={index} className="font-bold text-lg md:text-xl text-foreground break-words">
                                                    {choice.answer}
                                                </li>
                                            ))}
                                    </ul>
                                    {hostQuestion.choices.filter(choice => choice.answer && choice.correct).length === 0 && (
                                        <p className="text-center text-sm text-muted-foreground italic">(No correct answers defined)</p>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                        {/* --- END Open-Ended Display --- */}
                        {/* Fallback */}
                        {!(currentBlock.type === 'quiz' || currentBlock.type === 'survey' || currentBlock.type === 'jumble' || currentBlock.type === 'open_ended') && (
                            <p>Unsupported answer display for type: {currentBlock.type}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Dialog Content for Media */}
            <DialogContent className="max-w-xl p-4">
                <DialogHeader> <DialogTitle>Question Media</DialogTitle> <DialogClose><X className="h-4 w-4" /></DialogClose> </DialogHeader>
                <MediaDisplay questionData={currentBlock} priority={true} />
            </DialogContent>
        </Dialog>
    );
};