// src/components/auth/ProtectedRoute.tsx
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { Loader2 } from 'lucide-react'; // For loading state

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // If finished loading and user is not authenticated, redirect
        if (!isLoading && !isAuthenticated) {
            console.log("[ProtectedRoute] Not authenticated, redirecting to /login");
            router.replace('/login'); // Use replace to avoid adding login page to history
        }
    }, [isLoading, isAuthenticated, router]);

    // While loading authentication state, show a loading indicator
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Checking authentication...</span>
            </div>
        );
    }

    // If authenticated, render the children (the protected page content)
    // If not authenticated, the useEffect will trigger redirect, so rendering null briefly is okay
    return isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute;