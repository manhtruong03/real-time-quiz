// src/components/quiz-editor/sidebar/SlideNavigationSidebar.tsx
import React from 'react';
import { cn } from '@/src/lib/utils';
import type { QuestionHost } from '@/src/lib/types';
import { Button } from '@/src/components/ui/button';
import { Plus } from 'lucide-react';
import { ScrollArea } from '@/src/components/ui/scroll-area'; // Import ScrollArea

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
        <Button
            variant={isActive ? "secondary" : "ghost"}
            className={cn(
                "h-auto p-3 flex items-start text-left w-full justify-start mb-1.5", // Adjusted padding and margin
                "bg-[var(--editor-secondary-bg)] text-[var(--editor-text-primary)] hover:bg-[var(--editor-input-bg)]",
                isActive && "ring-2 ring-[var(--editor-accent-color)] ring-offset-1 bg-[var(--editor-input-bg)] border-l-2 border-l-[var(--editor-accent-color)]"
            )}
            onClick={onClick}
        >
            <span className={cn(
                "text-sm font-semibold mr-2.5",
                isActive ? "text-[var(--editor-accent-color)]" : "text-[var(--editor-text-secondary)]"
            )}>
                {index + 1}.
            </span>
            <div className="flex-grow overflow-hidden">
                <p className="text-sm font-medium truncate text-[var(--editor-text-primary)]" title={displayTitle}>
                    {displayTitle}
                </p>
                {/* Future: <p className="text-xs text-gray-400 truncate">{type}</p> */}
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
            'w-[240px] bg-[var(--editor-primary-bg)] p-5 border-r border-[var(--editor-border-color)] flex-shrink-0 flex flex-col gap-2.5 h-full', // Use h-full for flex child
            className
        )}>
            <h3 className="text-[15px] font-medium text-[var(--editor-text-secondary)] mb-2.5 uppercase">
                SLIDES
            </h3>
            <Button
                variant="outline"
                className="w-full bg-[var(--editor-secondary-bg)] text-[var(--editor-text-primary)] border-[var(--editor-border-color)] hover:bg-[#3a3a42] mb-2.5"
                onClick={onAddSlide}
            >
                <Plus className="mr-2 h-4 w-4" /> Thêm Slide
            </Button>
            <ScrollArea className="flex-grow custom-scrollbar-dark pr-1 -mr-2"> {/* Added ScrollArea */}
                {slides.length === 0 ? (
                    <div className="text-sm text-center p-5 border border-dashed border-[var(--editor-border-color)] rounded-md bg-[var(--editor-secondary-bg)] text-[var(--editor-text-placeholder)]">
                        <p>Chưa có slide nào.</p>
                        <p>Hãy bắt đầu bằng cách nhấn "Thêm Slide".</p>
                    </div>
                ) : (
                    <ul className="list-none p-0 m-0 space-y-1"> {/* Added space-y-1 */}
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