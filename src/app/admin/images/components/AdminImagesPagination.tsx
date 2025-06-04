// src/app/admin/images/components/AdminImagesPagination.tsx
"use client";

import React from 'react';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/src/components/ui/pagination"; //
import { cn } from '@/src/lib/utils'; //

interface AdminImagesPaginationProps {
    currentPage: number; // 0-indexed
    totalPages: number;
    onPageChange: (page: number) => void; // Expects 0-indexed page
    className?: string;
}

const AdminImagesPagination: React.FC<AdminImagesPaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    className,
}) => {
    if (totalPages <= 1) {
        return null; // Don't render pagination if there's only one page or no pages
    }

    // Adapted getPageNumbers logic from QuizzesPagination.tsx
    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5; // Max number of page links to show (excluding prev/next/ellipsis)
        const halfMaxPages = Math.floor(maxPagesToShow / 2);

        if (totalPages <= maxPagesToShow) {
            for (let i = 0; i < totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            let startPage = Math.max(0, currentPage - halfMaxPages);
            let endPage = Math.min(totalPages - 1, currentPage + halfMaxPages);

            if (currentPage - halfMaxPages < 0) {
                endPage = Math.min(totalPages - 1, maxPagesToShow - 1);
            }
            if (currentPage + halfMaxPages >= totalPages) {
                startPage = Math.max(0, totalPages - maxPagesToShow);
            }

            if (startPage > 0) {
                pageNumbers.push(0); // Always show first page
                if (startPage > 1) {
                    pageNumbers.push(-1); // Ellipsis indicator
                }
            }

            for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(i);
            }

            if (endPage < totalPages - 1) {
                if (endPage < totalPages - 2) {
                    pageNumbers.push(-1); // Ellipsis indicator
                }
                pageNumbers.push(totalPages - 1); // Always show last page
            }
        }
        return pageNumbers;
    };

    const pageNumbersToDisplay = getPageNumbers();

    return (
        <Pagination className={cn("mt-8", className)}> {/* Default margin-top from QuizzesPagination */}
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        href="#" // Prevent navigation, handle with onClick
                        onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 0) {
                                onPageChange(currentPage - 1);
                            }
                        }}
                        className={currentPage === 0 ? "pointer-events-none opacity-50" : undefined}
                        aria-disabled={currentPage === 0}
                    />
                </PaginationItem>

                {pageNumbersToDisplay.map((page, index) =>
                    page === -1 ? (
                        <PaginationItem key={`ellipsis-${index}`}>
                            <PaginationEllipsis />
                        </PaginationItem>
                    ) : (
                        <PaginationItem key={page}>
                            <PaginationLink
                                href="#" // Prevent navigation, handle with onClick
                                isActive={currentPage === page}
                                onClick={(e) => {
                                    e.preventDefault();
                                    onPageChange(page);
                                }}
                                aria-current={currentPage === page ? "page" : undefined}
                            >
                                {page + 1} {/* Display 1-indexed page number to user */}
                            </PaginationLink>
                        </PaginationItem>
                    )
                )}

                <PaginationItem>
                    <PaginationNext
                        href="#" // Prevent navigation, handle with onClick
                        onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages - 1) {
                                onPageChange(currentPage + 1);
                            }
                        }}
                        className={currentPage === totalPages - 1 ? "pointer-events-none opacity-50" : undefined}
                        aria-disabled={currentPage === totalPages - 1}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
};

export default AdminImagesPagination;