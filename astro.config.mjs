// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: 'https://redreamality.com',
  base: '/',
  trailingSlash: 'ignore',
  output: 'static',
  integrations: [
    tailwind({
      // 启用 JIT 模式
      applyBaseStyles: true,
    }),
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [[rehypeKatex, {
        // KaTeX options
        strict: false,
        macros: {
          "\\bmatrix": "\\begin{bmatrix}#1\\end{bmatrix}",
          "\\pmatrix": "\\begin{pmatrix}#1\\end{pmatrix}",
          "\\vmatrix": "\\begin{vmatrix}#1\\end{vmatrix}",
          "\\Vmatrix": "\\begin{Vmatrix}#1\\end{Vmatrix}",
          "\\matrix": "\\begin{matrix}#1\\end{matrix}"
        }
      }]]
    }),
    sitemap({
      filter: (page) => !page.includes('/private/') && !page.includes('/admin/'),
      changefreq: 'weekly',
      serialize: (item) => ({
        ...item,
        priority: item.url === '/' ? 1.0 : 
                 item.url.includes('/tags/') ? 0.3 :
                 0.8,
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
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'dracula',
      wrap: true
    },
    remarkPlugins: [remarkMath],
    rehypePlugins: [[rehypeKatex, {
      // KaTeX options
      strict: false,
      macros: {
        "\\bmatrix": "\\begin{bmatrix}#1\\end{bmatrix}",
        "\\pmatrix": "\\begin{pmatrix}#1\\end{pmatrix}",
        "\\vmatrix": "\\begin{vmatrix}#1\\end{vmatrix}",
        "\\Vmatrix": "\\begin{Vmatrix}#1\\end{Vmatrix}",
        "\\matrix": "\\begin{matrix}#1\\end{matrix}"
      }
    }]]
  }
});
