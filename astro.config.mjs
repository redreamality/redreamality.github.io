// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';

// https://astro.build/config
export default defineConfig({
  site: 'https://redreamality.github.io',
  base: '/',
  trailingSlash: 'always',
  integrations: [
    tailwind({
      // 启用 JIT 模式
      applyBaseStyles: true,
    }),
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/private/'),
      changefreq: 'weekly',
      lastmod: new Date(),
      serialize: (item) => ({
        ...item,
        priority: item.url === '/' ? 1.0 : 0.8,
      }),
    }),
    robotsTxt({
      policy: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/private', '/admin'],
          crawlDelay: 10,
        },
      ],
      sitemap: true,
      host: 'https://redreamality.github.io',
    }),
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
