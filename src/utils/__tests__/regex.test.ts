import {
  escapeRegExp,
  escapeRegExpArray,
} from '@/utils';

describe('regex utils', () => {
  describe('escapeRegExp', () => {
    it('should escape special characters', () => {
      expect(escapeRegExp('.*+?^${}()|[]\\')).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
    });

    it('should not escape normal characters', () => {
      expect(escapeRegExp('abc123')).toBe('abc123');
    });
  });

  describe('escapeRegExpArray', () => {
    it('should escape all strings in array', () => {
      const input = ['abc', '.*+', '123'];
      const expected = ['abc', '\\.\\*\\+', '123'];
      expect(escapeRegExpArray(input)).toEqual(expected);
    });

    it('should handle empty array', () => {
      expect(escapeRegExpArray([])).toEqual([]);
    });
  });
});
