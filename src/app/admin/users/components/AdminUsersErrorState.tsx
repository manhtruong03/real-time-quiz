// src/app/admin/users/components/AdminUsersErrorState.tsx
import React from 'react';
import { Card, CardContent } from '@/src/components/ui/card'; //
import { Button } from '@/src/components/ui/button'; //

interface AdminUsersErrorStateProps {
    message: string;
    onRetry: () => void;
}

export const AdminUsersErrorState: React.FC<AdminUsersErrorStateProps> = ({ message, onRetry }) => {
    return (
        <Card className="bg-secondary-bg text-text-primary border-border-color shadow-card-shadow"> {/* Apply admin UI styling */}
            <CardContent className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[300px]">
                <i className="fas fa-exclamation-triangle text-danger-color text-5xl mb-4"></i> {/* */}
                <h2 className="text-xl font-semibold mb-2">Lỗi tải dữ liệu tài khoản</h2>
                <p className="text-text-secondary mb-4">{message || "Đã xảy ra lỗi khi tải danh sách tài khoản. Vui lòng thử lại."}</p>
                <Button onClick={onRetry} className="bg-accent-color hover:bg-accent-hover text-text-primary"> {/* */}
                    Thử lại
                </Button>
            </CardContent>
        </Card>
    );
};