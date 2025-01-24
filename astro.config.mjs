// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://redreamality.github.io',
  integrations: [
    tailwind({
      // 启用 JIT 模式
      applyBaseStyles: true,
    }),
    mdx(),
    sitemap(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'dracula',
      wrap: true
    },
    remarkPlugins: ['remark-math'],
    rehypePlugins: ['rehype-katex']
  }
});
