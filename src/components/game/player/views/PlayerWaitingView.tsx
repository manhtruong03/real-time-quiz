// src/components/game/player/views/PlayerWaitingView.tsx
import React from 'react';
import { Hourglass } from 'lucide-react';

export const PlayerWaitingView: React.FC = () => (
    <div className="flex flex-col items-center justify-center text-center p-10 flex-grow">
        <Hourglass className="h-12 w-12 animate-spin text-primary mb-4" />
        <h3 className="text-xl font-semibold">Sẵn sàng!</h3>
        <p className="text-muted-foreground">Câu hỏi tiếp theo sắp hiển thị...</p>
    </div>
);