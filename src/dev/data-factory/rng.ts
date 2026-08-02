// ─── Seedable RNG ───────────────────────────────────────────────────────────
// A small deterministic PRNG (mulberry32) so a seed run can be reproduced with
// the same rngSeed, plus convenience pickers used by every factory.

export type Rng = {
  /** Next float in [0, 1). */
  next(): number;
  nextInt(min: number, maxInclusive: number): number;
  nextFloat(min: number, max: number): number;
  /** True with probability p (0-1). */
  chance(p: number): boolean;
  pick<T>(arr: readonly T[]): T;
  /** In-place Fisher-Yates shuffle; also returns the array for chaining. */
  shuffle<T>(arr: T[]): T[];
};

export function createRng(seed?: number): Rng {
  let s = (seed ?? Math.floor(Math.random() * 0xffffffff)) >>> 0;

  function next(): number {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nextFloat(min: number, max: number): number {
    return min + next() * (max - min);
  }

  function nextInt(min: number, maxInclusive: number): number {
    return Math.floor(nextFloat(min, maxInclusive + 1));
  }

  function chance(p: number): boolean {
    return next() < p;
  }

  function pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) throw new Error('rng.pick called with an empty array.');
    return arr[nextInt(0, arr.length - 1)];
  }

  function shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = nextInt(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  return { next, nextInt, nextFloat, chance, pick, shuffle };
}
