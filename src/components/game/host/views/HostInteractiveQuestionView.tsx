// src/components/game/host/views/HostInteractiveQuestionView.tsx
import React from 'react';
// Import necessary types, excluding ContentBlock for the 'block' prop
import { GameBlock, ContentBlock, QuestionOpenEnded } from '@/src/lib/types'; // Adjust path
import QuestionDisplay from '../../display/QuestionDisplay';
import MediaDisplay from '../../display/MediaDisplay';
import CountdownTimer from '../../status/CountdownTimer';
import AnswerCounter from '../../status/AnswerCounter';
import AnswerInputArea from '../../inputs/AnswerInputArea'; // Host uses this in non-interactive mode

// Define the specific type for the block prop more explicitly
type InteractiveBlock = Exclude<GameBlock, ContentBlock>;

interface HostInteractiveQuestionViewProps {
    block: InteractiveBlock; // Use the specific union type
    timerKey: string | number;
    currentAnswerCount: number;
    totalPlayers: number;
    onTimeUp?: () => void;
}

export const HostInteractiveQuestionView: React.FC<HostInteractiveQuestionViewProps> = ({
    block,
    timerKey,
    currentAnswerCount,
    totalPlayers,
    onTimeUp,
}) => (
    <>
        <QuestionDisplay
            title={block.title}
            className="mb-4 md:mb-6 bg-black/30 text-white backdrop-blur-sm shadow-md"
        />
        <div className="flex-grow flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-6 px-4">
            {/* Status Sidebar */}
            <div className="flex flex-row md:flex-col justify-around md:justify-start gap-4 order-2 md:order-1 mb-4 md:mb-0 bg-black/20 backdrop-blur-sm p-3 rounded-lg self-center md:self-start shadow">
                {block.timeAvailable > 0 && (
                    <CountdownTimer
                        key={`cd-${timerKey}`} // Use key to force reset
                        initialTime={block.timeAvailable}
                        timeKey={timerKey} // Use the same key
                        onTimeUp={onTimeUp}
                        className="bg-transparent shadow-none text-white min-w-[80px]"
                    />
                )}
                <AnswerCounter
                    count={currentAnswerCount}
                    totalPlayers={totalPlayers}
                    className="bg-transparent shadow-none text-white min-w-[80px]"
                />
            </div>

            {/* Media & Answer Area */}
            <div className="w-full md:flex-grow order-1 md:order-2 flex flex-col items-center min-h-0">
                <MediaDisplay questionData={block} priority className="mb-auto max-w-lg w-full" />
                {/* Host Answer Area (Non-Interactive) */}
                {(block.type === 'quiz' || block.type === 'jumble' || block.type === 'survey') && block.choices && (
                    <div className="w-full max-w-2xl mt-4">
                        {/* Pass isInteractive={false} to show layout without clickability */}
                        <AnswerInputArea
                            questionData={block}
                            onAnswerSubmit={() => { }} // No-op for host view
                            isSubmitting={false}
                            isInteractive={false} // KEY CHANGE
                        />
                    </div>
                )}
                {/* Placeholder for Open Ended on Host */}
                {block.type === "open_ended" && (
                    <div className="text-center p-4 mt-4 text-white/70 bg-black/20 rounded-lg w-full max-w-md shadow">
                        (Người chơi đang nhập câu trả lời)
                    </div>
                )}
            </div>

            {/* Spacer for layout balance */}
            <div className="order-3 w-[100px] hidden md:block flex-shrink-0"></div>
        </div>
    </>
);