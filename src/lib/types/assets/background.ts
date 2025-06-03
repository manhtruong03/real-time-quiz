// src/lib/types/assets/background.ts
export interface Background {
  background_id: string; // Maps to theme_id UUID
  name: string;
  description?: string | null;
  background_file_path?: string | null; // Relative path in /public
  background_color?: string | null; // Hex code or CSS gradient
  text_color?: string | null; // Recommended text color
  is_active: boolean;
  created_at: string; // ISO Date string
  updated_at: string; // ISO Date string
  deleted_at?: string | null; // ISO Date string or null
}
