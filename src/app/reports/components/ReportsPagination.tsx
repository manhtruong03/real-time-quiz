// src/app/reports/components/ReportsPagination.tsx
import React from 'react';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/src/components/ui/pagination"; // Ensure this path is correct

interface ReportsPaginationProps {
    currentPage: number; // 0-indexed
    totalPages: number;
    onPageChange: (page: number) => void; // 0-indexed page
}

export const ReportsPaginationComponent: React.FC<ReportsPaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
}) => {
    if (totalPages <= 1) {
        return null;
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

    // Simplified page numbers logic, can be enhanced like ShadCN's example
    const pageNumbers = [];
    const maxPagesToShow = 5; // Max direct page numbers to show
    const halfPagesToShow = Math.floor(maxPagesToShow / 2);

    let startPage = Math.max(0, currentPage - halfPagesToShow);
    let endPage = Math.min(totalPages - 1, currentPage + halfPagesToShow);

    if (currentPage - startPage < halfPagesToShow) {
        endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1);
    }
    if (endPage - currentPage < halfPagesToShow) {
        startPage = Math.max(0, endPage - maxPagesToShow + 1);
    }


    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }


    return (
        <Pagination className="mt-8">
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        href="#"
                        onClick={(e) => { e.preventDefault(); handlePrevious(); }}
                        className={currentPage === 0 ? "pointer-events-none opacity-50" : ""}
                        aria-disabled={currentPage === 0}
                    >
                        Trước
                    </PaginationPrevious>
                </PaginationItem>

                {startPage > 0 && (
                    <PaginationItem>
                        <PaginationLink href="#" onClick={(e) => { e.preventDefault(); onPageChange(0); }}>
                            1
                        </PaginationLink>
                    </PaginationItem>
                )}
                {startPage > 1 && (
                    <PaginationItem><PaginationEllipsis /></PaginationItem>
                )}

                {pageNumbers.map((page) => (
                    <PaginationItem key={page}>
                        <PaginationLink
                            href="#"
                            onClick={(e) => { e.preventDefault(); onPageChange(page); }}
                            isActive={currentPage === page}
                            aria-current={currentPage === page ? "page" : undefined}
                        >
                            {page + 1}
                        </PaginationLink>
                    </PaginationItem>
                ))}

                {endPage < totalPages - 2 && (
                    <PaginationItem><PaginationEllipsis /></PaginationItem>
                )}
                {endPage < totalPages - 1 && (
                    <PaginationItem>
                        <PaginationLink href="#" onClick={(e) => { e.preventDefault(); onPageChange(totalPages - 1); }}>
                            {totalPages}
                        </PaginationLink>
                    </PaginationItem>
                )}

                <PaginationItem>
                    <PaginationNext
                        href="#"
                        onClick={(e) => { e.preventDefault(); handleNext(); }}
                        className={currentPage >= totalPages - 1 ? "pointer-events-none opacity-50" : ""}
                        aria-disabled={currentPage >= totalPages - 1}
                    >
                        Sau
                    </PaginationNext>
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
};