// src/app/admin/users/components/UserTable.tsx
import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/src/components/ui/table';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { UserAccountAdminViewDTO } from '@/src/lib/types/api';
import { cn } from '@/src/lib/utils';

interface UserTableProps {
    users: UserAccountAdminViewDTO[];
}

export const UserTable: React.FC<UserTableProps> = ({ users }) => {
    return (
        <div className="rounded-md border overflow-hidden">
            <Table>
                <TableHeader className="bg-primary-bg">
                    <TableRow>
                        <TableHead className="w-[100px] text-text-secondary">Mã tài khoản</TableHead>
                        <TableHead className="text-text-secondary">Tên tài khoản</TableHead>
                        <TableHead className="text-text-secondary">Email</TableHead>
                        <TableHead className="text-text-secondary">Vai trò</TableHead>
                        <TableHead className="text-text-secondary">Dung lượng</TableHead>
                        <TableHead className="text-text-secondary">Trạng thái</TableHead>
                        <TableHead className="text-right text-text-secondary">Hành động</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-text-secondary">
                                Không có tài khoản nào.
                            </TableCell>
                        </TableRow>
                    ) : (
                        users.map((user) => (
                            <TableRow key={user.userId} className="even:bg-content-bg odd:bg-secondary-bg hover:bg-accent-hover/10">
                                <TableCell className="font-medium text-text-primary">{user.userId}</TableCell>
                                <TableCell className="text-text-primary">{user.username}</TableCell>
                                <TableCell className="text-text-secondary">{user.email}</TableCell>
                                <TableCell className="text-text-secondary">{user.role}</TableCell>{/* Corrected: Use user.role directly as it's a string */}
                                <TableCell className="text-text-secondary">{user.storageUsed} bytes</TableCell>{/* Display storageUsed in bytes, matching API type */}
                                <TableCell>
                                    <Badge
                                        className={cn(
                                            "px-2 py-1 rounded-full text-xs font-semibold",
                                            user.deletedAt // If deletedAt exists, user is inactive
                                                ? "bg-disabled-color text-text-primary"
                                                : "bg-success-color text-text-primary"
                                        )}
                                    >
                                        {user.deletedAt ? 'Vô hiệu hóa' : 'Hoạt động'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="icon" className="text-text-secondary hover:text-accent-color">
                                        <i className="fas fa-edit"></i>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "text-text-secondary hover:text-danger-color",
                                            user.deletedAt && "opacity-50 cursor-not-allowed"
                                        )}
                                        disabled={user.deletedAt !== null} // Disable if already inactive
                                    >
                                        <i className="fas fa-trash-alt"></i>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};