/**
 * Deterministic Pseudo-Random Number Generator (PRNG)
 * 
 * Uses Mulberry32 algorithm seeded via cyrb128 hash.
 * Given the same seed string, this always produces the exact same
 * sequence of random numbers — critical for provably fair verification.
 * 
 * PRNG stream order:
 * 1. First, peg map generation (leftBias values for all pegs)
 * 2. Then, row decisions (left/right at each row)
 * This order must be consistent for the verifier to reproduce results.
 */

/**
 * cyrb128 - Hash a string into four 32-bit integers
 * Used to convert a hex seed string into numeric seeds for mulberry32
 */
function cyrb128(str: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

/**
 * Mulberry32 - Fast, high-quality 32-bit PRNG
 * Returns a function that produces floats in [0, 1) on each call
 */
function mulberry32(seed: number): () => number {
  let t = seed;
  return function () {
    t |= 0;
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Create a seeded PRNG from a hex string (the combinedSeed)
 * Returns a function that produces deterministic floats in [0, 1)
 */
export function createPRNG(seedHex: string): () => number {
  const [s0] = cyrb128(seedHex);
  return mulberry32(s0);
}
