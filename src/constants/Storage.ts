/**
 * Storage key constants for the extension.
 * These constants are used to store and retrieve data from Chrome's storage.
 */
export const STORAGE_KEYS = {
  /**
   * Key for storing settings
   */
  SETTINGS: 'free-ai-summarizer-settings',
} as const;

/**
 * Type for storage keys
 */
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
