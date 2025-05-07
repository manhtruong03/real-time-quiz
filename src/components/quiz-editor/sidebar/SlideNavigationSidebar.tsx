// src/components/quiz-editor/sidebar/SlideNavigationSidebar.tsx
import React from 'react';
import { cn } from '@/src/lib/utils';
import type { QuestionHost } from '@/src/lib/types';
import { Button } from '@/src/components/ui/button';
import { GripVertical, Plus } from 'lucide-react'; // Import icons if needed later

interface SlideNavigationSidebarProps {
    slides: QuestionHost[];
    currentSlideIndex: number;
    onSelectSlide: (index: number) => void;
    // Add onAddSlide later if needed here
    className?: string;
}

// Placeholder Thumbnail Component (Will be expanded later)
const SlideThumbnailPlaceholder: React.FC<{
    index: number;
    type: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ index, type, isActive, onClick }) => {
    return (
        <Button
            variant={isActive ? "secondary" : "ghost"}
            className={cn(
                "h-auto p-2 flex items-start text-left w-full justify-start mb-1",
                isActive && "ring-2 ring-primary ring-offset-1"
            )}
            onClick={onClick}
        >
            <span className="text-xs font-semibold mr-2">{index + 1}.</span>
            <div className="flex-grow">
                <p className="text-xs font-medium truncate">{type}</p>
                {/* Add small preview later */}
            </div>
            {/* Drag handle placeholder */}
            {/* <GripVertical className="h-4 w-4 text-muted-foreground ml-auto flex-shrink-0" /> */}
        </Button>
    );
};

const SlideNavigationSidebar: React.FC<SlideNavigationSidebarProps> = ({
    slides,
    currentSlideIndex,
    onSelectSlide,
    className
}) => {
    // *** ADD Log received props ***
    console.log(`[SlideNavigationSidebar Render] Received ${slides?.length} slides.`);
    if (slides && currentSlideIndex >= 0 && slides[currentSlideIndex]) {
        console.log(`[SlideNavigationSidebar Render] Type for current index ${currentSlideIndex}: ${slides[currentSlideIndex].type}`);
    } else if (slides) {
        // Log types of all slides received for comparison
        // console.log(`[SlideNavigationSidebar Render] All received slide types:`, slides.map(s => s.type));
    }

    return (
        <div className={cn('p-2 h-full flex flex-col', className)}>
            <h3 className="text-sm font-semibold mb-2 px-1 text-muted-foreground">Slides</h3>
            <div className="flex-grow overflow-y-auto space-y-1 pr-1 -mr-1">
                {slides.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2 italic text-center">No slides yet.</p>
                ) : (
                    slides.map((slide, index) => (
                        <SlideThumbnailPlaceholder
                            key={index} // Consider using a more stable key if slides have IDs
                            index={index}
                            type={slide.type}
                            isActive={index === currentSlideIndex}
                            onClick={() => onSelectSlide(index)}
                        />
                    ))
                )}
            </div>
            {/* Add Slide Button (Optional - Footer button might be primary) */}
            {/*
             <Button variant="outline" size="sm" className="mt-2 w-full">
                <Plus className="mr-2 h-4 w-4"/> Add Slide
             </Button>
             */}
        </div>
    );
};

export default SlideNavigationSidebar;