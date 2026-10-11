import { describe, expect, it } from 'vitest';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import remarkCitations from './remark-citations';

async function render(md: string): Promise<string> {
  const p = await createMarkdownProcessor({
    syntaxHighlight: false,
    remarkPlugins: [remarkMath, remarkCitations],
  });
  return (await p.render(md)).code;
}

const refsOl = '\n\n## References\n\n1. Alpha <https://a.example>\n2. Beta\n3. Gamma\n';

describe('remarkCitations', () => {
  it('converts a basic cite and links both ways', async () => {
    const html = await render('A claim.[2] Again [2].' + refsOl);
    expect(html).toContain('<sup class="cite"><a href="#ref-2" id="cite-2-1">[2]</a></sup>');
    expect(html).toContain('id="cite-2-2"');
    expect(html).toMatch(/<li id="ref-2" class="ref-entry">[\s\S]*?href="#cite-2-1"[^>]*>↩<\/a>/);
    expect(html).not.toMatch(/href="#cite-1-1"/);
  });

  it('converts multi-cites and ranges', async () => {
    const html = await render('X [1, 3] and Y [1-2].' + refsOl);
    expect(html).toContain('<sup class="cite">[<a href="#ref-1" id="cite-1-1">1</a>, <a href="#ref-3" id="cite-3-1">3</a>]</sup>');
    expect(html).toContain('[<a href="#ref-1" id="cite-1-2">1</a>–<a href="#ref-2" id="cite-2-1">2</a>]');
  });

  it('leaves citations without a matching reference unchanged', async () => {
    const html = await render('Missing [9] and partial [1, 9].' + refsOl);
    expect(html).toContain('Missing [9] and partial [1, 9].');
    expect(html).not.toContain('class="cite"');
    const none = await render('No list here [1].');
    expect(none).toContain('[1]');
    expect(none).not.toContain('<sup');
  });

  it('never touches code, inline code or math', async () => {
    const html = await render('Use `arr[1]` and $a[1]$.\n\n```\nx = y[1]\n```' + refsOl);
    expect(html).not.toContain('class="cite"');
    expect(html).toContain('arr[1]');
    expect(html).toContain('x = y[1]');
  });

  it('never touches markdown links or reference links', async () => {
    const html = await render('See [1](https://x.example) and [2][r].\n\n[r]: https://r.example' + refsOl);
    expect(html).toContain('<a href="https://x.example">1</a>');
    expect(html).toContain('<a href="https://r.example">2</a>');
    expect(html).not.toContain('class="cite"');
  });

  it('handles `[N] text` reference lines with hard breaks', async () => {
    const html = await render('Claim。[2]\n\n## 参考来源\n\n[1] One  \n[2] Two  \n[3] Three\n');
    expect(html).toContain('<a href="#ref-2" id="cite-2-1">[2]</a>');
    expect(html).toMatch(/<span id="ref-2" class="ref-entry">\[2\] Two <a href="#cite-2-1"/);
    expect(html).toContain('id="ref-3"');
  });
});
