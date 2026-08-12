import postcss from 'postcss';
import { describe, expect, it } from 'vitest';
import { getPriceVolumeRelationshipArtifactFragment } from './price-volume-relationship-artifact';

describe('getPriceVolumeRelationshipArtifactFragment', () => {
  it.each([
    ['en', 'Price shows where an auction moved. Volume shows how much traded there.'],
    ['zh', '价格显示竞价走到哪里，成交量显示在那里交换了多少'],
    ['ja', '価格はオークションの到達点、出来高はそこで交換された量を示す'],
  ] as const)('extracts the localized %s artifact without standalone chrome', (lang, title) => {
    const artifact = getPriceVolumeRelationshipArtifactFragment(lang, []);
    expect(artifact.body).not.toContain('class="site-header"');
    expect(artifact.body).not.toContain('<main id="article">');
    expect(artifact.body).toContain(`<h1>${title}</h1>`);
    expect(artifact.body).toContain('data-demo="pv-auction-overview"');
    expect(artifact.body).toContain('data-demo="pv-context-checklist"');
  });

  it('keeps all extracted styles inside the visual boundary', () => {
    const artifact = getPriceVolumeRelationshipArtifactFragment('en', []);
    const stylesheet = postcss.parse(artifact.style);
    stylesheet.walkRules((rule) => {
      if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
      for (const selector of rule.selectors) {
        expect(selector.trim()).toMatch(/^(?:\.price-volume-relationship-visual|\.dark \.price-volume-relationship-visual)(?:\b|[\s.:#[>+~])/);
      }
    });
  });

  it('appends effective price-volume theme overrides after the artifact styles', () => {
    const artifact = getPriceVolumeRelationshipArtifactFragment('en', []);
    const stylesheet = postcss.parse(artifact.style);
    const declarationsFor = (selector: string) => {
      const matches: Record<string, string>[] = [];
      stylesheet.walkRules(selector, (rule) => {
        const declarations: Record<string, string> = {};
        rule.walkDecls((declaration) => {
          declarations[declaration.prop] = declaration.value;
        });
        matches.push(declarations);
      });
      return matches.at(-1);
    };

    expect(declarationsFor('.price-volume-relationship-visual')?.background).toContain('#dff3ef');
    expect(declarationsFor('.dark .price-volume-relationship-visual')).toMatchObject({
      '--paper': '#081117',
      '--ink': '#eef9fb',
      background: 'radial-gradient(circle at 20% 0, #12313a 0, transparent 30rem), var(--paper)',
    });
    expect(declarationsFor('.price-volume-relationship-visual .plain-language strong')).toMatchObject({
      color: 'var(--ink)',
      background: 'color-mix(in srgb, var(--warm) 18%, var(--surface))',
      border: '1px solid color-mix(in srgb, var(--warm) 55%, var(--line))',
    });
  });
});