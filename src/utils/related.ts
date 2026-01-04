export type DateField = 'pubDate' | 'date';

type BaseContent = {
  slug: string;
  data: {
    title?: string;
    description?: string;
    tags?: string[];
    pubDate?: Date;
    date?: Date;
  };
};

function getDateValue(item: BaseContent, dateField: DateField): number {
  const primary = item.data[dateField];
  if (primary instanceof Date) return primary.valueOf();

  const fallback = dateField === 'pubDate' ? item.data.date : item.data.pubDate;
  if (fallback instanceof Date) return fallback.valueOf();

  return 0;
}

export function rankRelatedContent<T extends BaseContent>(
  allItems: readonly T[],
  currentItem: T,
  options: {
    dateField: DateField;
    limit?: number;
  }
): T[] {
  const limit = options.limit ?? 6;
  if (limit <= 0) return [];

  const candidates = allItems.filter((item) => item.slug !== currentItem.slug);
  if (candidates.length === 0) return [];

  const tagCounts = new Map<string, number>();
  for (const item of allItems) {
    for (const tag of item.data.tags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  const currentTags = new Set(currentItem.data.tags ?? []);

  const scored = candidates.map((item) => {
    const tags = item.data.tags ?? [];

    let overlapCount = 0;
    let overlapWeight = 0;
    for (const tag of tags) {
      if (!currentTags.has(tag)) continue;

      overlapCount += 1;
      const count = tagCounts.get(tag) ?? 1;
      overlapWeight += 1 / Math.log2(2 + count);
    }

    const dateValue = getDateValue(item, options.dateField);

    return {
      item,
      overlapCount,
      overlapWeight,
      dateValue
    };
  });

  const relatedByTags = scored
    .filter((s) => s.overlapCount > 0)
    .sort((a, b) => {
      if (b.overlapCount !== a.overlapCount) return b.overlapCount - a.overlapCount;
      if (b.overlapWeight !== a.overlapWeight) return b.overlapWeight - a.overlapWeight;
      return b.dateValue - a.dateValue;
    })
    .slice(0, limit)
    .map((s) => s.item);

  if (relatedByTags.length >= limit) return relatedByTags;

  const alreadyIncluded = new Set(relatedByTags.map((item) => item.slug));
  const remaining = candidates
    .filter((item) => !alreadyIncluded.has(item.slug))
    .sort((a, b) => getDateValue(b, options.dateField) - getDateValue(a, options.dateField))
    .slice(0, limit - relatedByTags.length);

  return [...relatedByTags, ...remaining];
}
