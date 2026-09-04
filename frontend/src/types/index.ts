/**
 * Type definitions for Wardrobe.AI (FitCheck AI)
 */

export interface ClothingItem {
  id: number;
  user_id?: string;
  file_path: string;
  category: string;
  sub_category: string;
  color: string;
  material: string;
  vibe: string;
  is_clothing?: boolean;
  is_verified: boolean;
  created_at?: string;
  verified_at?: string | null;
}

export interface ItemVerificationPayload {
  category: string;
  sub_category: string;
  color: string;
  material: string;
  vibe: string;
}

export interface ScanItemResult {
  id: number;
  file_path: string;
  category: string;
  sub_category: string;
  color: string;
  material: string;
  vibe: string;
  is_verified: boolean;
}

export interface BatchScanFileResult {
  filename: string;
  status: 'success' | 'duplicate' | 'rejected' | 'error';
  detail?: string;
  items: ScanItemResult[];
}

export interface QueueItem extends ScanItemResult {
  filename: string;
  status: 'success' | 'duplicate' | 'rejected' | 'error';
  verified: boolean;
}

export interface WardrobeStats {
  total: number;
  top_vibe: string;
  top_category: string;
  top_color: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface User {
  id: string;
  email: string;
  created_at?: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
}
