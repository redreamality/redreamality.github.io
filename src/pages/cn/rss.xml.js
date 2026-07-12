import rss from '@astrojs/rss';
import { getBlogPosts, getMeditations } from '../../utils/i18n';

export async function GET(context) {
  const posts = await getBlogPosts('zh');
  const meditations = await getMeditations('zh');
  const siteUrl = context.site?.toString() || 'https://redreamality.com';

  const items = [
    ...posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/cn/blog/${post.slug}`,
      author: post.data.author,
      tags: post.data.tags,
      customData: `<language>zh-CN</language>`,
    })),
    ...meditations.map((m) => ({
      title: m.data.title,
      description: m.data.description,
      pubDate: m.data.date,
      link: `/cn/garden/meditations/${m.slug}`,
      tags: m.data.tags,
      categories: ['meditations'],
      customData: `<language>zh-CN</language>`,
    })),
  ].sort((a, b) => new Date(b.pubDate).valueOf() - new Date(a.pubDate).valueOf());

  return rss({
    title: 'Redreamality 博客 - 技术见解',
    description: '来自Redreamality的技术见解、教程和软件开发思考',
    site: siteUrl,
    items,
    xmlns: {
      atom: 'http://www.w3.org/2005/Atom',
      content: 'http://purl.org/rss/1.0/modules/content/',
    },
    customData: `
      <atom:link href="${siteUrl}/cn/rss.xml" rel="self" type="application/rss+xml" />
      <managingEditor>redreamality@example.com (Redreamality)</managingEditor>
      <webMaster>redreamality@example.com (Redreamality)</webMaster>
      <copyright>Copyright © ${new Date().getFullYear()} Redreamality</copyright>
      <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    `,
  });
}