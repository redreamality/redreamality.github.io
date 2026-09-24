import postcss from 'postcss';
import { describe, expect, it } from 'vitest';
import { getButterflyEffectArtifactFragment } from './butterfly-effect-artifact';

describe('getButterflyEffectArtifactFragment', () => {
  it('keeps butterfly-effect styles scoped and removes standalone site chrome', () => {
    const artifact = getButterflyEffectArtifactFragment('en', []);

    const stylesheet = postcss.parse(artifact.style);
    stylesheet.walkRules((rule) => {
      if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
      for (const selector of rule.selectors) {
        expect(selector.trim()).toMatch(/^(?:\.butterfly-effect-visual|\.dark \.butterfly-effect-visual)(?:\b|[\s.:#[>+~])/);
      }
    });
    expect(artifact.body).not.toContain('class="site-header"');
    expect(artifact.body).not.toContain('<main id="article">');
    expect(artifact.body).toContain('Can a butterfly');
    expect(artifact.body).toContain('data-demo="bf-overview"');
    expect(artifact.body).toContain('data-demo="bf-noise"');
    expect(artifact.body).toContain('Deterministic rules can still deny you a long, detailed forecast');
  });
});
