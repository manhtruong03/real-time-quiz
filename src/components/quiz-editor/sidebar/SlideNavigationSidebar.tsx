// src/components/quiz-editor/sidebar/SlideNavigationSidebar.tsx
import React from 'react';
import { cn } from '@/src/lib/utils';
import type { QuestionHost } from '@/src/lib/types';
import { Button } from '@/src/components/ui/button';
import { Plus } from 'lucide-react'; // Changed from PlusCircle to match target HTML's implied style

interface SlideNavigationSidebarProps {
    slides: QuestionHost[];
    currentSlideIndex: number;
    onSelectSlide: (index: number) => void;
    onAddSlide: () => void; // New prop for adding a slide
    className?: string;
}

const SlideThumbnailPlaceholder: React.FC<{
    index: number;
    type: string;
    title?: string; // Add title for better display
    isActive: boolean;
    onClick: () => void;
}> = ({ index, type, title, isActive, onClick }) => {
    return (
        <Button
            variant={isActive ? "secondary" : "ghost"}
            className={cn(
                "h-auto p-2 flex items-start text-left w-full justify-start mb-1",
                isActive && "ring-2 ring-primary ring-offset-1"
            )}
            onClick={onClick}
        >
            <span className="text-xs font-semibold mr-2 text-muted-foreground dark:text-[var(--text-secondary)]">{index + 1}.</span>
            <div className="flex-grow">
                <p className="text-xs font-medium truncate text-foreground dark:text-[var(--text-primary)]" title={title || type}>
                    {title || `${type.toUpperCase()}`}
                </p>
                {/* Add small preview later if needed */}
            </div>
        </Button>
    );
};

const SlideNavigationSidebar: React.FC<SlideNavigationSidebarProps> = ({
    slides,
    currentSlideIndex,
    onSelectSlide,
    onAddSlide, // Destructure new prop
    className
}) => {
    return (
        // Styling based on screen-06-quiz-setting.html editor-sidebar-slides
        <aside className={cn(
            'w-[260px] bg-background dark:bg-[var(--primary-bg)] p-5 border-r dark:border-[var(--border-color)] flex-shrink-0 flex flex-col gap-4 h-full overflow-y-auto',
            className
        )}>
            <h3 className="text-base font-medium text-muted-foreground dark:text-[var(--text-secondary)]">
                Danh sách Slide
            </h3>
            {/* Add Slide Button moved here */}
            <Button
                variant="outline" // "btn-secondary" in target HTML suggests outline or secondary variant
                className="w-full dark:bg-[var(--secondary-bg)] dark:text-[var(--text-primary)] dark:border-[var(--border-color)] dark:hover:bg-[#3a3a42]"
                onClick={onAddSlide} // Use the new prop
            >
                <Plus className="mr-2 h-4 w-4" /> Thêm Slide
            </Button>
            <div className="flex-grow overflow-y-auto space-y-1 pr-1 -mr-1 custom-scrollbar-dark"> {/* Added custom-scrollbar-dark for potential styling */}
                {slides.length === 0 ? (
                    // Placeholder from screen-06-quiz-setting.html
                    <div className="slide-list-placeholder text-sm text-center p-5 border border-dashed rounded-md bg-muted dark:bg-[var(--secondary-bg)] dark:border-[var(--border-color)] text-muted-foreground dark:text-[var(--text-placeholder)]">
                        <p>Chưa có slide nào.</p>
                        <p>Hãy bắt đầu bằng cách nhấn "Thêm Slide".</p>
                    </div>
                ) : (
                    // Using ul for semantic list of slides
                    <ul className="list-none p-0 m-0">
                        {slides.map((slide, index) => (
                            <li key={slide.id || `slide-${index}`}> {/* Use slide.id if available, fallback to index */}
                                <SlideThumbnailPlaceholder
                                    index={index}
                                    type={slide.type}
                                    // title={slide.type === 'content' ? slide.title || `Slide ${index + 1}` : slide.question || `Slide ${index + 1}`}
                                    isActive={index === currentSlideIndex}
                                    onClick={() => onSelectSlide(index)}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </aside>
    );
};

export default SlideNavigationSidebar;