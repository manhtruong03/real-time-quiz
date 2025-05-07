// src/components/layout/AppHeader.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { Brain, LogOut, User } from 'lucide-react'; // Add User icon
import { useAuth } from '@/src/context/AuthContext';
import { cn } from '@/src/lib/utils';

interface AppHeaderProps {
    currentPage?: 'home' | 'categories' | 'leaderboard' | 'profile' | 'login' | 'signup'; // To highlight active nav
}

export const AppHeader: React.FC<AppHeaderProps> = ({ currentPage }) => {
    const { isAuthenticated, user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login'); // Redirect to login after logout
    };

    const navLinkClasses = (page: string) => cn(
        "font-medium hover:text-primary transition-colors",
        currentPage === page && "text-primary" // Highlight active page
    );

    return (
        <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                {/* Branding */}
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-2">
                        <Brain className="h-8 w-8 text-primary" />
                        <h1 className="text-xl md:text-2xl font-bold">VUI QUIZ</h1>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="hidden md:flex gap-6">
                    <Link href="/" className={navLinkClasses('home')}>Home</Link>
                    <Link href="/categories" className={navLinkClasses('categories')}>Categories</Link>
                    <Link href="/leaderboard" className={navLinkClasses('leaderboard')}>Leaderboard</Link>
                    {isAuthenticated && (
                        <Link href="/profile" className={navLinkClasses('profile')}>Profile</Link>
                    )}
                    {/* Add other primary navigation links here */}
                </nav>

                {/* Auth Buttons / User Actions */}
                <div className="flex gap-2 items-center">
                    {isAuthenticated ? (
                        <>
                            {/* Optional: Display username */}
                            {/* <span className='text-sm font-medium hidden lg:inline'>Hi, {user?.username}</span> */}
                            <Button variant="outline" size="sm" onClick={handleLogout}>
                                <LogOut className="mr-1.5 h-4 w-4" /> Logout
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" passHref>
                                <Button variant="outline" size="sm" className={navLinkClasses('login')}>Login</Button>
                            </Link>
                            <Link href="/signup" passHref>
                                <Button size="sm" className={navLinkClasses('signup')}>Sign Up</Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};