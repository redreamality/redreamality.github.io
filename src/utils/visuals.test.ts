import { describe, expect, it } from 'vitest';
import { getLatestVisual } from './visuals';

describe('getLatestVisual', () => {
  it.each([
    ['en', '/visuals/typhoon/', 'How Typhoons Form'],
    ['zh', '/cn/visuals/typhoon/', '台风如何形成'],
    ['ja', '/ja/visuals/typhoon/', '台風ができるまで'],
  ] as const)('returns the newest published %s artifact', (lang, href, title) => {
    expect(getLatestVisual(lang)).toMatchObject({ slug: 'typhoon', href, title, hasCurrentArtifact: true });
  });
});
