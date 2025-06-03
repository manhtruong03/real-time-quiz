// src/app/admin/users/page.tsx
"use client";

import React, { useState } from 'react';
import { useAdminUsersData } from './hooks/useAdminUsersData';
import { UserTable } from './components/UserTable';
import { QuizzesPagination } from '@/src/app/my-quizzes/components/QuizzesPagination';
import { AdminUsersLoadingSkeleton } from './components/AdminUsersLoadingSkeleton';
import { AdminUsersErrorState } from './components/AdminUsersErrorState';
import { AdminUsersEmptyState } from './components/AdminUsersEmptyState';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { ProtectedRoute } from '@/src/components/auth/ProtectedRoute';
import { AdminLayout } from '@/src/components/layout/AdminLayout';

const AdminUsersPage: React.FC = () => {
    const {
        users,
        isLoading,
        error,
        currentPage,
        totalPages,
        goToPage,
        loadAdminUsers,
    } = useAdminUsersData();

    const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
    const handleOpenAddUserDialog = () => {
        setIsAddUserDialogOpen(true);
    };

    let contentToRender;

    if (error) {
        contentToRender = (
            <AdminUsersErrorState message={error} onRetry={() => loadAdminUsers(currentPage)} />
        );
    } else if (isLoading) {
        contentToRender = (
            <AdminUsersLoadingSkeleton />
        );
    } else if (users.length === 0) {
        contentToRender = (
            <AdminUsersEmptyState onAddUser={handleOpenAddUserDialog} />
        );
    } else {
        // Default content when data is loaded and available
        contentToRender = (
            <Card className="bg-secondary-bg text-text-primary border-border-color shadow-card-shadow">
                <CardContent className="p-0">
                    <UserTable users={users} />
                </CardContent>
                {totalPages > 1 && (
                    <div className="p-4 flex justify-end">
                        <QuizzesPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={goToPage}
                        />
                    </div>
                )}
            </Card>
        );
    }

    return (
        // Wrap the entire page content with ProtectedRoute, specifying the required role.
        // ProtectedRoute will handle redirection if the user is not authenticated or not an ADMIN.
        <ProtectedRoute expectedRole="ROLE_ADMIN">
            <AdminLayout>
                <div className="container mx-auto p-4 md:p-6 lg:p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-text-primary">Quản lý tài khoản</h1>
                        <Button
                            onClick={handleOpenAddUserDialog}
                            className="bg-accent-color hover:bg-accent-hover text-text-primary px-4 py-2 rounded-md"
                        >
                            <i className="fas fa-plus mr-2"></i> Thêm tài khoản
                        </Button>
                    </div>
                    {contentToRender}
                </div>
            </AdminLayout>
        </ProtectedRoute>
    );
};

export default AdminUsersPage;