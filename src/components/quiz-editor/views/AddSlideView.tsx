// src/components/quiz-editor/views/AddSlideView.tsx
"use client";

import React from 'react';
import QuestionTypeSelectorGrid from '@/src/components/quiz-editor/add-slide/QuestionTypeSelectorGrid';
import QuestionTypeSelectorCard from '@/src/components/quiz-editor/add-slide/QuestionTypeSelectorCard';
import { Button } from '@/src/components/ui/button';
import type { QuestionHost } from '@/src/lib/types/quiz-structure';
import {
    HelpCircle, // Replaces fas fa-question-circle
    CheckSquare, // Replaces fas fa-check-circle
    ListOrdered, // Replaces fas fa-bars-staggered
    Vote,        // Replaces fas fa-poll
    Type,        // Replaces fas fa-i-cursor
    Newspaper,   // Replaces fas fa-file-alt
    ArrowLeft
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface AddSlideViewProps {
    onAddQuestion: (type: QuestionHost['type'], isTrueFalseOverride?: boolean) => void;
    onBackToSettings: () => void;
    className?: string;
}

// Updated slideTypesData with Lucide icons
const slideTypesData = [
    { type: 'quiz', title: 'Quiz (Trắc nghiệm)', description: 'Đặt câu hỏi với nhiều lựa chọn văn bản hoặc hình ảnh.', icon: HelpCircle },
    { type: 'quiz', title: 'Đúng / Sai', description: 'Đặt câu hỏi chỉ với hai lựa chọn Đúng hoặc Sai.', icon: CheckSquare },
    { type: 'jumble', title: 'Sắp xếp (Jumble)', description: 'Yêu cầu người chơi sắp xếp các mục theo đúng thứ tự.', icon: ListOrdered },
    { type: 'survey', title: 'Thăm dò / Khảo sát', description: 'Thu thập ý kiến từ người chơi, không tính điểm.', icon: Vote },
    { type: 'open_ended', title: 'Tự luận ngắn', description: 'Yêu cầu người chơi nhập câu trả lời văn bản ngắn.', icon: Type },
    { type: 'content', title: 'Slide Nội dung', description: 'Thêm một slide thông tin với văn bản và media.', icon: Newspaper },
];

export const AddSlideView: React.FC<AddSlideViewProps> = ({
    onAddQuestion,
    onBackToSettings,
    className,
}) => {
    const handleCardClick = (type: QuestionHost['type'], title: string) => {
        const isTrueFalse = type === 'quiz' && title === 'Đúng / Sai';
        onAddQuestion(type, isTrueFalse);
    };

    return (
        <div className={cn(
            "flex-grow flex flex-col items-center justify-center p-4 md:p-6",
            "dark:bg-[var(--content-bg)]",
            className
        )}>
            <h2 className="text-2xl font-bold mb-8 text-center text-foreground dark:text-[var(--text-primary)]">
                Thêm slide mới
            </h2>
            <QuestionTypeSelectorGrid>
                {slideTypesData.map((slideType) => (
                    <QuestionTypeSelectorCard
                        key={slideType.title} // Using title as key, assuming titles are unique for this list
                        type={slideType.type as QuestionHost['type']}
                        title={slideType.title}
                        description={slideType.description}
                        icon={slideType.icon} // Pass the Lucide icon component
                        onClick={() => handleCardClick(slideType.type as QuestionHost['type'], slideType.title)}
                    />
                ))}
            </QuestionTypeSelectorGrid>
            <Button
                variant="outline"
                onClick={onBackToSettings}
                className="mt-8 dark:bg-[var(--secondary-bg)] dark:text-[var(--text-primary)] dark:border-[var(--border-color)] dark:hover:bg-[#3a3a42]"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại Cài đặt
            </Button>
        </div>
    );
};

export default AddSlideView;