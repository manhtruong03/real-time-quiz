// src/app/admin/accounts/components/UsersTable.tsx
import React from 'react';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from '@/src/components/ui/table'; // [cite: manhtruong03/real-time-quiz/real-time-quiz-main/src/components/ui/table.tsx]
import { Button } from '@/src/components/ui/button'; // [cite: manhtruong03/real-time-quiz/real-time-quiz-main/src/components/ui/button.tsx]
import { Pencil, Trash2 } from 'lucide-react';
import type { UserAccountAdminViewDTO } from '@/src/lib/types/api'; // [cite: manhtruong03/real-time-quiz/real-time-quiz-main/src/lib/types/api.ts]
import StatusBadge from './StatusBadge'; // [cite: src/app/admin/accounts/components/StatusBadge.tsx (previous step)]
import { cn } from '@/src/lib/utils';

interface UsersTableProps {
    users: UserAccountAdminViewDTO[];
    onEditUser: (user: UserAccountAdminViewDTO) => void; // Placeholder for future action
    onDeleteUser: (user: UserAccountAdminViewDTO) => void; // Placeholder for future action
}

// Helper function to format bytes into a more readable string (KB, MB, GB)
const formatStorageSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const UsersTable: React.FC<UsersTableProps> = ({ users, onEditUser, onDeleteUser }) => {
    // Styling classes based on screen-admin-01-account.html
    const thClasses = "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary bg-table-header-bg";
    // --table-header-bg: #25252B; (same as --content-bg)
    // --text-secondary: #B0B0B0;
    const tdClasses = "px-4 py-3 whitespace-nowrap text-sm text-text-primary";
    // --text-primary: #EAEAEA;
    const rowClasses = "border-b border-border-color hover:bg-table-row-hover-bg";
    // --border-color: #404048;
    // --table-row-hover-bg: #31313a;

    const handleEdit = (user: UserAccountAdminViewDTO) => {
        // To be implemented in Phase 3
        console.log("Edit user:", user.userId);
        onEditUser(user);
    };

    const handleDelete = (user: UserAccountAdminViewDTO) => {
        // To be implemented in Phase 4
        console.log("Delete user:", user.userId);
        onDeleteUser(user);
    };


    return (
        <Table className="min-w-full divide-y divide-border-color">
            {/* --border-color: #404048; */}
            <TableHeader>
                <TableRow className="border-b-0"> {/* Remove default bottom border for header row if using custom classes */}
                    <TableHead className={cn(thClasses, "rounded-tl-md")}>Mã tài khoản</TableHead>
                    <TableHead className={thClasses}>Tên tài khoản</TableHead>
                    <TableHead className={thClasses}>Email</TableHead>
                    <TableHead className={thClasses}>Vai trò</TableHead>
                    <TableHead className={thClasses}>Dung lượng</TableHead>
                    <TableHead className={thClasses}>Trạng thái</TableHead>
                    <TableHead className={cn(thClasses, "text-right rounded-tr-md")}>Hành động</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody className="bg-secondary-bg divide-y divide-border-color">
                {/* --secondary-bg: #2D2D34; */}
                {users.map((user) => (
                    <TableRow key={user.userId} className={rowClasses}>
                        <TableCell className={tdClasses}>{user.userId}</TableCell>
                        <TableCell className={tdClasses}>{user.username}</TableCell>
                        <TableCell className={tdClasses}>{user.email || 'N/A'}</TableCell>
                        <TableCell className={tdClasses}>{user.role}</TableCell>
                        <TableCell className={tdClasses}>{formatStorageSize(user.storageUsed)}</TableCell>
                        <TableCell className={tdClasses}>
                            <StatusBadge isActive={!user.deletedAt} />
                        </TableCell>
                        <TableCell className={cn(tdClasses, "text-right space-x-2")}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-blue-500 hover:text-blue-400 h-8 w-8" // Similar to btn-edit
                                onClick={() => handleEdit(user)}
                                title="Sửa"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-danger-color hover:text-danger-hover h-8 w-8" // btn-danger
                                onClick={() => handleDelete(user)}
                                disabled={!!user.deletedAt} // Disable if already deleted
                                title="Xóa (Vô hiệu hóa)"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export default UsersTable;