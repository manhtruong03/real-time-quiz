// src/app/admin/images/components/ImagesTableSkeleton.tsx
"use client";

import React from 'react';
import { Skeleton } from '@/src/components/ui/skeleton'; //
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from '@/src/components/ui/table'; //
import { cn } from '@/src/lib/utils';

const ImagesTableSkeleton: React.FC = () => {
    const thClasses = "px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary bg-table-header-bg whitespace-nowrap";
    // Matches ImagesTable.tsx for consistency

    return (
        <div className="overflow-x-auto">
            <Table className="min-w-full divide-y divide-border-color">
                <TableHeader>
                    <TableRow className="border-b-0">
                        <TableHead className={cn(thClasses, "rounded-tl-md w-[80px]")}>Xem trước</TableHead>
                        <TableHead className={thClasses}>Tên ảnh</TableHead>
                        <TableHead className={thClasses}>Người tạo</TableHead>
                        <TableHead className={thClasses}>Ngày tải lên</TableHead>
                        <TableHead className={thClasses}>Kích thước</TableHead>
                        <TableHead className={thClasses}>Loại file</TableHead>
                        <TableHead className={cn(thClasses, "text-center rounded-tr-md")}>Hành động</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="bg-secondary-bg divide-y divide-border-color">
                    {[...Array(5)].map((_, index) => (
                        <TableRow key={index} className="border-b border-border-color">
                            <TableCell className="px-3 py-3 w-[80px] align-middle">
                                <Skeleton className="h-[40px] w-[60px] rounded" />
                            </TableCell>
                            <TableCell className="px-3 py-3 align-middle">
                                <Skeleton className="h-5 w-3/4" />
                            </TableCell>
                            <TableCell className="px-3 py-3 align-middle">
                                <Skeleton className="h-5 w-24" />
                            </TableCell>
                            <TableCell className="px-3 py-3 align-middle">
                                <Skeleton className="h-5 w-32" />
                            </TableCell>
                            <TableCell className="px-3 py-3 align-middle">
                                <Skeleton className="h-5 w-20" />
                            </TableCell>
                            <TableCell className="px-3 py-3 align-middle">
                                <Skeleton className="h-5 w-16" />
                            </TableCell>
                            <TableCell className="px-3 py-3 text-center align-middle">
                                <div className="flex justify-center space-x-1">
                                    <Skeleton className="h-8 w-8 rounded" />
                                    <Skeleton className="h-8 w-8 rounded" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default ImagesTableSkeleton;