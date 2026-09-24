import postcss from 'postcss';
import { describe, expect, it } from 'vitest';
import { getR0HerdImmunityArtifactFragment } from './r0-herd-immunity-artifact';

describe('getR0HerdImmunityArtifactFragment', () => {
  it('keeps r0-herd-immunity styles scoped and removes standalone site chrome', () => {
    const artifact = getR0HerdImmunityArtifactFragment('en', []);

    const stylesheet = postcss.parse(artifact.style);
    stylesheet.walkRules((rule) => {
      if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
      for (const selector of rule.selectors) {
        expect(selector.trim()).toMatch(/^(?:\.r0-herd-immunity-visual|\.dark \.r0-herd-immunity-visual)(?:\b|[\s.:#[>+~])/);
      }
    });
    expect(artifact.body).not.toContain('class="site-header"');
    expect(artifact.body).not.toContain('<main id="article">');
    expect(artifact.body).toContain('fierce virus');
    expect(artifact.body).toContain('data-demo="r0-overview"');
    expect(artifact.body).toContain('data-demo="r0-threshold"');
    expect(artifact.body).toContain('1−1/R');
  });
});
