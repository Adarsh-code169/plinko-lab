/**
 * Plinko Deterministic Game Engine
 * 
 * Implements the core game logic:
 * 1. Generate a peg map with biases using PRNG
 * 2. Simulate ball drop through 12 rows of pegs
 * 3. Each row: ball goes Left or Right based on peg bias + drop column adjustment
 * 4. Final position = number of Right moves = binIndex (0–12)
 * 
 * IMPORTANT: The PRNG stream order is:
 *   - First: all peg map values (row 0 peg 0, row 0 peg 1, ..., row 11 peg 12)
 *   - Then: all row decisions (row 0 decision, row 1 decision, ..., row 11 decision)
 * This ensures reproducibility for the verifier.
 */

import { createPRNG } from './prng';
import { sha256 } from './provably-fair';

export const ROWS = 12;
export const NUM_BINS = ROWS + 1;

/**
 * Symmetric payout multipliers for bins 0–12
 * Higher rewards on edges, lower in center (typical Plinko distribution)
 */
export const PAYOUT_MULTIPLIERS: number[] = [
  16,   // bin 0  (far left)
  9,    // bin 1
  4,    // bin 2
  2,    // bin 3
  1.2,  // bin 4
  0.5,  // bin 5
  0.2,  // bin 6  (center)
  0.5,  // bin 7
  1.2,  // bin 8
  2,    // bin 9
  4,    // bin 10
  9,    // bin 11
  16,   // bin 12 (far right)
];

/**
 * PegMap type: 2D array where pegMap[row][pegIndex] = leftBias ∈ [0.4, 0.6]
 */
export type PegMap = number[][];

/**
 * Represents the path the ball took and the game result
 */
export interface EngineResult {
  pegMap: PegMap;
  pegMapHash: string;
  path: ('L' | 'R')[];
  binIndex: number;
  payoutMultiplier: number;
}

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate peg map with biases
 * 
 * For each row r (0-based), create r+1 pegs
 * Each peg gets a leftBias = 0.5 + (rand() - 0.5) * 0.2, rounded to 6 decimals
 * leftBias ∈ [0.4, 0.6]
 */
function generatePegMap(rand: () => number): PegMap {
  const pegMap: PegMap = [];
  for (let r = 0; r < ROWS; r++) {
    const row: number[] = [];
    for (let p = 0; p <= r; p++) {
      // leftBias = 0.5 + (rand() - 0.5) * 0.2 → range [0.4, 0.6]
      const raw = 0.5 + (rand() - 0.5) * 0.2;
      // Round to 6 decimals for stable JSON hashing
      row.push(Math.round(raw * 1000000) / 1000000);
    }
    pegMap.push(row);
  }
  return pegMap;
}

/**
 * Run the deterministic Plinko engine
 * 
 * @param combinedSeed - The SHA256 combined seed for this round
 * @param dropColumn - Player-chosen drop column (0–12)
 * @returns EngineResult with path, binIndex, pegMap, and payout
 */
export function runEngine(combinedSeed: string, dropColumn: number): EngineResult {
  const rand = createPRNG(combinedSeed);

  // Step 1: Generate peg map (consumes PRNG values first)
  const pegMap = generatePegMap(rand);
  const pegMapHash = sha256(JSON.stringify(pegMap));

  // Step 2: Simulate ball drop
  // pos tracks the number of Right moves (starts at 0)
  let pos = 0;
  const path: ('L' | 'R')[] = [];

  // Drop column adjustment: slight bias based on where ball is dropped
  // adj = (dropColumn - floor(R/2)) * 0.01
  const adj = (dropColumn - Math.floor(ROWS / 2)) * 0.01;

  for (let r = 0; r < ROWS; r++) {
    // Use the peg at index min(pos, r) under current path
    const pegIndex = Math.min(pos, r);
    const leftBias = pegMap[r][pegIndex];

    // Apply drop column adjustment: bias' = clamp(leftBias + adj, 0, 1)
    const bias = clamp(leftBias + adj, 0, 1);

    // Draw random number for this row's decision
    const rnd = rand();

    if (rnd < bias) {
      // Go Left
      path.push('L');
    } else {
      // Go Right, increment position
      path.push('R');
      pos += 1;
    }
  }

  // pos equals the bin index after 12 rows
  const binIndex = pos;
  const payoutMultiplier = PAYOUT_MULTIPLIERS[binIndex];

  return {
    pegMap,
    pegMapHash,
    path,
    binIndex,
    payoutMultiplier,
  };
}
