/**
 * Utility functions for handling avatar URLs
 */
import config from '../config/config';

/**
 * Convert relative avatar URL to full URL
 * @param {string} avatarUrl - The avatar URL (can be relative or absolute)
 * @returns {string} - Full URL for the avatar
 */
export const getFullAvatarUrl = (avatarUrl) => {
  return config.helpers.getAvatarUrl(avatarUrl);
};

/**
 * Check if avatar URL is valid
 * @param {string} avatarUrl - The avatar URL to check
 * @returns {boolean} - True if URL is valid
 */
export const isValidAvatarUrl = (avatarUrl) => {
  if (!avatarUrl) return false;
  
  // Check if it's a valid URL format
  try {
    const url = getFullAvatarUrl(avatarUrl);
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get avatar placeholder for users without avatar
 * @param {string} name - User's name for initials
 * @returns {string} - Placeholder text
 */
export const getAvatarPlaceholder = (name) => {
  if (!name) return '?';
  
  const words = name.trim().split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  
  return words[0][0].toUpperCase();
};
