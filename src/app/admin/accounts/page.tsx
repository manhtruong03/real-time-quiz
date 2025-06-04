// src/app/admin/accounts/page.tsx
"use client";

import React, { useState } from 'react';
import AdminLayout from '@/src/components/layout/AdminLayout';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';
import { Button } from '@/src/components/ui/button';
import { Plus, AlertTriangle, RefreshCw, Users as UsersIcon } from 'lucide-react'; // Renamed Users to UsersIcon

import { useAdminUsersData } from './hooks/useAdminUsersData';
import UsersTable from './components/UsersTable';
import AdminAccountsPagination from './components/AdminAccountsPagination';
import type { UserAccountAdminViewDTO } from '@/src/lib/types/api';
import { Skeleton } from '@/src/components/ui/skeleton';
import UserAccountFormDialog from './components/UserAccountFormDialog';
import ConfirmationDialog from '@/src/components/common/ConfirmationDialog'; // Import ConfirmationDialog
import { useToast } from '@/src/hooks/use-toast'; // Import useToast
import { deleteUserAccountAdmin } from '@/src/lib/api/admin/users'; // Import deleteUserAccountAdmin

const AdminAccountsPageContent: React.FC = () => {
    const {
        users,
        isLoading,
        error,
        currentPage,
        totalPages,
        goToPage,
        refreshUsers,
    } = useAdminUsersData();

    const { toast } = useToast(); // Initialize toast

    // State for Create/Edit User Dialog
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<UserAccountAdminViewDTO | null>(null);

    // State for Delete User Confirmation Dialog
    const [userTargetedForAction, setUserTargetedForAction] = useState<UserAccountAdminViewDTO | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isDeletingUser, setIsDeletingUser] = useState(false);


    const handleOpenCreateDialog = () => {
        setUserToEdit(null);
        setIsFormDialogOpen(true);
    };

    const handleOpenEditDialog = (user: UserAccountAdminViewDTO) => {
        setUserToEdit(user);
        setIsFormDialogOpen(true);
    };

    const handleFormDialogClose = (isOpen: boolean) => {
        setIsFormDialogOpen(isOpen);
        if (!isOpen) {
            setUserToEdit(null);
        }
    };

    const handleAccountCreated = () => {
        refreshUsers({ page: 0 });
    };

    const handleAccountUpdated = () => { // Removed updatedUser param as it's not used directly here
        refreshUsers();
    };

    // Handler for when "Delete" button in UsersTable is clicked
    const handleDeleteUserRequest = (user: UserAccountAdminViewDTO) => {
        setUserTargetedForAction(user);
        setIsDeleteConfirmOpen(true);
    };

    // Handler for closing the delete confirmation dialog
    const handleDeleteConfirmDialogClose = (isOpen: boolean) => {
        setIsDeleteConfirmOpen(isOpen);
        if (!isOpen) {
            setUserTargetedForAction(null); // Clear the targeted user if dialog is closed
        }
    };

    // Function to execute when deletion is confirmed
    const executeDeleteUser = async () => {
        if (!userTargetedForAction) return;

        setIsDeletingUser(true);
        try {
            const response = await deleteUserAccountAdmin(userTargetedForAction.userId); //
            toast({
                title: "Thành công!",
                description: response.message || `Tài khoản "${userTargetedForAction.username}" đã được vô hiệu hóa.`,
            });
            refreshUsers();
            setIsDeleteConfirmOpen(false); // Close confirmation dialog
            setUserTargetedForAction(null); // Clear targeted user
        } catch (error: any) {
            console.error("Failed to delete user:", error);
            toast({
                title: "Lỗi",
                description: error.data?.message || error.message || "Không thể vô hiệu hóa tài khoản.",
                variant: "destructive",
            });
            // Optionally keep dialog open on error, or close it
            // setIsDeleteConfirmOpen(false); 
            // setUserTargetedForAction(null);
        } finally {
            setIsDeletingUser(false);
        }
    };


    const renderContent = () => {
        if (isLoading) {
            // ... Loading skeleton (no changes)
            return (
                <>
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4 p-4 bg-secondary-bg/50 rounded">
                                <Skeleton className="h-10 w-24" />
                                <Skeleton className="h-10 w-40" />
                                <Skeleton className="h-10 flex-1" />
                                <Skeleton className="h-10 w-20" />
                                <Skeleton className="h-10 w-24" />
                                <Skeleton className="h-10 w-32" />
                                <Skeleton className="h-10 w-20" />
                            </div>
                        ))}
                    </div>
                    <AdminAccountsPagination currentPage={0} totalPages={0} onPageChange={() => { }} className="mt-6 opacity-0 pointer-events-none" />
                </>
            );
        }

        if (error) {
            // ... Error display (no changes)
            return (
                <div className="text-center py-10 text-destructive flex flex-col items-center">
                    <AlertTriangle className="h-12 w-12 mb-4" />
                    <p className="text-xl mb-2">Lỗi tải dữ liệu</p>
                    <p className="mb-4">{error.message || "Không thể tải danh sách tài khoản."}</p>
                    <Button onClick={() => refreshUsers()} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
                    </Button>
                </div>
            );
        }

        if (users.length === 0) {
            // ... Empty state display (no changes)
            return (
                <div className="text-center py-10 text-text-secondary">
                    <UsersIcon className="h-16 w-16 mx-auto mb-4 text-gray-500" />
                    <p className="text-xl">Không tìm thấy tài khoản nào.</p>
                    <p>Bạn có thể bắt đầu bằng cách thêm tài khoản mới.</p>
                </div>
            );
        }

        return (
            <>
                <UsersTable
                    users={users}
                    onEditUser={handleOpenEditDialog}
                    onDeleteUser={handleDeleteUserRequest} // Connect to delete request handler
                />
                {totalPages > 0 && (
                    <AdminAccountsPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={goToPage}
                        className="mt-6"
                    />
                )}
            </>
        );
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
                    Quản lý tài khoản
                </h1>
                <Button
                    onClick={handleOpenCreateDialog}
                    variant="default"
                    className="bg-accent-color hover:bg-accent-hover text-white"
                >
                    <Plus className="mr-2 h-5 w-5" />
                    Thêm tài khoản
                </Button>
            </div>

            <div className="bg-secondary-bg p-1 md:p-3 rounded-lg shadow-md min-h-[300px]">
                {renderContent()}
            </div>

            <UserAccountFormDialog
                open={isFormDialogOpen}
                onOpenChange={handleFormDialogClose}
                editingUser={userToEdit}
                onAccountCreated={handleAccountCreated}
                onAccountUpdated={handleAccountUpdated}
            />

            {/* Render the ConfirmationDialog for delete actions */}
            {userTargetedForAction && (
                <ConfirmationDialog
                    open={isDeleteConfirmOpen}
                    onOpenChange={handleDeleteConfirmDialogClose}
                    title="Xác nhận vô hiệu hóa tài khoản"
                    description={
                        <>
                            Bạn có chắc chắn muốn vô hiệu hóa tài khoản
                            <strong className="px-1">{userTargetedForAction.username}</strong>?
                            Hành động này sẽ đánh dấu tài khoản là đã xóa và người dùng sẽ không thể đăng nhập.
                        </>
                    }
                    onConfirm={executeDeleteUser}
                    confirmButtonText="Vô hiệu hóa"
                    confirmButtonVariant="destructive"
                    isConfirming={isDeletingUser}
                    icon={AlertTriangle}
                />
            )}
        </>
    );
};

const AdminAccountsPage: React.FC = () => {
    return (
        <ProtectedRoute expectedRole="ADMIN">
            <AdminLayout>
                <AdminAccountsPageContent />
            </AdminLayout>
        </ProtectedRoute>
    );
};

export default AdminAccountsPage;