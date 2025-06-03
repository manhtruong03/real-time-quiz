// src/app/admin/users/components/AdminUsersEmptyState.tsx
import React from 'react';
import { Card, CardContent } from '@/src/components/ui/card'; //
import { Button } from '@/src/components/ui/button'; //

interface AdminUsersEmptyStateProps {
    onAddUser: () => void;
}

export const AdminUsersEmptyState: React.FC<AdminUsersEmptyStateProps> = ({ onAddUser }) => {
    return (
        <Card className="bg-secondary-bg text-text-primary border-border-color shadow-card-shadow"> {/* Apply admin UI styling */}
            <CardContent className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[300px]">
                <i className="fas fa-users-slash text-text-secondary text-5xl mb-4"></i> {/* A relevant icon, assuming fas exists */}
                <h2 className="text-xl font-semibold mb-2">Chưa có tài khoản nào được tạo</h2>
                <p className="text-text-secondary mb-4">
                    Hãy bắt đầu bằng cách thêm tài khoản người dùng mới vào hệ thống.
                </p>
                <Button onClick={onAddUser} className="bg-accent-color hover:bg-accent-hover text-text-primary"> {/* */}
                    <i className="fas fa-plus mr-2"></i> Thêm tài khoản mới
                </Button>
            </CardContent>
        </Card>
    );
};