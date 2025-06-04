// src/app/admin/accounts/components/UserAccountForm.tsx
"use client";

import React, { useEffect } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod'; // Import z for schema types

import {
    userAccountCreationSchema,
    UserAccountCreationFormValues,
    userAccountUpdateSchema,
    UserAccountUpdateFormValues,
    UserRoleEnum,
} from '@/src/lib/schemas/admin/user-account.schema';
import { Button } from '@/src/components/ui/button';
import { Form } from '@/src/components/ui/form';
import { RHFTextField } from '@/src/components/rhf/RHFTextField';
import { RHFSelectField } from '@/src/components/rhf/RHFSelectField';
import { Loader2 } from 'lucide-react';

// Define props based on mode
interface UserAccountFormCommonProps {
    isLoading?: boolean;
}

interface CreateModeProps extends UserAccountFormCommonProps {
    mode: 'create';
    onSubmit: (values: UserAccountCreationFormValues) => Promise<void>;
    defaultValues?: Partial<UserAccountCreationFormValues>;
    submitButtonText?: string;
}

interface EditModeProps extends UserAccountFormCommonProps {
    mode: 'edit';
    onSubmit: (values: UserAccountUpdateFormValues) => Promise<void>;
    defaultValues?: Partial<UserAccountUpdateFormValues>; // Typically, all editable fields will be provided
    submitButtonText?: string;
}

type UserAccountFormProps = CreateModeProps | EditModeProps;

const UserAccountForm: React.FC<UserAccountFormProps> = (props) => {
    const { mode, onSubmit, isLoading = false, defaultValues: propsDefaultValues } = props;

    const schema = mode === 'create' ? userAccountCreationSchema : userAccountUpdateSchema;

    // Explicitly type the form instance based on the mode
    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        // Default values for creation mode, propsDefaultValues for edit mode
        defaultValues: propsDefaultValues || (mode === 'create' ? {
            username: '',
            email: '', // Will be transformed to null if empty by Zod schema for creation
            password: '',
            confirmPassword: '',
            role: undefined,
        } : {}), // Edit mode relies on propsDefaultValues entirely
    });

    // Effect to reset form when defaultValues change (especially for edit mode when user selection changes)
    useEffect(() => {
        if (propsDefaultValues) {
            form.reset(propsDefaultValues as any); // Use 'as any' or ensure propsDefaultValues matches form type
        }
    }, [propsDefaultValues, form.reset, form]);


    const roleOptions = UserRoleEnum.options.map(role => ({
        value: role,
        label: role.charAt(0).toUpperCase() + role.slice(1).toLowerCase(),
    }));

    const currentSubmitButtonText = props.submitButtonText || (mode === 'create' ? "Tạo tài khoản" : "Lưu thay đổi");

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6"> {/* Use 'as any' for onSubmit due to union type */}
                <RHFTextField
                    name="username"
                    label="Tên tài khoản"
                    placeholder="Nhập tên tài khoản"
                />
                <RHFTextField
                    name="email"
                    label={mode === 'create' ? "Email (Tùy chọn)" : "Email"}
                    placeholder="Nhập địa chỉ email"
                    type="email"
                />

                {mode === 'create' && (
                    <>
                        <RHFTextField
                            name="password"
                            label="Mật khẩu"
                            placeholder="Nhập mật khẩu"
                            type="password"
                        />
                        <RHFTextField
                            name="confirmPassword"
                            label="Xác nhận mật khẩu"
                            placeholder="Nhập lại mật khẩu"
                            type="password"
                        />
                    </>
                )}

                <RHFSelectField
                    name="role"
                    label="Vai trò"
                    placeholder="Chọn vai trò"
                    options={roleOptions}
                />

                <Button type="submit" disabled={isLoading} className="w-full bg-accent-color hover:bg-accent-hover">
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang xử lý...
                        </>
                    ) : (
                        currentSubmitButtonText
                    )}
                </Button>
            </form>
        </Form>
    );
};

export default UserAccountForm;