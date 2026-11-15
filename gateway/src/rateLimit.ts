// A fixed-window counter per key, kept in memory. One gateway process holds
// the counts, so run a single instance or put the limit in front of several.

type Window = { start: number; count: number };

export type Verdict = { ok: true } | { ok: false; retryAfterSeconds: number };

export class RateLimiter {
  private windows = new Map<string, Window>();

  constructor(
    private readonly windowMs = 60_000,
    private readonly now: () => number = Date.now,
  ) {}

  hit(key: string, limit: number): Verdict {
    const time = this.now();
    const current = this.windows.get(key);
    if (!current || time - current.start >= this.windowMs) {
      this.windows.set(key, { start: time, count: 1 });
      return { ok: true };
    }
    current.count += 1;
    if (current.count <= limit) return { ok: true };
    const wait = Math.ceil((current.start + this.windowMs - time) / 1000);
    return { ok: false, retryAfterSeconds: Math.max(wait, 1) };
  }

  // Drops expired windows so the map does not grow without end.
  sweep(): void {
    const time = this.now();
    for (const [key, window] of this.windows) {
      if (time - window.start >= this.windowMs) this.windows.delete(key);
    }
  }

  get size(): number {
    return this.windows.size;
  }
}
