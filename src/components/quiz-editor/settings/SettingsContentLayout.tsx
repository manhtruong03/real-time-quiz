// src/components/quiz-editor/settings/SettingsContentLayout.tsx
import React from 'react';
import { cn } from '@/src/lib/utils'; // [cite: 2643]

interface SettingsContentLayoutProps {
    mediaManagerSlot: React.ReactNode; // Slot for CoverMediaManager
    metadataFormSlot: React.ReactNode; // Slot for QuizMetadataForm
    className?: string;
}

const SettingsContentLayout: React.FC<SettingsContentLayoutProps> = ({
    mediaManagerSlot,
    metadataFormSlot,
    className,
}) => {
    return (
        <main
            className={cn(
                'flex-grow p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start', // Use 3 columns, form takes 2 [cite: 239]
                className
            )}
        >
            {/* Column 1: Media Manager */}
            <div className="md:col-span-1">{mediaManagerSlot}</div>

            {/* Column 2: Metadata Form */}
            <div className="md:col-span-2">{metadataFormSlot}</div>
        </main>
    );
};

export default SettingsContentLayout;