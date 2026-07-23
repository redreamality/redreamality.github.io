import { describe, expect, it } from 'vitest';
import { getLatestVisual } from './visuals';

describe('getLatestVisual', () => {
  it.each([
    ['en', '/visuals/loop-engineering/', 'What Is Loop Engineering?'],
    ['zh', '/cn/visuals/loop-engineering/', '什么是 Loop Engineering？'],
    ['ja', '/ja/visuals/loop-engineering/', 'Loop Engineering とは何か？'],
  ] as const)('returns the newest published %s artifact', (lang, href, title) => {
    expect(getLatestVisual(lang)).toMatchObject({ slug: 'loop-engineering', href, title, hasCurrentArtifact: true });
  });
});
