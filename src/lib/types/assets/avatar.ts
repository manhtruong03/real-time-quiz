// src/lib/types/assets/avatar.ts
export interface Avatar {
  avatar_id: string; // UUID
  name: string;
  description?: string | null;
  image_file_path?: string | null; // Relative path in /public
  is_active: boolean;
  created_at: string; // ISO Date string
  updated_at: string; // ISO Date string
  deleted_at?: string | null; // ISO Date string or null
}
