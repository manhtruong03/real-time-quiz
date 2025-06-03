// src/lib/types/assets/sound.ts
export type SoundType = "LOBBY" | "QUESTION_TIMER" | "ANSWER_RESULT" | "OTHER";

export interface Sound {
  sound_id: string; // UUID
  name: string;
  description?: string | null;
  sound_type: SoundType;
  file_path: string; // Relative path in /public
  duration: number; // Seconds
  is_active: boolean;
  created_at: string; // ISO Date string
  updated_at: string; // ISO Date string
  deleted_at?: string | null; // ISO Date string or null
}
