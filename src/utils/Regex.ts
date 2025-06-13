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

export const isInvalidUrl = async (url?: string): Promise<boolean> => {
  if (!url) return true;
  return isAIServiceUrl(url) || isBrowserSpecificUrl(url) || (await isExtractionDenylistUrl(url)) || !url.startsWith('http');
};

export const isAIServiceUrl = (url?: string): boolean => {
  if (!url) return true;
  return /^(https?)\:\/\/(www\.)?((chatgpt|gemini\.google|aistudio\.google|grok|perplexity|deepseek)\.com)|(claude\.ai)/.test(url);
};

export const isBrowserSpecificUrl = (url?: string): boolean => {
  if (!url) return true;
  return /^(chrome|brave|edge|opera|vivaldi)/.test(url);
};

export const isExtractionDenylistUrl = async (url?: string): Promise<boolean> => {
  if (!url) return true;
  const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  const extractionDenylist = settings[STORAGE_KEYS.SETTINGS]?.state?.extractionDenylist ?? DEFAULT_SETTINGS.extractionDenylist;
  /** Split the extraction denylist into an array of patterns */
  const patterns = extractionDenylist
    .split('\n')
    /** Remove empty lines, comments */
    .filter((pattern: string) => {
      const trimmed = pattern.trim();
      return trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.endsWith('*/') && !trimmed.startsWith('#');
    });
  /** Escape the patterns */
  // .map(escapeRegExp);
  /** Check if the URL matches any of the patterns */
  return patterns.some((pattern: string) => new RegExp(pattern).test(url));
};
