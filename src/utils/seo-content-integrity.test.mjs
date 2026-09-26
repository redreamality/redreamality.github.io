import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createMarkdownProcessor, parseFrontmatter } from '@astrojs/markdown-remark';
import { describe, expect, it } from 'vitest';

const families = [
  ['blog', 'claude-agent-sdk-python-'],
  ['blog', 'browser-extension-development'],
  ['blog', 'the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs'],
  ['blog', 'who-starred-my-github-repo-how-to-view'],
  ['blog', 'pythonpathvs-code'],
  ['blog', 'openspec-tutorial-cli-commands-agents-md-examples'],
  ['notes', 'openspec-guide'],
  ['notes', 'bmad-method-guide'],
  ['questions', 'why-warren-buffett-does-not-invest-in-bonds'],
];

function visit(node, callback) {
  callback(node);
  for (const child of node.children ?? []) visit(child, callback);
}

describe('repaired multilingual content stays complete', () => {
  for (const language of ['en', 'cn', 'ja']) {
    for (const [type, slug] of families) {
      it(`${type}-${language}/${slug} has valid metadata, headings and closed code fences`, async () => {
        const filename = resolve(`src/content/${type}-${language}/${slug}.md`);
        const source = await readFile(filename, 'utf8');
        const { frontmatter, content } = parseFrontmatter(source);
        expect(frontmatter.title).toEqual(expect.any(String));
        expect(frontmatter.description).toEqual(expect.any(String));
        expect(frontmatter.pubDate ?? frontmatter.date).toBeInstanceOf(Date);
        if (type === 'blog') expect(frontmatter.author).toEqual(expect.any(String));
        expect(content).not.toMatch(/^options\s*=\s*ClaudeAgent\s*$/m);

        let tree;
        const renderer = await createMarkdownProcessor({
          syntaxHighlight: false,
          remarkPlugins: [() => parsed => { tree = parsed; }],
        });
        await renderer.render(content);
        expect(tree).toBeDefined();
        const lines = content.split(/\r?\n/);
        visit(tree, node => {
          if (node.type === 'heading') expect(node.depth, filename).toBeGreaterThan(1);
          if (node.type !== 'code') return;
          const first = lines[node.position.start.line - 1].trimStart();
          const marker = first.match(/^(`{3,}|~{3,})/)?.[1];
          if (!marker) return;
          const last = lines[node.position.end.line - 1].trim();
          expect(last, `${filename}:${node.position.start.line} must close its code fence`)
            .toMatch(new RegExp(`^${marker[0]}{${marker.length},}$`));
          if (slug === 'claude-agent-sdk-python-') {
            expect(node.value).not.toMatch(/\bimport\s+AsyncClaudeSDKClient\b/);
            expect(node.value).not.toMatch(/@(?:client|sdk)\.hook\(/);
          }
        });
      });
    }
  }
});
