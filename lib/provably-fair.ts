/**
 * Provably Fair Cryptographic Utilities
 * 
 * Implements the commit-reveal protocol:
 * 1. Server generates a random serverSeed and nonce
 * 2. commitHex = SHA256(serverSeed + ":" + nonce) is published before the game
 * 3. Client provides a clientSeed
 * 4. combinedSeed = SHA256(serverSeed + ":" + clientSeed + ":" + nonce)
 * 5. All randomness is derived from combinedSeed using a deterministic PRNG
 * 6. After the game, serverSeed is revealed for verification
 */

import { createHash, randomBytes } from 'crypto';

/**
 * Compute SHA-256 hex digest of a string
 */
export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Generate a cryptographically secure random hex string
 * Used for generating serverSeed
 */
export function generateSecureHex(bytes: number = 32): string {
  return randomBytes(bytes).toString('hex');
}

/**
 * Create the commit hash from serverSeed and nonce
 * commitHex = SHA256(serverSeed + ":" + nonce)
 * 
 * This is published to the client BEFORE the game starts,
 * proving the server committed to its seed beforehand.
 */
export function createCommitHex(serverSeed: string, nonce: string): string {
  return sha256(serverSeed + ':' + nonce);
}

/**
 * Create the combined seed from all inputs
 * combinedSeed = SHA256(serverSeed + ":" + clientSeed + ":" + nonce)
 * 
 * This seed drives all PRNG randomness for the round.
 * Neither the server nor client can predict or manipulate it alone.
 */
export function createCombinedSeed(
  serverSeed: string,
  clientSeed: string,
  nonce: string
): string {
  return sha256(serverSeed + ':' + clientSeed + ':' + nonce);
}
