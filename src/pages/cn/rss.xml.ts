import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog-cn');
  const sortedPosts = posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  return rss({
    title: 'Redreamality 的博客',
    description: '个人博客，分享技术文章和心得见解',
    site: context.site || 'https://redreamality.com',
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      author: post.data.author,
      link: `/cn/blog/${post.slug}/`,
      categories: post.data.tags,
    })),
    customData: `<language>zh-cn</language>`,
  });
}
