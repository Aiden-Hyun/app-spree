import { describe, it, expect } from 'vitest';

describe('Notes Utils', () => {
  it('should count words in text', () => {
    const countWords = (text: string) => {
      return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    expect(countWords('Hello world')).toBe(2);
    expect(countWords('This is a test sentence')).toBe(5);
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
  });

  it('should extract tags from content', () => {
    const extractTags = (content: string) => {
      const tagRegex = /#(\w+)/g;
      const matches = content.match(tagRegex);
      return matches ? matches.map(tag => tag.substring(1)) : [];
    };

    expect(extractTags('This is a #note about #work')).toEqual(['note', 'work']);
    expect(extractTags('No tags here')).toEqual([]);
    expect(extractTags('#single #multiple #tags')).toEqual(['single', 'multiple', 'tags']);
  });

  it('should format note preview', () => {
    const formatPreview = (content: string, maxLength: number = 100) => {
      const cleaned = content.replace(/\n/g, ' ').trim();
      return cleaned.length > maxLength 
        ? cleaned.substring(0, maxLength) + '...'
        : cleaned;
    };

    expect(formatPreview('Short note')).toBe('Short note');
    expect(formatPreview('This is a very long note that should be truncated because it exceeds the maximum length allowed for previews')).toBe('This is a very long note that should be truncated because it exceeds the maximum length allowe...');
  });
});
