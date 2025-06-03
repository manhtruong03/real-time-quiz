// src/components/quiz-editor/sidebar/SlideNavigationSidebar.tsx
import React from 'react';
import { cn } from '@/src/lib/utils'; //
import type { QuestionHost } from '@/src/lib/types'; //
import { Button } from '@/src/components/ui/button'; //
import { Plus } from 'lucide-react'; //
import { ScrollArea } from '@/src/components/ui/scroll-area'; //

interface SlideNavigationSidebarProps {
    slides: QuestionHost[];
    currentSlideIndex: number;
    onSelectSlide: (index: number) => void;
    onAddSlide: () => void;
    className?: string;
}

const SlideThumbnailPlaceholder: React.FC<{
    index: number;
    type: string;
    title?: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ index, type, title, isActive, onClick }) => {
    const displayTitle = title || (type ? `${type.charAt(0).toUpperCase() + type.slice(1)}` : `Slide ${index + 1}`);
    return (
        // Updated to match .slide-item styling from screen-08-question-edit.html
        <Button
            variant="ghost" // Using ghost and then overriding for custom style
            className={cn(
                "h-auto p-[10px_15px] flex items-start text-left w-full justify-start mb-[8px] rounded-[6px] text-sm transition-colors duration-200 ease-in-out", //
                "bg-editor-secondary-bg text-editor-text-primary hover:bg-editor-input-bg", //
                isActive ? "bg-editor-input-bg border-l-[3px] border-l-editor-accent-color font-medium" : "border-l-[3px] border-l-transparent", //
                isActive && "ring-0 focus-visible:ring-0" // Remove default shadcn focus ring when active if needed
            )}
            onClick={onClick}
        >
            <span className={cn(
                "text-sm font-semibold mr-2.5", // Kept similar styling for index number
                isActive ? "text-editor-accent-color" : "text-editor-text-secondary"
            )}>
                {index + 1}.
            </span>
            <div className="flex-grow overflow-hidden">
                <p className="text-sm font-medium truncate text-editor-text-primary" title={displayTitle}>
                    {displayTitle}
                </p>
            </div>
        </Button>
    );
};

const SlideNavigationSidebar: React.FC<SlideNavigationSidebarProps> = ({
    slides,
    currentSlideIndex,
    onSelectSlide,
    onAddSlide,
    className
}) => {
    return (
        <aside className={cn(
            'w-[240px] bg-editor-primary-bg p-5 border-r border-editor-border-color flex-shrink-0 flex flex-col gap-[10px] h-full', //
            'overflow-y-auto custom-scrollbar-dark', // Added overflow-y-auto and custom scrollbar class
            className
        )}>
            <h3 className="text-[15px] font-medium text-editor-text-secondary mb-[10px] uppercase"> {/* */}
                SLIDES
            </h3>
            <Button
                variant="outline" // Using outline and then overriding for custom style
                className="w-full bg-editor-secondary-bg text-editor-text-primary border-editor-border-color hover:bg-[#3a3a42] mt-[5px] text-sm font-medium py-[8px] px-[18px] rounded-[6px]" // Adjusted margin-top, and applied btn-secondary like styles
                onClick={onAddSlide}
            >
                <Plus className="mr-2 h-4 w-4" /> Thêm Slide {/* */}
            </Button>
            <ScrollArea className="flex-grow custom-scrollbar-dark pr-1 -mr-2 mt-[5px]"> {/* Added margin-top to ScrollArea for spacing after button */}
                {slides.length === 0 ? (
                    <div className="text-sm text-center p-5 border border-dashed border-editor-border-color rounded-md bg-editor-secondary-bg text-editor-text-placeholder">
                        <p>Chưa có slide nào.</p>
                        <p>Hãy bắt đầu bằng cách nhấn "Thêm Slide".</p>
                    </div>
                ) : (
                    <ul className="list-none p-0 m-0 space-y-1">
                        {slides.map((slide, index) => (
                            <li key={slide.id || `slide-${index}-${new Date().getTime()}`}>
                                <SlideThumbnailPlaceholder
                                    index={index}
                                    type={slide.type}
                                    title={slide.type === 'content' ? slide.title : slide.question}
                                    isActive={index === currentSlideIndex}
                                    onClick={() => onSelectSlide(index)}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </ScrollArea>
        </aside>
    );
};

export default SlideNavigationSidebar;