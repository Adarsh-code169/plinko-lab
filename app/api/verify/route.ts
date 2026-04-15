/**
 * GET /api/verify
 * 
 * Public verification endpoint.
 * Takes serverSeed, clientSeed, nonce, dropColumn as query params
 * and re-runs the deterministic engine to prove the result.
 * 
 * Anyone can use this to independently verify a round's outcome.
 */

import { NextResponse } from 'next/server';
import { createCommitHex, createCombinedSeed } from '@/lib/provably-fair';
import { runEngine } from '@/lib/engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serverSeed = searchParams.get('serverSeed');
    const clientSeed = searchParams.get('clientSeed');
    const nonce = searchParams.get('nonce');
    const dropColumnStr = searchParams.get('dropColumn');

    // Validate all inputs
    if (!serverSeed || !clientSeed || !nonce || !dropColumnStr) {
      return NextResponse.json(
        { error: 'Missing required params: serverSeed, clientSeed, nonce, dropColumn' },
        { status: 400 }
      );
    }

    const dropColumn = parseInt(dropColumnStr, 10);
    if (isNaN(dropColumn) || dropColumn < 0 || dropColumn > 12) {
      return NextResponse.json(
        { error: 'dropColumn must be 0–12' },
        { status: 400 }
      );
    }

    // Recompute everything deterministically
    const commitHex = createCommitHex(serverSeed, nonce);
    const combinedSeed = createCombinedSeed(serverSeed, clientSeed, nonce);
    const result = runEngine(combinedSeed, dropColumn);

    return NextResponse.json({
      commitHex,
      combinedSeed,
      pegMapHash: result.pegMapHash,
      binIndex: result.binIndex,
      payoutMultiplier: result.payoutMultiplier,
      path: result.path,
    });
  } catch (error) {
    console.error('Error verifying:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
