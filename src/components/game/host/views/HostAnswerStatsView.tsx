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
import StaticAnswerItem from '../../inputs/StaticAnswerItem';
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
        return <div className={cn("flex items-center justify-center h-full", className)}>Đang tải dữ liệu câu hỏi...</div>;
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
    // --- Data Transformation for Chart (Uses real answerStats prop) ---
    const chartData = useMemo((): ChartBarData[] | null => {
        // Guard clauses (unchanged)
        if (!currentBlock || !answerStats || !hostQuestion || currentBlock.type === 'content') {
            return null;
        }

        const colors = playerButtonMapping.map(b => b.colorHex);
        const icons = playerButtonMapping.map(b => b.Icon);

        try {
            if ((currentBlock.type === 'quiz' || currentBlock.type === 'survey') && currentBlock.choices && hostQuestion.choices) {
                const indexedStats = answerStats as IndexedAnswerStats;
                return currentBlock.choices.map((choice, index) => {
                    const stats = indexedStats?.[index.toString()];
                    const count = stats?.count ?? 0;
                    const percentage = stats?.percentage ?? 0;
                    const choiceText = isImageChoice(choice) ? `Option ${index + 1}` : choice.answer;
                    // --- ADD isCorrect ---
                    const isCorrectForOption = hostQuestion.type === 'survey' ? null : (hostQuestion.choices[index]?.correct ?? false);
                    // --- END ADD ---
                    return {
                        label: String(count),
                        value: count,
                        percentage: percentage,
                        color: colors[index % colors.length] || '#8884d8',
                        // icon: icons[index % icons.length], // Can remove if replaced by correctness icon
                        tooltipLabel: choiceText ?? `Option ${index + 1}`,
                        isCorrect: isCorrectForOption, // <-- PASS isCorrect
                    };
                });
            } else if (currentBlock.type === 'jumble') {
                const jumbleStats = answerStats as JumbleAnswerStats;
                const correctCount = jumbleStats.correct?.count ?? 0;
                const incorrectCount = jumbleStats.incorrect?.count ?? 0;
                const correctPerc = jumbleStats.correct?.percentage ?? 0;
                const incorrectPerc = jumbleStats.incorrect?.percentage ?? 0;
                return [
                    // --- ADD isCorrect ---
                    { label: String(correctCount), value: correctCount, percentage: correctPerc, color: '#22C55E', icon: CheckCircle, tooltipLabel: 'Correct', isCorrect: true },
                    { label: String(incorrectCount), value: incorrectCount, percentage: incorrectPerc, color: '#EF4444', icon: XCircle, tooltipLabel: 'Incorrect', isCorrect: false },
                    // --- END ADD ---
                ];
            } else if (currentBlock.type === 'open_ended' && hostQuestion.choices) {
                const openEndedStats = answerStats as IndexedAnswerStats;
                const bars: ChartBarData[] = [];
                const correctChoiceIndices: Record<string, number> = {}; // Map correct text to original index
                hostQuestion.choices.forEach((hChoice, index) => {
                    if (hChoice.correct && hChoice.answer) {
                        correctChoiceIndices[hChoice.answer.trim().toLowerCase()] = index;
                    }
                });

                // Process correct answers grouped by the definition in hostQuestion
                hostQuestion.choices.forEach((hChoice: ChoiceHost, index: number) => {
                    if (!hChoice.correct || !hChoice.answer) return; // Skip incorrect/empty definitions

                    const key = index.toString(); // Key used in stats calculation
                    const stats = openEndedStats?.[key];
                    if (stats) {
                        // --- ADD isCorrect ---
                        bars.push({
                            label: String(stats.count),
                            value: stats.count,
                            percentage: stats.percentage,
                            color: colors[index % colors.length] || '#8884d8', // Use index for color consistency
                            tooltipLabel: `Correct: "${hChoice.answer}"`,
                            isCorrect: true // This bar represents a correct answer group
                        });
                        // --- END ADD ---
                    } else {
                        // Add bar with 0 count if defined but no one answered it
                        bars.push({
                            label: "0",
                            value: 0,
                            percentage: 0,
                            color: colors[index % colors.length] || '#8884d8',
                            tooltipLabel: `Correct: "${hChoice.answer}"`,
                            isCorrect: true
                        });
                    }
                });

                // Process incorrect answers
                const incorrectStats = openEndedStats?.['incorrect'];
                if (incorrectStats && incorrectStats.count > 0) { // Only add if there were incorrect answers
                    // --- ADD isCorrect ---
                    bars.push({
                        label: String(incorrectStats.count),
                        value: incorrectStats.count,
                        percentage: incorrectStats.percentage,
                        color: '#EF4444', // Use a distinct color for incorrect
                        icon: XCircle,
                        tooltipLabel: 'Incorrect / Other',
                        isCorrect: false // This bar represents incorrect answers
                    });
                    // --- END ADD ---
                }
                return bars.length > 0 ? bars : null;
            }
        } catch (error) {
            console.error("[ChartData] Error transforming stats data:", error, { answerStats, currentBlockType: currentBlock.type });
            return null;
        }

        return null;
    }, [currentBlock, answerStats, hostQuestion]); // Dependencies (unchanged)


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
                        // Apply row layout for jumble on stats view as well
                        currentBlock.type === 'jumble' ? 'flex-row items-stretch' : 'flex-col items-center'
                    )}
                >
                    {/* Middle Area / Left Column (Chart + Media Button) (unchanged) */}
                    <div
                        className={cn(
                            'flex flex-col items-center justify-center gap-3',
                            currentBlock.type === 'jumble' ? 'flex-1 min-w-0 h-full' : 'flex-grow min-h-0 w-full max-w-3xl'
                        )}
                    >
                        <AnswerStatsChart
                            statsData={chartData}
                            questionType={currentBlock.type}
                            className="w-full h-full"
                        />
                        {currentBlock.image && (
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="flex-shrink-0 mt-2">
                                    <ImageIcon className="mr-2 h-4 w-4" />
                                    Xem hình minh họa
                                </Button>
                            </DialogTrigger>
                        )}
                    </div>

                    {/* Bottom Area / Right Column (Answer Options) */}
                    <div
                        className={cn(
                            'flex flex-col',
                            currentBlock.type === 'jumble'
                                ? 'flex-1 min-w-0 h-full overflow-y-auto pt-1 pr-1 space-y-2 md:space-y-3' // Added space-y for static items
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
                        {/* --- NEW: Render Jumble Correct Order Statically --- */}
                        {currentBlock.type === 'jumble' && hostQuestion?.choices && (
                            // Use a simple div container for the static list
                            <div className={cn("flex flex-col gap-2 md:gap-3", "p-1 bg-transparent rounded-md")}>
                                {/* Map over the choices in the CORRECT order from hostQuestion */}
                                {hostQuestion.choices.map((hostChoice, index) => (
                                    <StaticAnswerItem
                                        key={`correct-jumble-${index}`} // Use index from the map
                                        content={hostChoice.answer || ''} // Get text from correct choice
                                        originalIndex={index} // The index *is* the original index here
                                        showCorrectIndicator={true} // Show checkmark
                                    />
                                ))}
                            </div>
                        )}
                        {/* --- END NEW Jumble Rendering --- */}
                        {/* --- UPDATED Open-Ended Display --- */}
                        {currentBlock.type === 'open_ended' && hostQuestion?.choices && hostQuestion.choices.length > 0 && (
                            <Card className="mt-4 bg-background/80 backdrop-blur-sm border-primary/50 shadow-md max-w-md w-full mx-auto">
                                <CardHeader className="pb-2 pt-3">
                                    <CardTitle className="text-center text-base font-semibold text-primary">
                                        Câu trả lời đúng
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
                                        <p className="text-center text-sm text-muted-foreground italic">(Chưa có câu trả lời đúng được định nghĩa)</p>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                        {/* --- END Open-Ended Display --- */}
                        {/* Fallback */}
                        {!(currentBlock.type === 'quiz' || currentBlock.type === 'survey' || currentBlock.type === 'jumble' || currentBlock.type === 'open_ended') && (
                            <p>Hiển thị câu trả lời không được hỗ trợ cho loại: {currentBlock.type}</p>
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