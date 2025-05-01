// src/context/GameAssetsContext.tsx
"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useCallback,
} from "react";
import type {
    GameAssetsState,
} from "@/src/lib/types";
import { fetchAllGameAssets } from "@/src/lib/api/assets";

// Define the initial state for the context
const initialState: GameAssetsState = {
    backgrounds: [],
    sounds: [],
    avatars: [],
    powerups: [],
    isLoading: true,
    error: null,
    preloadedPaths: new Set<string>(),
};

// Create the context
const GameAssetsContext = createContext<GameAssetsState>(initialState);

// Custom hook to use the context
export const useGameAssets = () => {
    const context = useContext(GameAssetsContext);
    if (context === undefined) {
        throw new Error("useGameAssets must be used within a GameAssetsProvider");
    }
    return context;
};

// Create the provider component
interface GameAssetsProviderProps {
    children: ReactNode;
}

export const GameAssetsProvider: React.FC<GameAssetsProviderProps> = ({
    children,
}) => {
    const [state, setState] = useState<GameAssetsState>(initialState);

    // --- Effect 1: Fetch assets on mount ---
    useEffect(() => {
        let isMounted = true;
        const loadAssets = async () => {
            console.log("[GameAssetsProvider] Initializing asset fetch...");
            setState((s) => ({ ...s, isLoading: true, error: null }));
            try {
                const assets = await fetchAllGameAssets();
                if (isMounted) {
                    console.log("[GameAssetsProvider] Assets fetched:", {
                        backgrounds: assets.backgrounds.length,
                        sounds: assets.sounds.length,
                        avatars: assets.avatars.length,
                        powerups: assets.powerups.length,
                    });
                    setState((s) => ({
                        ...s,
                        ...assets,
                        isLoading: false,
                        error: null,
                    }));
                }
            } catch (err: any) {
                console.error("[GameAssetsProvider] Failed to fetch assets:", err);
                if (isMounted) {
                    setState((s) => ({
                        ...s,
                        isLoading: false,
                        error:
                            err.message ||
                            "An unknown error occurred while fetching assets.",
                    }));
                }
            }
        };

        loadAssets();

        return () => {
            isMounted = false;
        };
    }, []);

    // --- Effect 2: Preload resources after assets are loaded ---
    const preloadResource = useCallback((path: string | null | undefined, resourceTypeHint: 'image' | 'audio') => {
        // Added resourceTypeHint
        if (!path || state.preloadedPaths.has(path)) {
            return; // Already preloaded or no path
        }

        // Add to set immediately to prevent duplicate attempts in the same render cycle
        setState(prevState => ({
            ...prevState,
            preloadedPaths: new Set(prevState.preloadedPaths).add(path),
        }));

        console.log(`[GameAssetsProvider] Attempting preload (${resourceTypeHint}): ${path}`);

        // Determine type based on hint primarily, fallback to extension test
        const isLikelyImage = resourceTypeHint === 'image' || /\.(?:png|jpg|jpeg|gif|svg|webp)$/i.test(path);
        const isLikelyAudio = resourceTypeHint === 'audio' || /\.(?:mp3|wav|ogg|webm|aac)$/i.test(path);

        const handleLoadError = (type: string) => {
            console.error(`[GameAssetsProvider] Failed to preload ${type}: ${path}`);
            // Remove from set on error so it might be retried later if needed
            setState(prevState => {
                const newSet = new Set(prevState.preloadedPaths);
                newSet.delete(path);
                return { ...prevState, preloadedPaths: newSet };
            });
        }

        if (isLikelyImage) {
            const img = new Image();
            img.src = path;
            img.onload = () => console.log(`[GameAssetsProvider] Image preloaded: ${path.substring(path.lastIndexOf('/') + 1)}`);
            img.onerror = () => handleLoadError('image');
        } else if (isLikelyAudio) {
            const audio = new Audio();
            audio.src = path;
            audio.preload = 'auto';
            // We can't reliably know when preloading finishes for audio ('canplaythrough' often needs interaction)
            // Just log the attempt. Add error handling.
            audio.onerror = () => handleLoadError('audio');
        } else {
            // Should not happen often with type hints, but log it
            console.warn(`[GameAssetsProvider] Could not determine type for preloading (path: ${path}). Kept in preloaded set.`);
            // We keep it in the set here to avoid spamming this warning if the effect re-runs
        }
    }, [state.preloadedPaths]); // Dependency: only re-create if the set reference changes

    useEffect(() => {
        if (state.isLoading || state.error) {
            return; // Don't run if loading or errored
        }

        console.log("[GameAssetsProvider] Checking resources for preloading...");

        // Pass type hints when calling preloadResource
        state.backgrounds.forEach(item => preloadResource(item.background_file_path, 'image'));
        state.avatars.forEach(item => preloadResource(item.image_file_path, 'image'));
        state.powerups.forEach(item => preloadResource(item.icon_file_path, 'image'));
        state.sounds.forEach(item => preloadResource(item.file_path, 'audio'));

        // Dependencies include the asset arrays and the preloadResource function itself
    }, [state.isLoading, state.error, state.backgrounds, state.sounds, state.avatars, state.powerups, preloadResource]);


    return (
        <GameAssetsContext.Provider value={state}>
            {children}
        </GameAssetsContext.Provider>
    );
};