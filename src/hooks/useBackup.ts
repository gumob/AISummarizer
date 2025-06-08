import { logger } from '@/utils';

/**
 * Interface for the backup file structure
 */
interface BackupData {
  version: string;
  tags: {
    id: string;
    name: string;
    order: number;
    createdAt: string;
    updatedAt: string;
  }[];
  extensionTags: {
    extensionId: string;
    tagIds: string[];
  }[];
  extensions: {
    id: string;
    enabled: boolean;
    locked: boolean;
  }[];
}

/**
 * Custom hook for backup management.
 * This hook provides functionality to export and import extension profiles including:
 * - Extension states (enabled/disabled)
 * - Extension locks
 * - Tags and tag assignments
 *
 * @returns Object containing exportFile and importFile functions
 */
export const useBackup = () => {
  /**
   * Converts a date to ISO format
   * @param date - The date to convert
   * @returns The date in ISO format
   */
  const convertToISOString = (date: Date): string => {
    try {
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return new Date().toISOString();
      }
      return date.toISOString();
    } catch (error) {
      logger.error('🫳💾', '[useBackup.ts]', '[convertToISOString]', 'Failed to convert date to ISO string', error);
      return new Date().toISOString();
    }
  };

  /**
   * Get the current version from manifest.json
   * @returns The current version
   */
  const getBackupVersion = (): string => {
    try {
      return chrome.runtime.getManifest().version;
    } catch (error) {
      logger.error('🫳💾', '[useBackup.ts]', '[getBackupVersion]', 'Failed to get backup version', error);
      return '0.0.1'; // Fallback version
    }
  };

  /**
   * Validates the backup data structure
   * @param data - The backup data to validate
   * @returns Whether the data is valid
   */
  const validateBackupData = (data: any): data is BackupData => {
    if (!data || typeof data !== 'object') return false;
    if (!data.version || typeof data.version !== 'string') return false;
    if (!Array.isArray(data.tags)) return false;
    if (!Array.isArray(data.extensionTags)) return false;
    if (!Array.isArray(data.extensions)) return false;

    /** Validate tags */
    for (const tag of data.tags) {
      if (!tag.id || !tag.name || typeof tag.order !== 'number') return false;
      if (!tag.createdAt || !tag.updatedAt) return false;
    }

    /** Validate extension tags */
    for (const extTag of data.extensionTags) {
      if (!extTag.extensionId || !Array.isArray(extTag.tagIds)) return false;
    }

    /** Validate extensions */
    for (const ext of data.extensions) {
      if (!ext.id || typeof ext.enabled !== 'boolean' || typeof ext.locked !== 'boolean') return false;
    }

    return true;
  };

  /**
   * The function that exports the current profile configuration to a JSON file.
   *
   * Step-by-step process:
   * 1. Retrieves current tag data using exportTags()
   * 2. Gets current extension states from the store
   * 3. Creates a profiles object combining all data
   * 4. Converts to JSON with proper formatting
   * 5. Creates a downloadable file with timestamp
   * 6. Triggers browser download
   */
  const exportFile = async () => {};

  /**
   * The function that imports a profile configuration from a JSON file.
   *
   * Step-by-step process:
   * 1. Creates FileReader to read the JSON file
   * 2. Sets up onload handler to process file contents
   * 3. Imports tags and extension states
   * 4. Refreshes extension list to show changes
   *
   * @param file - The JSON file containing profile configuration
   */
  const importFile = async (file: File) => {};

  return {
    exportFile,
    importFile,
  };
};
