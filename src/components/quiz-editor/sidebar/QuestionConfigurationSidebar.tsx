// src/components/quiz-editor/sidebar/QuestionConfigurationSidebar.tsx
"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/src/lib/utils'; //
import type { QuestionHostSchemaType } from '@/src/lib/schemas/quiz-question.schema'; //
import { RHFSelectField } from '@/src/components/rhf/RHFSelectField'; //
import { Button } from '@/src/components/ui/button'; //
import { Copy, Trash2 } from 'lucide-react'; //
import { Label } from '@/src/components/ui/label'; // Import Label for standalone labels

interface QuestionConfigurationSidebarProps {
    onConfirmDelete: () => void;
    onConfirmDuplicate: () => void;
    className?: string;
}

const questionTypeOptions = [
    { value: 'quiz', label: 'Quiz (Trắc nghiệm)' },
    // { value: 'quiz-tf', label: 'Đúng / Sai' },
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
    className // This className will receive padding from QuestionEditorView
}) => {
    const { control, watch, setValue } = useFormContext<QuestionHostSchemaType>(); // Added setValue
    const watchedType = watch('type');
    const watchedTime = watch('time');
    const watchedPoints = watch('pointsMultiplier');

    // Handler for question type change
    const handleQuestionTypeChange = (value: string) => {
        // The actual transformation logic is in useQuestionFormManagement's handleTypeChange
        // Here, we just update the RHF value which will trigger the effect in the hook.
        if (value === 'quiz-tf') {
            setValue('type', 'quiz', { shouldValidate: true, shouldDirty: true }); // Set RHF to 'quiz'
            // The useQuestionFormManagement hook's handleTypeChange will be called with 'quiz'
            // and should ideally have a way to know it's for "True/False" variant.
            // For now, this sets the type. The visual/structural change for T/F might need specific logic
            // in useQuestionFormManagement or QuestionEditorPanel triggered by this.
        } else {
            setValue('type', value as QuestionHostSchemaType['type'], { shouldValidate: true, shouldDirty: true });
        }
    };


    return (
        <div className={cn("flex flex-col h-full space-y-[18px]", className)}> {/* Matched gap:18px */}
            <div className="form-group"> {/* class "form-group" from target for structure, Tailwind for spacing */}
                <Label htmlFor="questionType-select-trigger" className="block text-xs font-normal text-editor-text-secondary mb-[6px]">Loại câu hỏi</Label> {/* Use Label component */}
                <RHFSelectField<QuestionHostSchemaType>
                    name="type" // This RHF field will be 'quiz' for T/F
                    options={questionTypeOptions}
                    placeholder="Chọn loại câu hỏi..."
                    // The RHFSelectField's onValueChange will call field.onChange from RHF.
                    // We need a custom handler here if 'quiz-tf' needs special RHF state handling immediately.
                    // For now, handleTypeChange in useQuestionFormManagement is the main logic driver.
                    // If RHFSelectField doesn't allow directly passing a custom onValueChange to override RHF's one,
                    // we might need to watch 'type' and call a transformation function.
                    // The current RHFSelectField implementation does allow passing customOnValueChange.
                    onValueChange={handleQuestionTypeChange}
                    triggerClassName="bg-editor-secondary-bg text-editor-text-primary border-editor-border-color text-sm h-auto py-[10px] px-[12px] rounded-[6px] focus:border-editor-accent-color focus:shadow-[0_0_0_2px_rgba(138,63,252,0.3)]"
                    contentClassName="bg-editor-secondary-bg text-editor-text-primary border-editor-border-color"
                />
            </div>
            <div className="form-group">
                <Label htmlFor="timeLimit-select-trigger" className="block text-xs font-normal text-editor-text-secondary mb-[6px]">Giới hạn thời gian</Label>
                <RHFSelectField<QuestionHostSchemaType>
                    name="time"
                    options={timeLimitOptions}
                    placeholder="Chọn thời gian..."
                    triggerClassName="bg-editor-secondary-bg text-editor-text-primary border-editor-border-color text-sm h-auto py-[10px] px-[12px] rounded-[6px] focus:border-editor-accent-color focus:shadow-[0_0_0_2px_rgba(138,63,252,0.3)]"
                    contentClassName="bg-editor-secondary-bg text-editor-text-primary border-editor-border-color"
                    disabled={watchedType === 'content'} // Content slides typically have no time limit
                />
            </div>
            <div className="form-group">
                <Label htmlFor="points-select-trigger" className="block text-xs font-normal text-editor-text-secondary mb-[6px]">Điểm</Label>
                <RHFSelectField<QuestionHostSchemaType>
                    name="pointsMultiplier"
                    options={pointsOptions}
                    placeholder="Chọn điểm..."
                    triggerClassName="bg-editor-secondary-bg text-editor-text-primary border-editor-border-color text-sm h-auto py-[10px] px-[12px] rounded-[6px] focus:border-editor-accent-color focus:shadow-[0_0_0_2px_rgba(138,63,252,0.3)]"
                    contentClassName="bg-editor-secondary-bg text-editor-text-primary border-editor-border-color"
                    disabled={watchedType === 'content' || watchedType === 'survey'} // Content & Survey have no points
                />
            </div>

            <hr className="border-editor-border-color my-[5px]" /> {/* Matched hr style */}

            <Button
                variant="outline"
                onClick={onConfirmDuplicate}
                className="w-full justify-start bg-editor-secondary-bg text-editor-text-primary border-editor-border-color hover:bg-[#3a3a42] mt-[8px] text-sm font-medium py-[10px] px-[18px] rounded-[6px]"
            >
                <Copy className="mr-2 h-4 w-4" /> Nhân bản Slide
            </Button>
            <Button
                variant="destructive" // This will use destructive colors from theme
                onClick={onConfirmDelete}
                className="w-full justify-start bg-editor-danger-color text-white hover:bg-editor-danger-hover mt-[8px] text-sm font-medium py-[10px] px-[18px] rounded-[6px]"
            >
                <Trash2 className="mr-2 h-4 w-4" /> Xóa Slide
            </Button>
        </div>
    );
};

export default QuestionConfigurationSidebar;