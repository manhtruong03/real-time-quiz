// src/components/auth/ProtectedRoute.tsx
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext'; //

interface ProtectedRouteProps {
    children: React.ReactNode;
    expectedRole?: string; // Optional prop to specify a required role
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, expectedRole }) => {
    const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth(); //
    const router = useRouter();

    useEffect(() => {
        // Only perform checks after authentication state has finished loading
        if (!isAuthLoading) {
            if (!isAuthenticated) {
                // If not authenticated, redirect to login page
                console.log("ProtectedRoute: Not authenticated, redirecting to /login.");
                router.replace('/login');
            } else if (expectedRole && (!user || !user.roles.includes(expectedRole))) {
                // If authenticated but role doesn't match expectedRole, redirect to home or a forbidden page
                console.warn(`ProtectedRoute: User '${user?.username}' (Roles: ${user?.roles.join(', ')}) does not have expected role '${expectedRole}'. Redirecting to /.`);
                router.replace('/'); // Or could be '/access-denied' if you create one
            }
        }
    }, [isAuthenticated, user, isAuthLoading, expectedRole, router]);

    // While authentication/authorization is being checked, show a loading indicator
    if (isAuthLoading || !isAuthenticated || (expectedRole && (!user || !user.roles.includes(expectedRole)))) {
        // If not authenticated, or role doesn't match (and not yet redirected),
        // show a loading or access denied message.
        // The useEffect above will handle the actual redirection.
        return (
            <div className="flex justify-center items-center min-h-screen text-text-primary bg-primary-bg">
                {isAuthLoading ? (
                    <>
                        <i className="fas fa-spinner fa-spin text-4xl mr-3"></i> Đang tải xác thực...
                    </>
                ) : (
                    <>
                        <i className="fas fa-exclamation-circle text-danger-color text-4xl mr-3"></i>
                        Bạn không có quyền truy cập trang này. Đang chuyển hướng...
                    </>
                )}
            </div>
        );
    }

    // If authenticated and authorized (or no role required), render children
    return <>{children}</>;
};