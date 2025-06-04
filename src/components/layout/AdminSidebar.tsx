// src/components/layout/AdminSidebar.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/src/lib/utils'; //
import {
    LayoutDashboard,
    UserCog,
    Tags,
    ImageIcon,
    FileText,
    KeyRound,
    LogOut,
    ShieldCheck // Example icon for VQ logo
} from 'lucide-react'; // Using lucide-react for icons

interface NavItem {
    href: string;
    label: string;
    icon: React.ElementType;
    isActive?: (pathname: string) => boolean;
}

const navItems: NavItem[] = [
    { href: '/admin/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { href: '/admin/accounts', label: 'Quản lý tài khoản', icon: UserCog },
    { href: '/admin/tags', label: 'Quản lý Tag', icon: Tags },
    { href: '/admin/images', label: 'Quản lý Hình ảnh', icon: ImageIcon },
    { href: '/admin/reports', label: 'Quản lý Báo cáo', icon: FileText },
    { href: '/admin/change-password', label: 'Đổi mật khẩu', icon: KeyRound },
    // Đăng xuất will likely be handled by a button in the header or user menu,
    // but can be an item here if preferred.
];

const AdminSidebar: React.FC = () => {
    const pathname = usePathname();

    // TODO: Implement logout functionality, likely via useAuth context
    const handleLogout = () => {
        console.log("Logout action");
        // Example: auth.logout(); router.push('/login');
    };

    return (
        <aside
            className="
                w-64 bg-secondary-bg text-text-secondary
                flex flex-col h-screen fixed left-0 top-0 z-40
                border-r border-border-color
            "
        // Style constants from screen-admin-01-account.html
        // --secondary-bg: #2D2D34;
        // --text-secondary: #B0B0B0;
        // --border-color: #404048;
        >
            <div
                className="
                    h-16 flex items-center justify-center px-4
                    border-b border-border-color
                "
            >
                <Link href="/admin" className="flex items-center gap-2 text-accent-color no-underline">
                    {/* VQ Logo styled like in HTML */}
                    <span
                        className="
                            font-bold bg-accent-color text-primary-bg
                            py-1 px-2 rounded text-lg
                        "
                    // --accent-color: #8A3FFC;
                    // --primary-bg: #1E1E24;
                    >
                        VQ
                    </span>
                    <h2 className="text-xl font-semibold text-accent-color">VUI QUIZ</h2>
                </Link>
            </div>
            <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
                <ul>
                    {navItems.map((item) => {
                        const IconComponent = item.icon;
                        const isActive = item.isActive ? item.isActive(pathname) : pathname.startsWith(item.href);
                        return (
                            <li key={item.label}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        `
                                            flex items-center gap-3 px-3 py-2.5 rounded-md
                                            text-sm transition-colors duration-150
                                            hover:bg-input-bg hover:text-text-primary
                                        `, //
                                        // --input-bg: #2D2D34; (same as --secondary-bg, consider slight dark for hover)
                                        // --text-primary: #EAEAEA;
                                        isActive ? 'bg-accent-color text-white font-medium' : 'text-text-secondary' //
                                        // --accent-color: #8A3FFC;
                                    )}
                                >
                                    <IconComponent className="h-5 w-5" />
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            <div className="p-4 border-t border-border-color">
                {/* It's common to have logout in a user dropdown in the header,
                    but if placed in sidebar, it'd be here. */}
                <button
                    onClick={handleLogout}
                    className="
                        flex items-center gap-3 px-3 py-2.5 rounded-md text-sm w-full
                        text-text-secondary hover:bg-input-bg hover:text-text-primary
                        transition-colors duration-150
                    "
                >
                    <LogOut className="h-5 w-5" />
                    Đăng xuất
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;