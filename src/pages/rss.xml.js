import rss from '@astrojs/rss';
import { getBlogPosts, getMeditations } from '../utils/i18n';

export async function GET(context) {
  const posts = await getBlogPosts('en');
  const meditations = await getMeditations('en');
  const siteUrl = context.site?.toString() || 'https://redreamality.com';

  const items = [
    ...posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.slug}`,
      author: post.data.author,
      tags: post.data.tags,
      customData: post.data.lang ? `<language>${post.data.lang === 'zh' ? 'zh-CN' : post.data.lang === 'ja' ? 'ja-JP' : 'en-US'}</language>` : undefined,
    })),
    ...meditations.map((m) => ({
      title: m.data.title,
      description: m.data.description,
      pubDate: m.data.date,
      link: `/garden/meditations/${m.slug}`,
      tags: m.data.tags,
      categories: ['meditations'],
    })),
  ].sort((a, b) => new Date(b.pubDate).valueOf() - new Date(a.pubDate).valueOf());

  return rss({
    title: 'Redreamality Blog - Technical Insights',
    description: 'Technical insights, tutorials, and thoughts on software development from Redreamality',
    site: siteUrl,
    items,
    xmlns: {
      atom: 'http://www.w3.org/2005/Atom',
      content: 'http://purl.org/rss/1.0/modules/content/',
    },
    customData: `
      <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
      <managingEditor>redreamality@example.com (Redreamality)</managingEditor>
      <webMaster>redreamality@example.com (Redreamality)</webMaster>
      <copyright>Copyright © ${new Date().getFullYear()} Redreamality</copyright>
      <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    `,
  });
}