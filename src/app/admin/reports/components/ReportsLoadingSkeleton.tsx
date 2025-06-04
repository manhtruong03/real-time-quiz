// src/app/admin/reports/components/ReportsLoadingSkeleton.tsx
import React from 'react';
import { Skeleton } from '@/src/components/ui/skeleton';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from '@/src/components/ui/table';

export const ReportsLoadingSkeleton: React.FC = () => {
    const thClasses =
        'px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground bg-muted/20';
    const numRows = 5; // Number of skeleton rows to display

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableHead className={thClasses}>Tiêu đề Quiz</TableHead>
                        <TableHead className={thClasses}>Người tổ chức</TableHead>
                        <TableHead className={`${thClasses} text-right`}>
                            Số người chơi
                        </TableHead>
                        <TableHead className={thClasses}>Thời gian kết thúc</TableHead>
                        <TableHead className={`${thClasses} text-center`}>
                            Hành động
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: numRows }).map((_, index) => (
                        <TableRow key={index} className="border-b hover:bg-muted/50">
                            <TableCell className="px-4 py-3">
                                <Skeleton className="h-5 w-3/4" />
                            </TableCell>
                            <TableCell className="px-4 py-3">
                                <Skeleton className="h-5 w-1/2" />
                            </TableCell>
                            <TableCell className="px-4 py-3 text-right">
                                <Skeleton className="h-5 w-1/4 ml-auto" />
                            </TableCell>
                            <TableCell className="px-4 py-3">
                                <Skeleton className="h-5 w-1/2" />
                            </TableCell>
                            <TableCell className="px-4 py-3 text-center">
                                <Skeleton className="h-8 w-8 mx-auto rounded" />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};
