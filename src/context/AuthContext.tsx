// src/context/AuthContext.tsx
"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from 'react';
import { Loader2 } from 'lucide-react';
import type { User, JwtResponse } from '@/src/lib/types/auth';
import { jwtDecode } from 'jwt-decode';

const AUTH_TOKEN_KEY = 'authToken';

interface DecodedToken {
    sub: string; // Subject (usually username)
    userId: string; // Custom claim for user ID (adjust name if different)
    email: string; // Custom claim for email
    roles: string[]; // Custom claim for roles
    iat: number; // Issued at (timestamp)
    exp: number; // Expiration time (timestamp)
}


interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    isLoading: boolean; // Keep isLoading state
}

interface AuthContextValue extends AuthState {
    login: (jwtResponse: JwtResponse) => void;
    logout: () => void;
    getToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: true, // Start as loading
    });

    const initializeAuthFromToken = useCallback((storedToken: string) => {
        // ... (validation logic remains the same)
        try {
            const decoded = jwtDecode<DecodedToken>(storedToken);
            const currentTime = Date.now() / 1000;

            if (decoded.exp < currentTime) {
                console.log('[AuthContext] Token expired. Logging out.');
                localStorage.removeItem(AUTH_TOKEN_KEY);
                setAuthState({ isAuthenticated: false, user: null, token: null, isLoading: false });
                return;
            }

            console.log('[AuthContext] Token found and appears valid (client-side check). Setting auth state.');
            const userData: User = {
                id: decoded.userId,
                username: decoded.sub,
                email: decoded.email,
                roles: decoded.roles || [],
            };
            setAuthState({
                isAuthenticated: true,
                user: userData,
                token: storedToken,
                isLoading: false, // Finish loading
            });
        } catch (error) {
            console.error('[AuthContext] Error decoding token or invalid token:', error);
            localStorage.removeItem(AUTH_TOKEN_KEY);
            setAuthState({ isAuthenticated: false, user: null, token: null, isLoading: false }); // Finish loading
        }
    }, []);


    useEffect(() => {
        console.log('[AuthContext] Initializing Auth Provider...');
        // No need to set isLoading: true here again, default state handles it.
        try {
            const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
            if (storedToken) {
                initializeAuthFromToken(storedToken);
            } else {
                console.log('[AuthContext] No token found in storage.');
                setAuthState(prev => ({ ...prev, isLoading: false })); // Finish loading if no token
            }
        } catch (error) {
            console.error("[AuthContext] Error reading from localStorage:", error);
            setAuthState(prev => ({ ...prev, isLoading: false })); // Finish loading on error
        }
    }, [initializeAuthFromToken]);

    const login = useCallback((jwtResponse: JwtResponse) => {
        // ... (login logic remains the same)
        console.log('[AuthContext] Login executing...');
        const token = jwtResponse.token;
        try {
            localStorage.setItem(AUTH_TOKEN_KEY, token);
            console.log('[AuthContext] Token stored in localStorage.');
            initializeAuthFromToken(token); // Validate and set state immediately
        } catch (error) {
            console.error("[AuthContext] Failed to store token in localStorage:", error);
            setAuthState({ isAuthenticated: false, user: null, token: null, isLoading: false });
        }
    }, [initializeAuthFromToken]);


    const logout = useCallback(() => {
        // ... (logout logic remains the same)
        console.log('[AuthContext] Logout executing...');
        try {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            console.log('[AuthContext] Token removed from localStorage.');
        } catch (error) {
            console.error("[AuthContext] Failed to remove token from localStorage:", error);
        }
        setAuthState({
            isAuthenticated: false,
            user: null,
            token: null,
            isLoading: false, // Finish loading on logout
        });
    }, []);

    const getToken = useCallback(() => {
        return authState.token;
    }, [authState.token]);

    const value = {
        ...authState,
        login,
        logout,
        getToken,
    };

    // --- REMOVED CONDITIONAL LOADING RETURN ---
    // Always render the provider and let consumers handle loading state
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
    // --- END REMOVAL ---
};

export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};