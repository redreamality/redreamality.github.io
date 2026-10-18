import { describe, expect, it } from 'vitest';
import { archiveDayNumber, pickArchiveWindow } from './home-archive';

const posts = Array.from({ length: 20 }, (_, i) => i); // 0 = newest

describe('pickArchiveWindow', () => {
  it('never includes the recent posts already on the homepage', () => {
    for (let day = 0; day < 30; day++) {
      const picked = pickArchiveWindow(posts, { skipRecent: 12, count: 6, day });
      expect(picked).toHaveLength(6);
      expect(picked.every((p) => p >= 12)).toBe(true);
      expect(new Set(picked).size).toBe(6);
    }
  });

  it('is deterministic per day and rotates across days', () => {
    const a = pickArchiveWindow(posts, { skipRecent: 2, count: 6, day: 100 });
    expect(pickArchiveWindow(posts, { skipRecent: 2, count: 6, day: 100 })).toEqual(a);
    expect(pickArchiveWindow(posts, { skipRecent: 2, count: 6, day: 101 })).not.toEqual(a);
  });

  it('covers the whole pool over consecutive days', () => {
    const seen = new Set<number>();
    for (let day = 0; day < 3; day++) {
      pickArchiveWindow(posts, { skipRecent: 2, count: 6, day }).forEach((p) => seen.add(p));
    }
    expect(seen.size).toBe(18);
  });

  it('handles small pools', () => {
    expect(pickArchiveWindow(posts, { skipRecent: 20, count: 6, day: 1 })).toEqual([]);
    expect(pickArchiveWindow(posts, { skipRecent: 18, count: 6, day: 1 })).toHaveLength(2);
  });

  it('uses the Asia/Shanghai calendar day', () => {
    expect(archiveDayNumber(new Date('2026-10-18T15:59:00Z'))).toBe(
      archiveDayNumber(new Date('2026-10-18T00:00:00+08:00')),
    );
    expect(archiveDayNumber(new Date('2026-10-18T16:00:00Z'))).toBe(
      archiveDayNumber(new Date('2026-10-18T15:59:00Z')) + 1,
    );
  });
});
