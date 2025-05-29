/**
 * Storage key constants for the extension manager.
 * These constants are used to store and retrieve data from Chrome's storage.
 */
export const STORAGE_KEYS = {
  /**
   * Key for storing extension data including enabled/disabled state and lock status
   */
  EXTENSIONS: 'ai-summarizer-extensions',
  /**
   * Key for storing tag data including tag definitions and extension-tag associations
   */
  TAGS: 'ai-summarizer-tags',
} as const;

/**
 * Type for storage keys
 */
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
