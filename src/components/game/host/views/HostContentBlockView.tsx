// src/components/game/host/views/HostContentBlockView.tsx
import React from 'react';
import { ContentBlock } from '@/src/lib/types'; // Adjust path
import QuestionDisplay from '../../display/QuestionDisplay';
import MediaDisplay from '../../display/MediaDisplay';
import { Info } from 'lucide-react';

interface HostContentBlockViewProps {
    block: ContentBlock;
}

export const HostContentBlockView: React.FC<HostContentBlockViewProps> = ({ block }) => (
    <div className="flex-grow flex flex-col items-center justify-center gap-4 md:gap-8 px-4 text-center bg-black/30 text-white backdrop-blur-sm p-6 rounded-lg shadow-lg">
        <Info className="h-12 w-12 text-blue-300 mb-4" />
        <QuestionDisplay
            title={block.title}
            className="mb-2 bg-transparent shadow-none p-0 text-2xl md:text-3xl"
        />
        {block.description && (
            <p className="text-lg md:text-xl mt-2 max-w-xl">{block.description}</p>
        )}
        <MediaDisplay questionData={block} priority className="mt-4 max-w-md" />
    </div>
);