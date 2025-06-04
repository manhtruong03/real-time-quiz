// src/components/auth/ProtectedRoute.tsx
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext'; //

interface ProtectedRouteProps {
    children: React.ReactNode;
    expectedRole?: string; // e.g., "ADMIN", "TEACHER" (without "ROLE_" prefix)
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, expectedRole }) => {
    const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthLoading) {
            if (!isAuthenticated) {
                console.log("ProtectedRoute: Not authenticated, redirecting to /login.");
                router.replace('/login');
            } else if (expectedRole) {
                // Construct the prefixed role to check against user.roles
                const prefixedExpectedRole = `ROLE_${expectedRole.toUpperCase()}`;

                // Check if the user object and roles array exist, and if the prefixed role is included
                if (!user || !user.roles || !user.roles.includes(prefixedExpectedRole)) {
                    console.warn(
                        `ProtectedRoute: User '${user?.username}' (Roles: ${user?.roles?.join(', ')}) 
                        does not have expected role '${expectedRole}' (checked as '${prefixedExpectedRole}'). 
                        Redirecting to /.`,
                    );
                    router.replace('/'); // Or '/access-denied'
                }
            }
        }
    }, [isAuthenticated, user, isAuthLoading, expectedRole, router]);

    // Loading/Access Denied UI
    // Check if still loading, or not authenticated, or (if role expected) user/roles not yet loaded or role doesn't match
    if (isAuthLoading || !isAuthenticated || (expectedRole && (!user || !user.roles || !user.roles.includes(`ROLE_${expectedRole.toUpperCase()}`)))) {
        // This condition ensures we show loading/denied until redirection or authorization is confirmed.
        // The useEffect above handles the actual redirection.
        return (
            <div className="flex justify-center items-center min-h-screen text-text-primary bg-primary-bg">
                {isAuthLoading ? (
                    <>
                        <i className="fas fa-spinner fa-spin text-4xl mr-3"></i> Đang tải xác thực...
                    </>
                ) : !isAuthenticated ? ( // Specifically handle not authenticated before role check for clarity
                    <>
                        <i className="fas fa-exclamation-circle text-danger-color text-4xl mr-3"></i>
                        Bạn không có quyền truy cập trang này. Đang chuyển hướng đến đăng nhập...
                    </>
                ) : ( // User is authenticated, but role check might be pending or failed
                    <>
                        <i className="fas fa-exclamation-circle text-danger-color text-4xl mr-3"></i>
                        Bạn không có quyền truy cập trang này. Đang chuyển hướng...
                    </>
                )}
            </div>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;