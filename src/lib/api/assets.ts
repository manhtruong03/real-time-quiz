// src/lib/api/assets.ts
import type {
  Background,
  Sound,
  Avatar,
  PowerUp,
} from "@/src/lib/types/assets";

// Define expected API response types (adjust if backend sends different structure)
type ApiResponse<T> = T[];

// --- Fetch Backgrounds ---
export async function fetchBackgrounds(): Promise<Background[]> {
  const endpoint = "/api/backgrounds"; // Relative endpoint
  console.log(`[API Fetch] Attempting to fetch backgrounds from ${endpoint}`);
  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      console.warn(
        `[API Fetch] Backgrounds fetch failed with status: ${response.status}`
      );
      throw new Error(`Failed to fetch backgrounds: ${response.statusText}`);
    }

    const data: ApiResponse<Background> = await response.json();

    // Check if data is a non-empty array
    if (!Array.isArray(data) || data.length === 0) {
      console.warn(
        `[API Fetch] Backgrounds response was empty or invalid. Falling back to mock.`
      );
      throw new Error("Empty or invalid response");
    }

    console.log(`[API Fetch] Successfully fetched ${data.length} backgrounds.`);
    return data;
  } catch (error) {
    console.error(
      "[API Fetch] Error fetching backgrounds, using mock data:",
      error
    );
    try {
      const mockModule = await import("@/src/__mocks__/api/backgrounds");
      // Ensure mock data structure matches the Type
      return mockModule.default as Background[];
    } catch (mockError) {
      console.error("[API Fetch] Failed to load mock backgrounds:", mockError);
      return []; // Return empty array if mock fails too
    }
  }
}

// --- Fetch Sounds ---
export async function fetchSounds(): Promise<Sound[]> {
  const endpoint = "/api/sounds";
  console.log(`[API Fetch] Attempting to fetch sounds from ${endpoint}`);
  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      console.warn(
        `[API Fetch] Sounds fetch failed with status: ${response.status}`
      );
      throw new Error(`Failed to fetch sounds: ${response.statusText}`);
    }

    const data: ApiResponse<Sound> = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      console.warn(
        `[API Fetch] Sounds response was empty or invalid. Falling back to mock.`
      );
      throw new Error("Empty or invalid response");
    }

    console.log(`[API Fetch] Successfully fetched ${data.length} sounds.`);
    return data;
  } catch (error) {
    console.error("[API Fetch] Error fetching sounds, using mock data:", error);
    try {
      const mockModule = await import("@/src/__mocks__/api/sounds");
      return mockModule.default as Sound[];
    } catch (mockError) {
      console.error("[API Fetch] Failed to load mock sounds:", mockError);
      return [];
    }
  }
}

// --- Fetch Avatars ---
export async function fetchAvatars(): Promise<Avatar[]> {
  const endpoint = "/api/avatars";
  console.log(`[API Fetch] Attempting to fetch avatars from ${endpoint}`);
  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      console.warn(
        `[API Fetch] Avatars fetch failed with status: ${response.status}`
      );
      throw new Error(`Failed to fetch avatars: ${response.statusText}`);
    }

    const data: ApiResponse<Avatar> = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      console.warn(
        `[API Fetch] Avatars response was empty or invalid. Falling back to mock.`
      );
      throw new Error("Empty or invalid response");
    }

    console.log(`[API Fetch] Successfully fetched ${data.length} avatars.`);
    return data;
  } catch (error) {
    console.error(
      "[API Fetch] Error fetching avatars, using mock data:",
      error
    );
    try {
      const mockModule = await import("@/src/__mocks__/api/avatars");
      return mockModule.default as Avatar[];
    } catch (mockError) {
      console.error("[API Fetch] Failed to load mock avatars:", mockError);
      return [];
    }
  }
}

// --- Fetch Power-ups ---
export async function fetchPowerUps(): Promise<PowerUp[]> {
  const endpoint = "/api/power-ups";
  console.log(`[API Fetch] Attempting to fetch power-ups from ${endpoint}`);
  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      console.warn(
        `[API Fetch] Power-ups fetch failed with status: ${response.status}`
      );
      throw new Error(`Failed to fetch power-ups: ${response.statusText}`);
    }

    const data: ApiResponse<PowerUp> = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      console.warn(
        `[API Fetch] Power-ups response was empty or invalid. Falling back to mock.`
      );
      throw new Error("Empty or invalid response");
    }

    console.log(`[API Fetch] Successfully fetched ${data.length} power-ups.`);
    return data;
  } catch (error) {
    console.error(
      "[API Fetch] Error fetching power-ups, using mock data:",
      error
    );
    try {
      const mockModule = await import("@/src/__mocks__/api/powerups");
      return mockModule.default as PowerUp[];
    } catch (mockError) {
      console.error("[API Fetch] Failed to load mock power-ups:", mockError);
      return [];
    }
  }
}

// --- Function to fetch all assets in parallel ---
export async function fetchAllGameAssets() {
  console.log("[API Fetch] Fetching all game assets in parallel...");
  const results = await Promise.allSettled([
    fetchBackgrounds(),
    fetchSounds(),
    fetchAvatars(),
    fetchPowerUps(),
  ]);

  const [backgroundsResult, soundsResult, avatarsResult, powerUpsResult] =
    results;

  // Log status for debugging
  console.log(`[API Fetch] Backgrounds Status: ${backgroundsResult.status}`);
  console.log(`[API Fetch] Sounds Status: ${soundsResult.status}`);
  console.log(`[API Fetch] Avatars Status: ${avatarsResult.status}`);
  console.log(`[API Fetch] Power-ups Status: ${powerUpsResult.status}`);

  return {
    backgrounds:
      backgroundsResult.status === "fulfilled" ? backgroundsResult.value : [],
    sounds: soundsResult.status === "fulfilled" ? soundsResult.value : [],
    avatars: avatarsResult.status === "fulfilled" ? avatarsResult.value : [],
    powerups: powerUpsResult.status === "fulfilled" ? powerUpsResult.value : [],
  };
}
