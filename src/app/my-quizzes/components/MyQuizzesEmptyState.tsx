// src/app/my-quizzes/components/MyQuizzesEmptyState.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { ListChecks, PlusCircle } from 'lucide-react';

const MyQuizzesEmptyState: React.FC = () => {
    return (
        <div className="text-center py-16 border border-dashed border-border/50 rounded-lg bg-card">
            <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">Chưa có Quiz nào</h3>
            <p className="text-muted-foreground mb-6">Bạn chưa tạo quiz nào. Hãy bắt đầu ngay!</p>
            <Link href="/quiz/create" passHref>
                <Button variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <PlusCircle className="mr-2 h-4 w-4" /> Tạo Quiz đầu tiên
                </Button>
            </Link>
        </div>
    );
};

export default MyQuizzesEmptyState;