// src/app/admin/users/components/AdminUsersLoadingSkeleton.tsx
import React from 'react';
import { Skeleton } from '@/src/components/ui/skeleton'; //
import { Card, CardContent, CardHeader } from '@/src/components/ui/card'; //

export const AdminUsersLoadingSkeleton: React.FC = () => {
    return (
        <Card className="bg-secondary-bg text-text-primary border-border-color shadow-card-shadow"> {/* Apply admin UI styling */}
            <CardHeader>
                <Skeleton className="h-6 w-1/3 bg-input-bg" /> {/* Placeholder for title */}
            </CardHeader>
            <CardContent className="space-y-4 p-6">
                {/* Filter/Search bar placeholder */}
                <Skeleton className="h-10 w-full bg-input-bg" />
                {/* Table header placeholders */}
                <div className="rounded-md border bg-primary-bg p-4"> {/* Mimic table header styling */}
                    <div className="grid grid-cols-7 gap-4"> {/* Adjust grid columns based on UserTable */}
                        <Skeleton className="h-4 w-3/4 bg-input-bg" />
                        <Skeleton className="h-4 w-3/4 bg-input-bg" />
                        <Skeleton className="h-4 w-3/4 bg-input-bg" />
                        <Skeleton className="h-4 w-3/4 bg-input-bg" />
                        <Skeleton className="h-4 w-3/4 bg-input-bg" />
                        <Skeleton className="h-4 w-3/4 bg-input-bg" />
                        <Skeleton className="h-4 w-1/2 bg-input-bg justify-self-end" />
                    </div>
                </div>
                {/* Table row placeholders */}
                {Array.from({ length: 10 }).map((_, i) => ( // Show 10 skeleton rows
                    <div key={i} className="grid grid-cols-7 gap-4 items-center py-3 border-b border-border-color last:border-b-0">
                        <Skeleton className="h-4 w-3/4 bg-input-bg" />
                        <Skeleton className="h-4 w-3/4 bg-input-bg" />
                        <Skeleton className="h-4 w-3/4 bg-input-bg" />
                        <Skeleton className="h-4 w-3/4 bg-input-bg" />
                        <Skeleton className="h-4 w-3/4 bg-input-bg" />
                        <Skeleton className="h-4 w-1/2 bg-input-bg" />
                        <Skeleton className="h-8 w-16 bg-input-bg justify-self-end" /> {/* Placeholder for action buttons */}
                    </div>
                ))}
                {/* Pagination placeholder */}
                <div className="flex justify-end mt-4">
                    <Skeleton className="h-8 w-48 bg-input-bg" />
                </div>
            </CardContent>
        </Card>
    );
};