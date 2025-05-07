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
import { jwtDecode } from 'jwt-decode'; // Import jwt-decode

const AUTH_TOKEN_KEY = 'authToken';

// Define a type for the decoded token payload (adjust based on your backend's JWT structure)
interface DecodedToken {
    sub: string; // Subject (usually username)
    userId: string; // Custom claim for user ID (adjust name if different)
    email: string; // Custom claim for email
    roles: string[]; // Custom claim for roles
    iat: number; // Issued at (timestamp)
    exp: number; // Expiration time (timestamp)
    // Add other relevant claims your backend includes
}


interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    isLoading: boolean;
}

interface AuthContextValue extends AuthState {
    login: (jwtResponse: JwtResponse) => void;
    logout: () => void;
    getToken: () => string | null; // Add function to get token
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: true,
    });

    // --- Function to validate token and set state ---
    // NOTE: This is currently a basic client-side check (expiry)
    // A real implementation should ideally call a backend /validate endpoint
    const initializeAuthFromToken = useCallback((storedToken: string) => {
        try {
            const decoded = jwtDecode<DecodedToken>(storedToken);
            const currentTime = Date.now() / 1000; // Current time in seconds

            // Check expiry
            if (decoded.exp < currentTime) {
                console.log('[AuthContext] Token expired. Logging out.');
                localStorage.removeItem(AUTH_TOKEN_KEY);
                setAuthState({ isAuthenticated: false, user: null, token: null, isLoading: false });
                return; // Stop initialization
            }

            // Token exists and is not expired (client-side check)
            console.log('[AuthContext] Token found and appears valid (client-side check). Setting auth state.');
            const userData: User = {
                id: decoded.userId, // Make sure 'userId' matches the claim name in your JWT
                username: decoded.sub, // Assuming 'sub' claim is username
                email: decoded.email, // Make sure 'email' matches the claim name
                roles: decoded.roles || [], // Make sure 'roles' matches the claim name
            };

            setAuthState({
                isAuthenticated: true,
                user: userData,
                token: storedToken,
                isLoading: false,
            });

            // TODO (Optional but Recommended): Make an API call here to '/api/auth/validate' or '/api/users/me'
            // using the storedToken to *truly* validate the session with the backend and get fresh user data.
            // If the API call fails (e.g., 401), call logout().

        } catch (error) {
            console.error('[AuthContext] Error decoding token or invalid token:', error);
            localStorage.removeItem(AUTH_TOKEN_KEY); // Remove invalid token
            setAuthState({ isAuthenticated: false, user: null, token: null, isLoading: false });
        }
    }, []); // No dependencies needed here


    // Load token from localStorage on initial mount
    useEffect(() => {
        console.log('[AuthContext] Initializing Auth Provider...');
        setAuthState(prev => ({ ...prev, isLoading: true })); // Ensure loading is true initially
        try {
            const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
            if (storedToken) {
                initializeAuthFromToken(storedToken); // Validate and set state
            } else {
                console.log('[AuthContext] No token found in storage.');
                setAuthState({ isAuthenticated: false, user: null, token: null, isLoading: false }); // Finish loading
            }
        } catch (error) {
            console.error("[AuthContext] Error reading from localStorage:", error);
            setAuthState({ isAuthenticated: false, user: null, token: null, isLoading: false });
        }
    }, [initializeAuthFromToken]); // Add dependency


    const login = useCallback((jwtResponse: JwtResponse) => {
        console.log('[AuthContext] Login executing...');
        const token = jwtResponse.token;

        try {
            localStorage.setItem(AUTH_TOKEN_KEY, token);
            console.log('[AuthContext] Token stored in localStorage.');
            initializeAuthFromToken(token); // Validate and set state immediately after login
        } catch (error) {
            console.error("[AuthContext] Failed to store token in localStorage:", error);
            // Update state to reflect login failure?
            setAuthState({ isAuthenticated: false, user: null, token: null, isLoading: false });
        }
    }, [initializeAuthFromToken]); // Depend on initializer


    const logout = useCallback(() => {
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
            isLoading: false,
        });
        // Consider redirecting here or letting ProtectedRoute handle it
        // window.location.href = '/login'; // Or useRouter if available
    }, []);

    // Function to easily retrieve the current token (needed for API calls)
    const getToken = useCallback(() => {
        return authState.token;
    }, [authState.token]);

    const value = {
        ...authState,
        login,
        logout,
        getToken, // Expose getToken
    };

    // Prevent rendering children until initial loading is complete
    if (authState.isLoading && typeof window !== 'undefined') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Initializing App...</span>
            </div>
        ); // Or a proper loading component
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};