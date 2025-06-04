// src/components/game/player/views/PlayerSubmittingView.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

export const PlayerSubmittingView: React.FC = () => (
    <div className="flex flex-col items-center justify-center text-center p-10 flex-grow">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h3 className="text-xl font-semibold">Đã gửi câu trả lời!</h3>
        <p className="text-muted-foreground">Đang chờ kết quả...</p>
    </div>
);