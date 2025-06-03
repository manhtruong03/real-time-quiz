// src/app/my-quizzes/components/MyQuizzesPageHeader.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { PlusCircle } from 'lucide-react';

const MyQuizzesPageHeader: React.FC = () => {
    return (
        <div className="flex justify-between items-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Quiz của tôi</h1>
            <Link href="/quiz/create" passHref>
                <Button variant="default" size="default" className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary">
                    <PlusCircle className="mr-2 h-4 w-4" /> Tạo Quiz mới
                </Button>
            </Link>
        </div>
    );
};

export default MyQuizzesPageHeader;