import { ArticleRecord } from '@/db/Database';
import { SettingsStore } from '@/stores';
import {
  AIService,
  ArticleExtractionResult,
} from '@/types';

/**
 * Normalize text content
 * - Replace multiple newlines with a single newline
 * - Replace lines containing only spaces with a single newline
 * - Replace multiple spaces with a single space
 * - Replace multiple tabs with a single space
 * - Remove trailing newlines and empty lines
 * - Remove leading spaces and tabs from each line
 */
export const normalizeContent = (content: string | null): string | null => {
  if (!content) return null;
  return content
    .replace(/^[ \t]+/gm, '') // Remove leading spaces and tabs from each line
    .replace(/[ \t]{2,}/g, ' ') // Replace multiple spaces/tabs with a single space
    .replace(/^[ \t]+$/gm, '\n') // Replace lines containing only spaces/tabs with a single newline
    .replace(/\n{2,}/g, '\n') // Replace multiple newlines with a single newline
    .replace(/\n+$/, ''); // Remove trailing newlines
};

/**
 * Copy text to clipboard
 * @param textToCopy - The text to copy
 */
export const copyToClipboard = (textToCopy: string) => {
  const textarea = document.createElement('textarea');
  textarea.value = textToCopy;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  /** Execute copy command */
  const success = document.execCommand('copy');
  document.body.removeChild(textarea);

  if (!success) {
    throw new Error('Failed to copy text to clipboard');
  }
};

/**
 * Create a prompt for the AI service
 * @param service - The AI service
 * @param settings - The settings
 * @param article - The article
 * @returns The prompt
 */
export const createPrompt = async (service: AIService, settings: SettingsStore, article: ArticleExtractionResult | ArticleRecord) => {
  if (!article.title || !article.url || !article.content) {
    throw new Error('Article is not valid');
  }
  try {
    const basePrompt = await settings.getPromptFor(service);
    return basePrompt
      .replace('{title}', article.title ?? '')
      .replace('{url}', article.url ?? '')
      .replace('{content}', article.content ?? '');
  } catch (error) {
    throw new Error('Failed to create prompt');
  }
};
