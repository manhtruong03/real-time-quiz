// src/components/layout/AppHeader.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button'; //
import { Brain, LogOut, User } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext'; //
import { cn } from '@/src/lib/utils'; //

interface AppHeaderProps {
    currentPage?: 'home' | 'categories' | 'leaderboard' | 'profile' | 'login' | 'signup' | 'my-quizzes' | 'create-quiz';
}

export const AppHeader: React.FC<AppHeaderProps> = ({ currentPage }) => {
    const { isAuthenticated, user, logout } = useAuth(); //
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const navLinkClasses = (page: string) => cn(
        "font-medium hover:text-primary transition-colors px-3 py-2 rounded-md text-sm", // Added padding and rounded for better hover appearance
        currentPage === page && "text-primary bg-primary/10" // Highlight active page with a subtle background
    );

    // Style for the logout button to match profile action buttons
    const logoutButtonStyle = "bg-card hover:bg-muted text-foreground hover:text-foreground border-border focus-visible:ring-primary";

    return (
        <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur"> {/* Use theme variable for border */}
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                {/* Branding */}
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-2">
                        <Brain className="h-8 w-8 text-primary" />
                        <h1 className="text-xl md:text-2xl font-bold text-foreground">VUI QUIZ</h1> {/* Ensure text color contrasts */}
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="hidden md:flex items-center gap-1"> {/* Reduced gap for tighter nav items */}
                    <Link href="/" className={navLinkClasses('home')}>Trang chủ</Link>
                    <Link href="/categories" className={navLinkClasses('categories')}>Thể loại</Link>
                    <Link href="/leaderboard" className={navLinkClasses('leaderboard')}>Bảng xếp hạng</Link>
                    {isAuthenticated && (
                        <Link href="/profile" className={navLinkClasses('profile')}>Hồ sơ</Link>
                    )}
                </nav>

                {/* Auth Buttons / User Actions */}
                <div className="flex gap-2 items-center">
                    {isAuthenticated ? (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLogout}
                                className={cn(logoutButtonStyle, "gap-1.5")} // Apply new style
                            >
                                <LogOut className="h-4 w-4" /> Đăng xuất
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" passHref>
                                <Button variant="outline" size="sm" className={cn(navLinkClasses('login'), "border-border hover:bg-accent hover:text-accent-foreground")}>Đăng nhập</Button>
                            </Link>
                            <Link href="/signup" passHref>
                                <Button size="sm" className={navLinkClasses('signup')}>Đăng ký</Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};