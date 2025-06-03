// src/components/layout/AdminLayout.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // To highlight active navigation link
import { Button } from '@/src/components/ui/button'; //
import { Separator } from '@/src/components/ui/separator'; //
import { cn } from '@/src/lib/utils'; //
import { useAuth } from '@/src/context/AuthContext'; //

interface AdminLayoutProps {
    children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const pathname = usePathname();
    const { user, logout } = useAuth(); //

    const navItems = [
        { href: "/admin/overview", label: "Tổng quan", icon: "fas fa-tachometer-alt" }, // - Path is placeholder, not explicitly in HTML but good practice
        { href: "/admin/users", label: "Quản lý tài khoản", icon: "fas fa-users" }, //
        { href: "/admin/tags", label: "Quản lý Tag", icon: "fas fa-tags" }, // - Path is placeholder
        { href: "/admin/images", label: "Quản lý Hình ảnh", icon: "fas fa-image" }, // - Path is placeholder
        { href: "/admin/reports", label: "Quản lý Báo cáo", icon: "fas fa-file-alt" }, // - Path is placeholder
    ];

    const bottomNavItems = [
        { href: "/admin/change-password", label: "Đổi mật khẩu", icon: "fas fa-key" }, // - Path is placeholder
    ];

    return (
        <div className="flex min-h-screen bg-primary-bg text-text-primary"> {/* */}
            {/* Sidebar */}
            <aside className="w-64 bg-secondary-bg p-4 flex flex-col shadow-lg border-r border-border-color"> {/* */}
                <div className="flex items-center justify-center h-20 mb-6">
                    {/* Logo Section - As per HTML, a text logo */}
                    <Link href="/admin/users" className="text-2xl font-bold text-accent-color"> {/* */}
                        VQ VUI QUIZ
                    </Link>
                </div>

                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href} passHref legacyBehavior>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start px-4 py-2 text-base rounded-md transition-colors duration-200",
                                    "text-text-secondary hover:bg-accent-color hover:text-text-primary", // Default and hover styles
                                    pathname === item.href && "bg-accent-color text-text-primary font-semibold" // Active style
                                )}
                            >
                                <i className={cn(item.icon, "mr-3 w-5 text-center")}></i> {/* Icon */}
                                {item.label}
                            </Button>
                        </Link>
                    ))}
                </nav>

                {/* Separator before bottom navigation */}
                <Separator className="my-4 bg-border-color" /> {/* */}

                <nav className="space-y-2">
                    {bottomNavItems.map((item) => (
                        <Link key={item.href} href={item.href} passHref legacyBehavior>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start px-4 py-2 text-base rounded-md transition-colors duration-200",
                                    "text-text-secondary hover:bg-accent-color hover:text-text-primary",
                                    pathname === item.href && "bg-accent-color text-text-primary font-semibold"
                                )}
                            >
                                <i className={cn(item.icon, "mr-3 w-5 text-center")}></i>
                                {item.label}
                            </Button>
                        </Link>
                    ))}
                    {user && ( // Only show logout if a user is logged in
                        <Button
                            variant="ghost"
                            className="w-full justify-start px-4 py-2 text-base rounded-md transition-colors duration-200 text-text-secondary hover:bg-danger-color hover:text-text-primary"
                            onClick={logout}
                        >
                            <i className="fas fa-sign-out-alt mr-3 w-5 text-center"></i> {/* */}
                            Đăng xuất
                        </Button>
                    )}
                </nav>

                {user && (
                    <div className="mt-auto pt-4 text-center text-text-secondary">
                        <p className="text-sm">Đăng nhập với:</p>
                        <p className="text-md font-semibold text-text-primary">{user.username}</p> {/* Display logged-in username */}
                        <p className="text-xs text-text-secondary">({user.roles.join(', ')})</p> {/* Display user roles */}
                    </div>
                )}
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-4 bg-primary-bg"> {/* */}
                {children}
            </main>
        </div>
    );
};