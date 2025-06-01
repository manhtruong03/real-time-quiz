// src/app/my-quizzes/components/MyQuizzesLoadingSkeleton.tsx
"use client";

import React from 'react';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardFooter } from '@/src/components/ui/card';

const MyQuizzesLoadingSkeleton: React.FC = () => {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden bg-card border-border/50">
                    <Skeleton className="w-full aspect-video bg-muted/70" />
                    <CardHeader className="pt-4 pb-2">
                        <Skeleton className="h-7 w-3/4 mb-1 bg-muted/70" />
                        <Skeleton className="h-5 w-1/2 mb-2 bg-muted/70" />
                        <Skeleton className="h-10 w-full bg-muted/70" />
                    </CardHeader>
                    <CardContent className="pt-1 pb-3">
                        <div className="flex flex-wrap gap-2">
                            <Skeleton className="h-6 w-24 bg-muted/70" />
                            <Skeleton className="h-6 w-24 bg-muted/70" />
                            <Skeleton className="h-6 w-24 bg-muted/70" />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 pt-3 pb-3 border-t border-border/50">
                        <Skeleton className="h-9 w-9 rounded-full bg-muted/70" />
                        <Skeleton className="h-9 w-9 rounded-full bg-muted/70" />
                        <Skeleton className="h-9 w-[100px] rounded-md bg-muted/70" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
};

export default MyQuizzesLoadingSkeleton;