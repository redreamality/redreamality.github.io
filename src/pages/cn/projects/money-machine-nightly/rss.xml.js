import rss from '@astrojs/rss';
import { SERIES, getSeriesTitle } from '../../../../data/series';
import { getColumnEntries } from '../../../../utils/columns';
import { getSeriesEntryHref, getSeriesIndexHref } from '../../../../utils/series';

// Own feed for 赚钱机器夜报; entries are deliberately absent from the blog feed (/cn/rss.xml).
export async function GET(context) {
  const config = SERIES['money-machine-nightly'];
  const entries = await getColumnEntries(config.slug, 'zh');
  const siteUrl = (context.site?.toString() || 'https://redreamality.com').replace(/\/$/, '');
  const indexHref = getSeriesIndexHref(config.slug, 'zh');

  return rss({
    title: `${getSeriesTitle(config, 'zh')} - Redreamality`,
    description: config.description.zh,
    site: siteUrl,
    items: entries.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.pubDate,
      link: getSeriesEntryHref(config.slug, entry.slug, 'zh'),
      author: entry.data.author,
      categories: [config.slug],
    })),
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: `<language>zh-CN</language>
      <atom:link href="${siteUrl}${indexHref}rss.xml" rel="self" type="application/rss+xml" />`,
  });
}
