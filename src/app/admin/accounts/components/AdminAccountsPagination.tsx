// src/app/admin/accounts/components/AdminAccountsPagination.tsx
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

interface AdminAccountsPaginationProps {
    currentPage: number; // 0-indexed
    totalPages: number;
    onPageChange: (page: number) => void; // Expects 0-indexed page
    className?: string;
}

const AdminAccountsPagination: React.FC<AdminAccountsPaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    className
}) => {
    const handlePrevious = () => {
        if (currentPage > 0) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages - 1) {
            onPageChange(currentPage + 1);
        }
    };

    // Basic logic to display page numbers, can be enhanced
    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5; // Max direct page links
        const halfMaxPages = Math.floor(maxPagesToShow / 2);

        if (totalPages <= maxPagesToShow) {
            for (let i = 0; i < totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            // Always show first page
            pageNumbers.push(0);
            if (currentPage > halfMaxPages + 1) {
                pageNumbers.push(-1); // Ellipsis marker
            }

            let startPage = Math.max(1, currentPage - halfMaxPages + (currentPage < halfMaxPages ? halfMaxPages - currentPage : 0));
            let endPage = Math.min(totalPages - 2, currentPage + halfMaxPages - (currentPage > totalPages - 1 - halfMaxPages ? currentPage - (totalPages - 1 - halfMaxPages) : 0));

            if (currentPage <= halfMaxPages) {
                startPage = 1;
                endPage = Math.min(totalPages - 2, maxPagesToShow - 2);
            } else if (currentPage >= totalPages - 1 - halfMaxPages) {
                startPage = Math.max(1, totalPages - 1 - (maxPagesToShow - 2))
                endPage = totalPages - 2;
            }


            for (let i = startPage; i <= endPage; i++) {
                if (i > 0 && i < totalPages - 1) pageNumbers.push(i);
            }


            if (currentPage < totalPages - 2 - halfMaxPages) {
                pageNumbers.push(-1); // Ellipsis marker
            }
            // Always show last page
            pageNumbers.push(totalPages - 1);
        }
        return pageNumbers.filter((value, index, self) => { // Remove duplicate ellipsis if pages are too few
            return !(value === -1 && self[index - 1] <= 0) && !(value === -1 && self[index + 1] >= totalPages - 1) && !(value === -1 && self[index - 1] === -1);
        });
    };


    if (totalPages <= 1) {
        return null; // Don't render pagination if there's only one page or no pages
    }

    return (
        <Pagination className={className}>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        href="#"
                        onClick={(e) => { e.preventDefault(); handlePrevious(); }}
                        className={currentPage === 0 ? "pointer-events-none opacity-50" : undefined}
                        aria-disabled={currentPage === 0}
                    />
                </PaginationItem>
                {getPageNumbers().map((page, index) => (
                    <PaginationItem key={index}>
                        {page === -1 ? (
                            <PaginationEllipsis />
                        ) : (
                            <PaginationLink
                                href="#"
                                onClick={(e) => { e.preventDefault(); onPageChange(page); }}
                                isActive={currentPage === page}
                                aria-current={currentPage === page ? "page" : undefined}
                            >
                                {page + 1}
                            </PaginationLink>
                        )}
                    </PaginationItem>
                ))}
                <PaginationItem>
                    <PaginationNext
                        href="#"
                        onClick={(e) => { e.preventDefault(); handleNext(); }}
                        className={currentPage === totalPages - 1 ? "pointer-events-none opacity-50" : undefined}
                        aria-disabled={currentPage === totalPages - 1}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
};

export default AdminAccountsPagination;