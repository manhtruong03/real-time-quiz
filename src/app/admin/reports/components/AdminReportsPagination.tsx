// src/app/admin/reports/components/AdminReportsPagination.tsx
import React from 'react';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/src/components/ui/pagination';

interface AdminReportsPaginationProps {
    currentPage: number; // 0-indexed
    totalPages: number;
    onPageChange: (page: number) => void; // Expects 0-indexed page
}

export const AdminReportsPagination: React.FC<AdminReportsPaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
}) => {
    if (totalPages <= 1) {
        return null; // Don't render pagination if there's only one page or less
    }

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

    // Helper to generate page numbers with ellipsis
    // This is a simplified version. For more complex scenarios, a library or more robust logic might be needed.
    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5; // Max number of page links to show (excluding prev/next/ellipsis)
        const halfPagesToShow = Math.floor(maxPagesToShow / 2);

        if (totalPages <= maxPagesToShow) {
            for (let i = 0; i < totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            if (currentPage <= halfPagesToShow) {
                // Show starting pages, then ellipsis, then last page
                for (let i = 0; i < maxPagesToShow - 1; i++) {
                    pageNumbers.push(i);
                }
                pageNumbers.push('ellipsis');
                pageNumbers.push(totalPages - 1);
            } else if (currentPage >= totalPages - 1 - halfPagesToShow) {
                // Show first page, then ellipsis, then ending pages
                pageNumbers.push(0);
                pageNumbers.push('ellipsis');
                for (let i = totalPages - (maxPagesToShow - 1); i < totalPages; i++) {
                    pageNumbers.push(i);
                }
            } else {
                // Show first page, ellipsis, current page neighborhood, ellipsis, last page
                pageNumbers.push(0);
                pageNumbers.push('ellipsis-start');
                for (
                    let i = currentPage - Math.floor((maxPagesToShow - 2) / 2);
                    i <= currentPage + Math.ceil((maxPagesToShow - 2) / 2) - 1; // Adjust loop for middle items
                    i++
                ) {
                    pageNumbers.push(i);
                }
                pageNumbers.push('ellipsis-end');
                pageNumbers.push(totalPages - 1);
            }
        }
        return pageNumbers;
    };


    return (
        <Pagination className="mt-6">
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            handlePrevious();
                        }}
                        className={currentPage === 0 ? 'pointer-events-none opacity-50' : ''}
                    />
                </PaginationItem>

                {getPageNumbers().map((page, index) => {
                    if (typeof page === 'string') {
                        return <PaginationEllipsis key={`${page}-${index}`} />;
                    }
                    return (
                        <PaginationItem key={page}>
                            <PaginationLink
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onPageChange(page);
                                }}
                                isActive={currentPage === page}
                            >
                                {page + 1} {/* Display 1-indexed page number */}
                            </PaginationLink>
                        </PaginationItem>
                    );
                })}

                <PaginationItem>
                    <PaginationNext
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            handleNext();
                        }}
                        className={
                            currentPage === totalPages - 1 ? 'pointer-events-none opacity-50' : ''
                        }
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
};
