const BASE_URL = 'http://localhost:8000';

/**
 * Service to handle all API interactions for FitCheck AI.
 */
export const api = {
  /**
   * Helper to format image URLs for the frontend
   */
  getImageUrl(relativePath) {
    if (!relativePath) return '';
    return `${BASE_URL}/${relativePath}`;
  },

  /**
   * Scans a clothing image and extracts its attributes.
   * Returns { id, extracted, is_verified }
   */
  async scanImage(file) {
    const payload = new FormData();
    payload.append('file', file);

    const response = await fetch(`${BASE_URL}/scan`, {
      method: 'POST',
      body: payload,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Scanning failed.');
    }
    return data;
  },

  /**
   * Verifies an item and marks it final in the DB.
   * @param {number} itemId - The database ID of the item.
   * @param {Object} verifiedData - The (potentially edited) attributes.
   */
  async verifyItem(itemId, verifiedData) {
    const response = await fetch(`${BASE_URL}/items/${itemId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verifiedData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Verification failed.');
    }
    return data;
  },

  /**
   * Fetches only verified items for the Wardrobe gallery.
   */
  async getWardrobe() {
    const response = await fetch(`${BASE_URL}/wardrobe`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to fetch wardrobe.');
    }
    return data;
  },

  /**
   * Fetches aggregated wardrobe statistics for the dashboard.
   */
  async getWardrobeStats() {
    const response = await fetch(`${BASE_URL}/wardrobe/stats`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to fetch statistics.');
    }
    return data;
  },

  /**
   * Deletes an item from the archive.
   */
  async deleteItem(itemId) {
    const response = await fetch(`${BASE_URL}/items/${itemId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete item.');
    }
    return true;
  }
};
