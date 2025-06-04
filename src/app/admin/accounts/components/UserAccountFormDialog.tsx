// src/app/admin/accounts/components/UserAccountFormDialog.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/src/components/ui/dialog'; //
import UserAccountForm from './UserAccountForm';
import {
    UserAccountCreationFormValues,
    UserAccountUpdateFormValues,
} from '@/src/lib/schemas/admin/user-account.schema'; //
import {
    UserAccountAdminViewDTO,
    UserAccountCreationRequestDTO,
    UserAccountUpdateRequestDTO,
} from '@/src/lib/types/api'; //
import { createUserAccountAdmin, updateUserAccountAdmin } from '@/src/lib/api/admin/users'; //
import { useToast } from '@/src/hooks/use-toast'; //

interface UserAccountFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAccountCreated?: () => void; // Callback for create success
    onAccountUpdated?: (updatedUser: UserAccountAdminViewDTO) => void; // Callback for update success
    editingUser?: UserAccountAdminViewDTO | null; // User data for editing
}

const UserAccountFormDialog: React.FC<UserAccountFormDialogProps> = ({
    open,
    onOpenChange,
    onAccountCreated,
    onAccountUpdated,
    editingUser,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const mode = editingUser ? 'edit' : 'create';

    // Key for UserAccountForm to force re-initialization when mode or editingUser changes
    // This ensures defaultValues are correctly applied when switching from create to edit, or editing different users.
    const formKey = useMemo(() => {
        return editingUser ? `edit-${editingUser.userId}` : `create-${Date.now()}`;
    }, [editingUser]);


    const defaultValuesForForm = useMemo(() => {
        if (mode === 'edit' && editingUser) {
            // Prepare defaultValues for UserAccountUpdateFormValues
            return {
                username: editingUser.username,
                email: editingUser.email || '', // Form expects string, Zod will transform '' to null
                role: editingUser.role as UserAccountUpdateFormValues['role'], // Cast if UserRoleEnum is a subset
            };
        }
        // For create mode, UserAccountForm handles its own empty defaults if not provided
        return undefined;
    }, [mode, editingUser]);

    const handleCreateSubmit = async (values: UserAccountCreationFormValues) => {
        setIsSubmitting(true);
        try {
            const apiPayload: UserAccountCreationRequestDTO = {
                username: values.username,
                email: values.email, // Already transformed to null if empty by Zod schema
                password: values.password,
                role: values.role,
            };
            await createUserAccountAdmin(apiPayload);
            toast({
                title: "Thành công!",
                description: "Tài khoản mới đã được tạo.",
            });
            if (onAccountCreated) onAccountCreated();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Failed to create account:", error);
            toast({
                title: "Lỗi",
                description: error.data?.message || error.message || "Không thể tạo tài khoản.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateSubmit = async (values: UserAccountUpdateFormValues) => {
        if (!editingUser) return;
        setIsSubmitting(true);
        try {
            // Construct payload ensuring only defined values (or nulls if intended) are sent
            // Zod schema for update has fields as optional.
            // If a field is undefined in 'values', it won't be sent by JSON.stringify implicitly.
            // If a field is present and null (e.g. email transformed from ''), it will be sent as null.
            const apiPayload: UserAccountUpdateRequestDTO = {
                username: values.username, // Will be undefined if not in form values / not changed & schema is optional
                email: values.email,    // Will be null if cleared, or undefined if not touched.
                role: values.role,      // Will be undefined if not in form values
            };

            // Filter out undefined properties to send a cleaner payload,
            // though backend should ignore them or treat them as "no change".
            // Or rely on JSON.stringify to remove undefined keys.
            // For fields meant to be 'nulled' (like email), they should be explicitly 'null'.
            // The current schema for email transforms empty string to null.

            const updatedUser = await updateUserAccountAdmin(editingUser.userId, apiPayload);
            toast({
                title: "Thành công!",
                description: `Tài khoản ${editingUser.username} đã được cập nhật.`,
            });
            if (onAccountUpdated) onAccountUpdated(updatedUser);
            onOpenChange(false);
        } catch (error: any) {
            console.error("Failed to update account:", error);
            toast({
                title: "Lỗi",
                description: error.data?.message || error.message || "Không thể cập nhật tài khoản.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const dialogTitle = mode === 'edit' ? "Chỉnh sửa tài khoản" : "Thêm tài khoản mới";
    const dialogDescription = mode === 'edit'
        ? `Cập nhật thông tin chi tiết cho tài khoản ${editingUser?.username || ''}.`
        : "Điền thông tin chi tiết để tạo tài khoản người dùng mới.";

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (isSubmitting && !isOpen) return; // Prevent closing while submitting via Escape key
            onOpenChange(isOpen);
        }}>
            <DialogContent
                className="sm:max-w-[480px] bg-content-bg border-border-color text-text-primary"
                onInteractOutside={(e) => {
                    if (isSubmitting) e.preventDefault();
                }}
            // Hide default close button while submitting to prevent accidental data loss
            // This requires custom handling if Dialog component doesn't support disabling close button directly
            // For now, relying on onInteractOutside and onOpenChange logic.
            >
                <DialogHeader>
                    <DialogTitle className="text-xl text-text-primary">{dialogTitle}</DialogTitle>
                    <DialogDescription className="text-text-secondary">
                        {dialogDescription}
                    </DialogDescription>
                </DialogHeader>

                {mode === 'create' ? (
                    <UserAccountForm
                        key={formKey} // Ensures form reset for create mode
                        mode="create"
                        onSubmit={handleCreateSubmit}
                        isLoading={isSubmitting}
                        defaultValues={defaultValuesForForm as Partial<UserAccountCreationFormValues>} // Cast needed due to union
                    />
                ) : (
                    <UserAccountForm
                        key={formKey} // Ensures form reset if editingUser changes
                        mode="edit"
                        onSubmit={handleUpdateSubmit}
                        isLoading={isSubmitting}
                        defaultValues={defaultValuesForForm as Partial<UserAccountUpdateFormValues>} // Cast needed
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};

export default UserAccountFormDialog;