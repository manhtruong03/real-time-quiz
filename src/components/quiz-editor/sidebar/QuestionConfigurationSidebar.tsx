// src/components/quiz-editor/sidebar/QuestionConfigurationSidebar.tsx
"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/src/lib/utils';
import type { QuestionHostSchemaType } from '@/src/lib/schemas/quiz-question.schema';
import { RHFSelectField } from '@/src/components/rhf/RHFSelectField';
import { Button } from '@/src/components/ui/button';
import { Copy, Trash2 } from 'lucide-react';

interface QuestionConfigurationSidebarProps {
    onConfirmDelete: () => void;
    onConfirmDuplicate: () => void;
    className?: string;
}

const questionTypeOptions = [
    { value: 'quiz', label: 'Quiz (Trắc nghiệm)' },
    { value: 'quiz-tf', label: 'Đúng / Sai' }, // Special value to handle True/False variant of Quiz
    { value: 'jumble', label: 'Sắp xếp (Jumble)' },
    { value: 'survey', label: 'Thăm dò ý kiến' },
    { value: 'open_ended', label: 'Tự luận ngắn' },
    { value: 'content', label: 'Slide Nội dung' },
];
const timeLimitOptions = [
    { value: '5000', label: '5 giây' }, { value: '10000', label: '10 giây' },
    { value: '20000', label: '20 giây' }, { value: '30000', label: '30 giây' },
    { value: '60000', label: '1 phút' }, { value: '90000', label: '1 phút 30 giây' },
    { value: '120000', label: '2 phút' },
];
const pointsOptions = [
    { value: '1', label: 'Điểm chuẩn (x1)' }, { value: '2', label: 'Gấp đôi điểm (x2)' },
    { value: '0', label: 'Không có điểm' },
];

const QuestionConfigurationSidebar: React.FC<QuestionConfigurationSidebarProps> = ({
    onConfirmDelete,
    onConfirmDuplicate,
    className
}) => {
    const { control, watch } = useFormContext<QuestionHostSchemaType>();
    const watchedType = watch('type'); // To potentially disable/hide options based on type later

    return (
        <div className={cn("flex flex-col h-full space-y-5", className)}>
            <div className="form-group">
                <label htmlFor="questionType" className="block text-xs font-medium text-[var(--editor-text-secondary)] mb-1.5">Loại câu hỏi</label>
                <RHFSelectField<QuestionHostSchemaType>
                    name="type"
                    options={questionTypeOptions}
                    placeholder="Chọn loại câu hỏi..."
                    triggerClassName="bg-[var(--editor-secondary-bg)] text-[var(--editor-text-primary)] border-[var(--editor-border-color)]"
                    contentClassName="bg-[var(--editor-secondary-bg)] text-[var(--editor-text-primary)] border-[var(--editor-border-color)]"
                />
            </div>
            <div className="form-group">
                <label htmlFor="timeLimit" className="block text-xs font-medium text-[var(--editor-text-secondary)] mb-1.5">Giới hạn thời gian</label>
                <RHFSelectField<QuestionHostSchemaType>
                    name="time"
                    options={timeLimitOptions}
                    placeholder="Chọn thời gian..."
                    triggerClassName="bg-[var(--editor-secondary-bg)] text-[var(--editor-text-primary)] border-[var(--editor-border-color)]"
                    contentClassName="bg-[var(--editor-secondary-bg)] text-[var(--editor-text-primary)] border-[var(--editor-border-color)]"
                />
            </div>
            <div className="form-group">
                <label htmlFor="points" className="block text-xs font-medium text-[var(--editor-text-secondary)] mb-1.5">Điểm</label>
                <RHFSelectField<QuestionHostSchemaType>
                    name="pointsMultiplier"
                    options={pointsOptions}
                    placeholder="Chọn điểm..."
                    triggerClassName="bg-[var(--editor-secondary-bg)] text-[var(--editor-text-primary)] border-[var(--editor-border-color)]"
                    contentClassName="bg-[var(--editor-secondary-bg)] text-[var(--editor-text-primary)] border-[var(--editor-border-color)]"
                />
            </div>

            <hr className="border-[var(--editor-border-color)] my-3" />

            <Button
                variant="outline"
                onClick={onConfirmDuplicate}
                className="w-full justify-start bg-[var(--editor-secondary-bg)] text-[var(--editor-text-primary)] border-[var(--editor-border-color)] hover:bg-[#3a3a42]"
            >
                <Copy className="mr-2 h-4 w-4" /> Nhân bản Slide
            </Button>
            <Button
                variant="destructive"
                onClick={onConfirmDelete}
                className="w-full justify-start bg-[var(--editor-danger-color)] text-white hover:bg-[var(--editor-danger-hover)]"
            >
                <Trash2 className="mr-2 h-4 w-4" /> Xóa Slide
            </Button>
        </div>
    );
};

export default QuestionConfigurationSidebar;