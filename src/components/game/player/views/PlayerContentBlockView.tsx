// src/components/game/player/views/PlayerContentBlockView.tsx
import React from 'react';
import { ContentBlock } from '@/src/lib/types'; // Adjust path if needed
import QuestionDisplay from '../../display/QuestionDisplay';
import MediaDisplay from '../../display/MediaDisplay';
import { Info } from 'lucide-react';

interface PlayerContentBlockViewProps {
    block: ContentBlock;
}

export const PlayerContentBlockView: React.FC<PlayerContentBlockViewProps> = ({ block }) => (
    <div className="flex-grow flex flex-col items-center justify-center gap-4 text-center p-4 bg-background/80 dark:bg-black/70 backdrop-blur-sm rounded-lg shadow">
        <Info className="h-10 w-10 text-primary mb-3" />
        <QuestionDisplay
            title={block.title}
            className="mb-2 bg-transparent shadow-none p-0 text-xl md:text-2xl"
        />
        {block.description && (
            <p className="text-md md:text-lg mt-1 max-w-lg text-muted-foreground">{block.description}</p>
        )}
        <MediaDisplay questionData={block} priority className="mt-3 max-w-sm" />
        <p className="text-sm mt-4 text-muted-foreground">Hãy sẵn sàng cho câu hỏi tiếp theo!</p>
    </div>
);