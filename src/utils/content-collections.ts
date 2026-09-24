import {
  getCollection as getAstroCollection,
  render,
  type CollectionEntry as AstroEntry,
  type CollectionKey,
} from 'astro:content';

export type CollectionEntry<C extends CollectionKey> = AstroEntry<C> & {
  slug: string;
  render: () => ReturnType<typeof render>;
};

// Keep the site's public slug/render contract separate from Astro's storage API.
// The glob loader generates the same slugs used by the published legacy routes.
export async function getCollection<C extends CollectionKey>(
  collection: C,
): Promise<CollectionEntry<C>[]> {
  const entries = await getAstroCollection(collection);
  return entries.map(entry => ({
    ...entry,
    slug: entry.id,
    render: () => render(entry),
  }));
}
