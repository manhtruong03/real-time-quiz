// src/lib/types/assets/powerup.ts
export interface PowerUp {
  power_up_id: string; // UUID
  name: string;
  description: string;
  icon_file_path?: string | null; // Relative path in /public
  power_up_type: string; // e.g., 'DOUBLE_POINTS', 'REMOVE_OPTION'
  effect_value_json: any; // JSON object
  achievement_condition?: string | null;
  is_active: boolean;
  created_at: string; // ISO Date string
  updated_at: string; // ISO Date string
  deleted_at?: string | null; // ISO Date string or null
}
