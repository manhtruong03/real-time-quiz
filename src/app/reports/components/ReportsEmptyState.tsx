// src/app/reports/components/ReportsEmptyState.tsx
import React from 'react';
import { ListChecks, PlayCircle } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import Link from 'next/link';

export const ReportsEmptyState: React.FC = () => {
    return (
        <div className="text-center py-16 border border-dashed border-border/50 rounded-lg bg-card/50">
            <ListChecks className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
            <h3 className="text-2xl font-semibold mb-3 text-foreground">
                Chưa có báo cáo phiên nào
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Có vẻ như bạn chưa tham gia hoặc tổ chức phiên quiz nào gần đây.
                Hãy bắt đầu một quiz để xem báo cáo tại đây!
            </p>
            <div className="flex justify-center gap-4">
                <Link href="/my-quizzes" passHref>
                    <Button variant="default" size="lg">
                        <PlayCircle className="mr-2 h-5 w-5" /> Tổ chức Quiz
                    </Button>
                </Link>
                <Link href="/" passHref> {/* Or link to discover quizzes */}
                    <Button variant="outline" size="lg">
                        Khám phá Quiz
                    </Button>
                </Link>
            </div>
        </div>
    );
};