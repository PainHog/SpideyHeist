/**
 * Seeded RNG for the Heisty Spideys rules simulator.
 *
 * mulberry32 — small, fast, good enough for Monte Carlo dice. Every run derives
 * its own stream from (seed, stream label, run index) so that parameter variants
 * replay the *same* crews against the same dice where the code paths agree
 * (common random numbers), which keeps variant comparisons low-noise.
 */

/** 32-bit string/number hash (FNV-1a). */
export function hash32(...parts) {
  let h = 0x811c9dc5;
  for (const p of parts) {
    const s = String(p);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    h ^= 0x7c; // separator
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export class Rng {
  constructor(seed = 1) {
    this.state = (Number(seed) >>> 0) || 0x9e3779b9;
  }

  /** Uniform float in [0, 1). */
  next() {
    let t = (this.state = (this.state + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max] inclusive. */
  int(min, max) {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** One d6. */
  d6() {
    return 1 + Math.floor(this.next() * 6);
  }

  /** n d6 faces. */
  dice(n) {
    const out = new Array(Math.max(0, n));
    for (let i = 0; i < out.length; i++) out[i] = this.d6();
    return out;
  }

  chance(p) {
    return this.next() < p;
  }

  pick(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }

  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Pick by weights: `{key: weight}` → key. */
  weighted(weights) {
    const entries = Object.entries(weights).filter(([, w]) => w > 0);
    const total = entries.reduce((a, [, w]) => a + w, 0);
    let r = this.next() * total;
    for (const [k, w] of entries) {
      if ((r -= w) < 0) return k;
    }
    return entries[entries.length - 1][0];
  }

  /** A derived, independent stream. */
  fork(...labels) {
    return new Rng(hash32(this.state, ...labels));
  }
}

export function makeRng(seed, ...labels) {
  return new Rng(hash32(seed, ...labels));
}
