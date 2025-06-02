// File: @/src/app/reports/sessions/[sessionId]/components/overview/QuizMetaInfoCard.tsx
'use client';

import React from 'react';
import { SessionSummaryDto } from '@/src/lib/types/reports';
import { Card, CardContent } from '@/src/components/ui/card';
import { Users, HelpCircle, Timer, CalendarDays, UserCircle } from 'lucide-react';
import { formatSessionDateTime, calculateDuration } from '@/src/lib/utils';

interface QuizMetaInfoCardProps {
    summary: SessionSummaryDto;
}

// Updated LiveIndicator based on HTML structure
const SessionTypeIndicator: React.FC<{ sessionType?: string }> = ({ sessionType }) => {
    if (sessionType?.toUpperCase() === 'LIVE') {
        return (
            <div className="flex items-center text-sm text-foreground mb-4"> {/* text-foreground for "Live" text */}
                <span className="flex space-x-1 mr-2" aria-hidden="true"> {/* Increased space-x-1 */}
                    {/* Using inline styles for exact colors from HTML snippet if not in theme */}
                    <span className="w-2.5 h-2.5 bg-[#FF5F57] rounded-full inline-block animate-pulse" style={{ animationDelay: '0s' }}></span> {/* Reddish */}
                    <span className="w-2.5 h-2.5 bg-[#34C759] rounded-full inline-block animate-pulse" style={{ animationDelay: '0.1s' }}></span> {/* Greenish */}
                    <span className="w-2.5 h-2.5 bg-[#007AFF] rounded-full inline-block animate-pulse" style={{ animationDelay: '0.2s' }}></span> {/* Bluish */}
                    <span className="w-2.5 h-2.5 bg-[#FFCC00] rounded-full inline-block animate-pulse" style={{ animationDelay: '0.3s' }}></span> {/* Yellowish */}
                </span>
                LIVE
            </div>
        );
    }
    return null;
};


const QuizMetaInfoCard: React.FC<QuizMetaInfoCardProps> = ({ summary }) => {
    const sessionTime = formatSessionDateTime(summary.time);
    const duration = calculateDuration(summary.time, summary.endTime);

    return (
        // Using bg-card which should map to --secondary-bg intent from HTML via theme
        <Card className="bg-card border-border h-full p-6 shadow-lg"> {/* Added p-6 for padding */}
            <CardContent className="p-0 text-sm"> {/* Removed CardContent default padding, parent Card has it now */}
                <SessionTypeIndicator sessionType={summary.type} />

                <div className="space-y-2.5 text-muted-foreground mb-5"> {/* Adjusted spacing */}
                    <p className="flex items-center">
                        <CalendarDays className="w-4 h-4 mr-2.5 text-accent" /> {/* Adjusted margin */}
                        {sessionTime}
                    </p>
                    <p className="flex items-center">
                        <UserCircle className="w-4 h-4 mr-2.5 text-accent" /> {/* Adjusted margin */}
                        Do <strong className="mx-1 text-foreground">{summary.username}</strong> tổ chức {/* text-foreground for emphasis */}
                    </p>
                </div>

                {/* HTML uses hr class="meta-separator" */}
                <hr className="my-5 border-border" /> {/* Adjusted margin */}

                <ul className="space-y-3.5"> {/* Adjusted spacing */}
                    {[
                        { icon: Users, label: 'Người tham gia', value: summary.controllersCount },
                        { icon: HelpCircle, label: 'Câu hỏi', value: summary.questionsCount },
                        { icon: Timer, label: 'Thời gian', value: duration },
                    ].map((item, index) => (
                        <li key={index} className="flex justify-between items-center text-foreground">
                            <span className="flex items-center text-muted-foreground">
                                <item.icon className="w-4 h-4 mr-2.5 text-accent" /> {/* Adjusted margin */}
                                {item.label}
                            </span>
                            <span className="font-semibold">{item.value}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
};

export { QuizMetaInfoCard };