import { STORAGE_KEYS } from '@/constants';
import { DEFAULT_SETTINGS } from '@/stores';

/**
 * Escapes special characters in a string for use in a regular expression.
 * @param str The string to escape
 * @returns The escaped string
 */
export const escapeRegExp = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Escapes an array of strings for use in regular expressions.
 * @param strings The array of strings to escape
 * @returns The array of escaped strings
 */
export const escapeRegExpArray = (strings: string[]): string[] => {
  return strings.map(escapeRegExp);
};

export const isBrowserSpecificUrl = (url: string): boolean => {
  return /^(chrome|brave|edge|opera|vivaldi)/.test(url);
};

export const isExtractionDenylistUrl = async (url: string): Promise<boolean> => {
  const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  const extractionDenylist = settings[STORAGE_KEYS.SETTINGS]?.state?.extractionDenylist ?? DEFAULT_SETTINGS.extractionDenylist;
  return extractionDenylist.some((pattern: string) => pattern.trim() && new RegExp(pattern.trim()).test(url));
};
