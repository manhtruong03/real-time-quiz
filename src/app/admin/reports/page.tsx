// src/app/admin/reports/page.tsx
'use client';

import React, { useState } from 'react';
import AdminLayout from '@/src/components/layout/AdminLayout';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { useAdminReportsData } from '@/src/app/admin/reports/hooks/useAdminReportsData';
import { AdminReportsTable } from '@/src/app/admin/reports/components/AdminReportsTable';
import { AdminReportsPagination } from '@/src/app/admin/reports/components/AdminReportsPagination';
import { ReportsLoadingSkeleton } from '@/src/app/admin/reports/components/ReportsLoadingSkeleton';
import { ReportsErrorState } from '@/src/app/admin/reports/components/ReportsErrorState';
import { ReportsEmptyState } from '@/src/app/admin/reports/components/ReportsEmptyState';
import { SessionSummaryDto } from '@/src/lib/types/reports';
import ConfirmationDialog from '@/src/components/common/ConfirmationDialog'; // Corrected import if it's a default export
import { useToast } from '@/src/hooks/use-toast';
import { deleteSessionReportAdmin } from '@/src/lib/api/admin/reports';

const AdminReportsPageContent: React.FC = () => {
    const {
        reports,
        isLoading,
        error,
        currentPage,
        totalPages,
        goToPage,
        refreshReports,
    } = useAdminReportsData();

    const { toast } = useToast();

    const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
    const [reportToDelete, setReportToDelete] = useState<SessionSummaryDto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteReportClick = (report: SessionSummaryDto) => {
        if (!report.sessionId) {
            toast({
                title: 'Lỗi',
                description: 'Không tìm thấy ID của báo cáo để xóa.',
                variant: 'default',
            });
            console.error('Report is missing sessionId for deletion:', report);
            return;
        }
        setReportToDelete(report);
        setIsConfirmDeleteDialogOpen(true);
    };

    const confirmDeleteHandler = async () => {
        if (!reportToDelete || !reportToDelete.sessionId) {
            toast({
                title: 'Lỗi',
                description: 'Không có báo cáo nào được chọn để xóa.',
                variant: 'destructive',
            });
            setIsConfirmDeleteDialogOpen(false);
            return;
        }

        setIsDeleting(true);
        try {
            await deleteSessionReportAdmin(reportToDelete.sessionId);
            toast({
                title: 'Thành công',
                description: `Đã xóa báo cáo cho quiz "${reportToDelete.quizInfo.title}".`,
                variant: 'destructive',
            });
            refreshReports();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Xóa báo cáo thất bại. Vui lòng thử lại.';
            toast({
                title: 'Lỗi',
                description: errorMessage,
                variant: 'destructive',
            });
            console.error('Error deleting report:', err);
        } finally {
            setIsDeleting(false);
            setIsConfirmDeleteDialogOpen(false);
            setReportToDelete(null);
        }
    };

    const renderContent = () => {
        if (isLoading && reports.length === 0) {
            return <ReportsLoadingSkeleton />;
        }
        if (error) {
            return (
                <ReportsErrorState
                    errorMessage={error.message || 'Đã có lỗi xảy ra khi tải báo cáo.'}
                    onRetry={refreshReports}
                />
            );
        }
        if (!isLoading && reports.length === 0) {
            return <ReportsEmptyState />;
        }
        return (
            <>
                <AdminReportsTable
                    reports={reports}
                    onDeleteReport={handleDeleteReportClick}
                />
                {totalPages > 1 && (
                    <AdminReportsPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={goToPage}
                    />
                )}
            </>
        );
    };

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Quản lý Báo cáo Phiên Quiz</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">{renderContent()}</div>
                </CardContent>
            </Card>

            {reportToDelete && (
                <ConfirmationDialog
                    open={isConfirmDeleteDialogOpen} // Changed from isOpen
                    onOpenChange={(openValue) => { // Changed from onClose
                        setIsConfirmDeleteDialogOpen(openValue);
                        if (!openValue) { // If dialog is being closed
                            setReportToDelete(null);
                        }
                    }}
                    onConfirm={confirmDeleteHandler}
                    title="Xác nhận Xóa Báo cáo"
                    description={`Bạn có chắc chắn muốn xóa báo cáo cho quiz "${reportToDelete.quizInfo.title || 'N/A'
                        }" (Người tổ chức: ${reportToDelete.username || 'N/A'
                        }, ID: ${reportToDelete.sessionId})? Hành động này không thể hoàn tác.`}
                    confirmButtonText="Xóa"
                    confirmButtonVariant="destructive"
                    isConfirming={isDeleting} // Changed from isConfirmBusy
                />
            )}
        </div>
    );
};

const AdminReportsPage: React.FC = () => {
    return (
        <ProtectedRoute expectedRole="ADMIN">
            <AdminLayout>
                <AdminReportsPageContent />
            </AdminLayout>
        </ProtectedRoute>
    );
};

export default AdminReportsPage;
