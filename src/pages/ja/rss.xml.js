import rss from '@astrojs/rss';
import { getBlogPosts, getMeditations } from '../../utils/i18n';

export async function GET(context) {
  const posts = await getBlogPosts('ja');
  const meditations = await getMeditations('ja');
  const siteUrl = context.site?.toString() || 'https://redreamality.com';

  const items = [
    ...posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/ja/blog/${post.slug}`,
      author: post.data.author,
      tags: post.data.tags,
      customData: `<language>ja-JP</language>`,
    })),
    ...meditations.map((m) => ({
      title: m.data.title,
      description: m.data.description,
      pubDate: m.data.date,
      link: `/ja/garden/meditations/${m.slug}`,
      tags: m.data.tags,
      categories: ['meditations'],
      customData: `<language>ja-JP</language>`,
    })),
  ].sort((a, b) => new Date(b.pubDate).valueOf() - new Date(a.pubDate).valueOf());

  return rss({
    title: 'Redreamality ブログ - 技術の洞察',
    description: 'Redreamalityによる技術的な知見、チュートリアル、ソフトウェア開発の考察',
    site: siteUrl,
    items,
    xmlns: {
      atom: 'http://www.w3.org/2005/Atom',
      content: 'http://purl.org/rss/1.0/modules/content/',
    },
    customData: `
      <atom:link href="${siteUrl}/ja/rss.xml" rel="self" type="application/rss+xml" />
      <managingEditor>redreamality@example.com (Redreamality)</managingEditor>
      <webMaster>redreamality@example.com (Redreamality)</webMaster>
      <copyright>Copyright © ${new Date().getFullYear()} Redreamality</copyright>
      <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    `,
  });
}
