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
  trailingSlash: 'always',
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
      filter: (page) => {
        // Exclude private pages
        if (page.includes('/private/')) return false;
        
        // Exclude 404 pages
        if (page.includes('/404')) return false;
        
        // Parse URL to get pathname for precise matching
        const url = new URL(page);
        const path = url.pathname;
        
        // Exclude redirect pages - these have noindex meta tags
        // Redirect from /talks/* to /garden/talks/*
        if (path === '/talks/' || path === '/talks') return false;
        if (path.match(/^\/talks\/[^/]+\/?$/)) return false;
        if (path === '/cn/talks/' || path === '/cn/talks') return false;
        if (path.match(/^\/cn\/talks\/[^/]+\/?$/)) return false;
        if (path === '/ja/talks/' || path === '/ja/talks') return false;
        if (path.match(/^\/ja\/talks\/[^/]+\/?$/)) return false;
        
        // Redirect from /garden/blog/* to /blog/*
        if (path.includes('/garden/blog/')) return false;
        
        return true;
      },
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
