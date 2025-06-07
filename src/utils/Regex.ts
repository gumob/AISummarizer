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
