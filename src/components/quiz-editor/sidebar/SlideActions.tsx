// src/components/quiz-editor/sidebar/SlideActions.tsx
import React from 'react';
import { Button } from '@/src/components/ui/button';
import { Trash2, Copy } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface SlideActionsProps {
    onDelete: () => void; // This prop will trigger the confirmation dialog
    onDuplicate: () => void;
    className?: string;
}

const SlideActions: React.FC<SlideActionsProps> = ({ onDelete, onDuplicate, className }) => {
    return (
        <div className={cn("space-y-2", className)}>
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={onDuplicate}>
                <Copy className="mr-2 h-4 w-4" /> Duplicate Slide
            </Button>
            {/* The onDelete prop will be connected to the function that opens the dialog */}
            <Button variant="destructive" size="sm" className="w-full justify-start" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete Slide
            </Button>
        </div>
    );
};

export default SlideActions;