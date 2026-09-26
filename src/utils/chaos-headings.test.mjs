import { readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createMarkdownProcessor, parseFrontmatter } from '@astrojs/markdown-remark';
import { describe, it, expect } from 'vitest';

const paths = ['en', 'cn', 'ja'].flatMap(language => {
  const directory = resolve(`src/content/chaos-${language}`);
  return readdirSync(directory).filter(file => /\.mdx?$/.test(file)).map(file => resolve(directory, file));
});

describe('Chaos entries use their template title as the only H1', () => {
  for (const path of paths) {
    it(path, async () => {
      const { content, frontmatter } = parseFrontmatter(await readFile(path, 'utf8'));
      expect(frontmatter.title).toBeTruthy();
      let headings = [];
      const processor = await createMarkdownProcessor({
        syntaxHighlight: false,
        remarkPlugins: [() => tree => {
          const visit = node => {
            if (node.type === 'heading') headings.push(node);
            for (const child of node.children ?? []) visit(child);
          };
          visit(tree);
        }],
      });
      await processor.render(content);
      expect(headings.filter(heading => heading.depth === 1)).toEqual([]);
    });
  }
});
