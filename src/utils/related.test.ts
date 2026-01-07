import { describe, it, expect } from 'vitest';
import { rankRelatedContent } from './related';

describe('rankRelatedContent', () => {
  it('should prioritize items with more overlapping tags', () => {
    const current = {
      slug: 'a',
      data: {
        title: 'A',
        tags: ['x', 'y'],
        pubDate: new Date('2024-01-01')
      }
    };

    const all = [
      current,
      {
        slug: 'b',
        data: { title: 'B', tags: ['x'], pubDate: new Date('2024-01-02') }
      },
      {
        slug: 'c',
        data: { title: 'C', tags: ['x', 'y'], pubDate: new Date('2023-12-31') }
      },
      {
        slug: 'd',
        data: { title: 'D', tags: ['z'], pubDate: new Date('2025-01-01') }
      }
    ];

    const ranked = rankRelatedContent(all, current, { dateField: 'pubDate', limit: 3 });

    expect(ranked.map((i) => i.slug)).toEqual(['c', 'b', 'd']);
  });

  it('should fall back to most recent items when no tags overlap', () => {
    const current = {
      slug: 'a',
      data: {
        title: 'A',
        tags: ['x'],
        pubDate: new Date('2024-01-01')
      }
    };

    const all = [
      current,
      {
        slug: 'b',
        data: { title: 'B', tags: ['y'], pubDate: new Date('2024-01-03') }
      },
      {
        slug: 'c',
        data: { title: 'C', tags: ['z'], pubDate: new Date('2024-01-02') }
      }
    ];

    const ranked = rankRelatedContent(all, current, { dateField: 'pubDate', limit: 2 });

    expect(ranked.map((i) => i.slug)).toEqual(['b', 'c']);
  });
});
