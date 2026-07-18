import postcss from 'postcss';
import { describe, expect, it } from 'vitest';
import { getTyphoonArtifactFragment } from './typhoon-artifact';

describe('getTyphoonArtifactFragment', () => {
  it('keeps Typhoon styles inside the visual while removing its standalone chrome', () => {
    const artifact = getTyphoonArtifactFragment('en', []);

    const stylesheet = postcss.parse(artifact.style);
    stylesheet.walkRules((rule) => {
      if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
      for (const selector of rule.selectors) {
        expect(selector.trim()).toMatch(/^(?:\.typhoon-visual|\.dark \.typhoon-visual)(?:\b|[\s.:#[>+~])/);
      }
    });
    expect(artifact.style).toContain('.typhoon-visual .hero');
    expect(artifact.style).toContain('.typhoon-visual h1');
    expect(artifact.style).toContain('.dark .typhoon-visual');
    expect(artifact.body).not.toContain('class="site-header"');
    expect(artifact.body).not.toContain('<main id="article">');
    expect(artifact.body).toContain('id="day-slider"');
    expect(artifact.body).toContain('aria-label="Days of sunshine"');
  });
});
