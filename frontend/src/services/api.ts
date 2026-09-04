import type {
  ClothingItem,
  ItemVerificationPayload,
  ScanItemResult,
  BatchScanFileResult,
  WardrobeStats,
  User,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials
} from '../types';

const BASE_URL = 'http://localhost:8000';
const TOKEN_KEY = 'wardrobe_auth_token';

/**
 * Service to handle all API interactions for Wardrobe.AI with Multi-Tenant JWT.
 */
export const api = {
  /**
   * Token Storage Helpers
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string | null): void {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  /**
   * Helper to format image URLs for the frontend
   */
  getImageUrl(relativePath: string | undefined | null): string {
    if (!relativePath) return '';
    return `${BASE_URL}/${relativePath}`;
  },

  /**
   * Authentication Endpoints
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Registration failed.');
    }
    if (data.access_token) {
      this.setToken(data.access_token);
    }
    return data;
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Login failed.');
    }
    if (data.access_token) {
      this.setToken(data.access_token);
    }
    return data;
  },

  async getMe(): Promise<User> {
    const response = await fetch(`${BASE_URL}/auth/me`, {
      headers: this.getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Session expired.');
    }
    return data;
  },

  logout(): void {
    this.setToken(null);
  },

  /**
   * Scans a single clothing image and extracts its attributes.
   */
  async scanImage(file: File): Promise<{ is_duplicate: boolean; items: ScanItemResult[]; learned_context_applied?: boolean }> {
    const payload = new FormData();
    payload.append('file', file);

    const response = await fetch(`${BASE_URL}/scan`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: payload,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Scanning failed.');
    }
    return data;
  },

  /**
   * Scans multiple clothing images and extracts their attributes in parallel.
   */
  async batchScanImages(files: File[]): Promise<BatchScanFileResult[]> {
    const payload = new FormData();
    for (const file of files) {
      payload.append('files', file);
    }

    const response = await fetch(`${BASE_URL}/batch-scan`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: payload,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Batch scanning failed.');
    }
    return data;
  },

  /**
   * Verifies an item and marks it final in the DB.
   */
  async verifyItem(itemId: number, verifiedData: Partial<ItemVerificationPayload> | Partial<ClothingItem>): Promise<ClothingItem> {
    const response = await fetch(`${BASE_URL}/items/${itemId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(verifiedData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Verification failed.');
    }
    return data.item || data;
  },

  /**
   * Fetches only verified items for the authenticated user's Wardrobe gallery.
   */
  async getWardrobe(): Promise<ClothingItem[]> {
    const response = await fetch(`${BASE_URL}/wardrobe`, {
      headers: this.getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to fetch wardrobe.');
    }
    return data;
  },

  /**
   * Fetches aggregated wardrobe statistics for the authenticated user's dashboard.
   */
  async getWardrobeStats(): Promise<WardrobeStats> {
    const response = await fetch(`${BASE_URL}/wardrobe/stats`, {
      headers: this.getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to fetch statistics.');
    }
    return data;
  },

  /**
   * Deletes an item from the authenticated user's archive.
   */
  async deleteItem(itemId: number): Promise<boolean> {
    const response = await fetch(`${BASE_URL}/items/${itemId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to delete item.');
    }
    return true;
  }
};
