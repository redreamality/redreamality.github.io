/**
 * Homepage "From the archive" rotation.
 *
 * Static site: the selection is decided at build time from the build date
 * (Asia/Shanghai calendar day), so every deploy on a new day surfaces a
 * different window of older posts. Windows advance by `count` per day, so
 * consecutive days walk through the whole archive with no repeats until
 * it wraps. Deterministic for a given day (stable across en/cn/ja builds).
 */
export function archiveDayNumber(now: Date = new Date()): number {
  // Shift to UTC+8 and count whole days since epoch.
  return Math.floor((now.getTime() + 8 * 3600 * 1000) / 86_400_000);
}

export function pickArchiveWindow<T>(
  postsNewestFirst: readonly T[],
  options: { skipRecent: number; count: number; day: number },
): T[] {
  const pool = postsNewestFirst.slice(options.skipRecent);
  const n = pool.length;
  if (n === 0 || options.count <= 0) return [];
  const count = Math.min(options.count, n);
  const start = (((options.day * count) % n) + n) % n;
  const out: T[] = [];
  for (let i = 0; i < count; i++) out.push(pool[(start + i) % n]);
  return out;
}
