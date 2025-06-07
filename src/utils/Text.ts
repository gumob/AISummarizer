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
