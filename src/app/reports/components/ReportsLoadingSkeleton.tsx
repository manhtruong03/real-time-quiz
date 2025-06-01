// src/app/reports/components/ReportsLoadingSkeleton.tsx
import React from 'react';
import { Skeleton } from "@/src/components/ui/skeleton";

export const ReportsLoadingSkeleton: React.FC<{ itemCount?: number }> = ({ itemCount = 3 }) => {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: itemCount }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-4 shadow-sm flex flex-col">
                    <Skeleton className="h-6 w-3/4 mb-2" /> {/* Title */}
                    <Skeleton className="h-4 w-1/2 mb-1" /> {/* Date */}
                    <Skeleton className="h-4 w-1/3 mb-3" /> {/* Date */}

                    <div className="space-y-2 mb-4 flex-grow">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/6" />
                    </div>
                    <Skeleton className="h-9 w-full mt-auto" /> {/* Button */}
                </div>
            ))}
        </div>
    );
};