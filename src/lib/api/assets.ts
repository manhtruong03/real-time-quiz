// src/lib/api/assets.ts
import type {
  Background,
  Sound,
  Avatar,
  PowerUp,
} from "@/src/lib/types/assets";

// Không cần ApiResponse nữa khi chỉ dùng mock data

// --- Fetch Backgrounds (Sử dụng Mock Data) ---
export async function fetchBackgrounds(): Promise<Background[]> {
  console.log("[Mock Data] Đang tải mock data cho hình nền.");
  try {
    // Trực tiếp import và trả về mock data
    const mockModule = await import("@/src/__mocks__/api/backgrounds");
    return mockModule.default as Background[];
  } catch (error) {
    console.error("[Mock Data] Lỗi khi tải mock backgrounds:", error);
    return []; // Trả về mảng rỗng nếu mock data thất bại
  }
}

// --- Fetch Sounds (Sử dụng Mock Data) ---
export async function fetchSounds(): Promise<Sound[]> {
  console.log("[Mock Data] Đang tải mock data cho âm thanh.");
  try {
    const mockModule = await import("@/src/__mocks__/api/sounds");
    return mockModule.default as Sound[];
  } catch (error) {
    console.error("[Mock Data] Lỗi khi tải mock sounds:", error);
    return [];
  }
}

// --- Fetch Avatars (Sử dụng Mock Data) ---
export async function fetchAvatars(): Promise<Avatar[]> {
  console.log("[Mock Data] Đang tải mock data cho hình đại diện.");
  try {
    const mockModule = await import("@/src/__mocks__/api/avatars");
    return mockModule.default as Avatar[];
  } catch (error) {
    console.error("[Mock Data] Lỗi khi tải mock avatars:", error);
    return [];
  }
}

// --- Fetch Power-ups (Sử dụng Mock Data) ---
export async function fetchPowerUps(): Promise<PowerUp[]> {
  console.log("[Mock Data] Đang tải mock data cho tăng sức mạnh.");
  try {
    const mockModule = await import("@/src/__mocks__/api/powerups");
    return mockModule.default as PowerUp[];
  } catch (error) {
    console.error("[Mock Data] Lỗi khi tải mock power-ups:", error);
    return [];
  }
}

// --- Function to fetch all assets in parallel (Sử dụng Mock Data) ---
export async function fetchAllGameAssets() {
  console.log("[Mock Data] Đang tải tất cả mock data cho tài sản trò chơi.");
  const results = await Promise.allSettled([
    fetchBackgrounds(),
    fetchSounds(),
    fetchAvatars(),
    fetchPowerUps(),
  ]);

  const [backgroundsResult, soundsResult, avatarsResult, powerUpsResult] =
    results;

  // Log trạng thái để gỡ lỗi
  console.log(
    `[Mock Data] Trạng thái Backgrounds: ${backgroundsResult.status}`
  );
  console.log(`[Mock Data] Trạng thái Sounds: ${soundsResult.status}`);
  console.log(`[Mock Data] Trạng thái Avatars: ${avatarsResult.status}`);
  console.log(`[Mock Data] Trạng thái Power-ups: ${powerUpsResult.status}`);

  return {
    backgrounds:
      backgroundsResult.status === "fulfilled" ? backgroundsResult.value : [],
    sounds: soundsResult.status === "fulfilled" ? soundsResult.value : [],
    avatars: avatarsResult.status === "fulfilled" ? avatarsResult.value : [],
    powerups: powerUpsResult.status === "fulfilled" ? powerUpsResult.value : [],
  };
}
