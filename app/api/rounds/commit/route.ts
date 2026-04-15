/**
 * POST /api/rounds/commit
 * 
 * Step 1 of the provably fair protocol:
 * - Server generates a random serverSeed and nonce
 * - Computes commitHex = SHA256(serverSeed + ":" + nonce)
 * - Stores the round in the database
 * - Returns { roundId, commitHex, nonce } to the client
 * 
 * The serverSeed is kept SECRET until the reveal phase.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSecureHex, createCommitHex } from '@/lib/provably-fair';

export async function POST() {
  try {
    // Generate cryptographically secure serverSeed (32 bytes = 64 hex chars)
    const serverSeed = generateSecureHex(32);
    
    // Generate a random nonce for this round
    const nonce = String(Math.floor(Math.random() * 1000000));

    // Compute the commitment hash
    const commitHex = createCommitHex(serverSeed, nonce);

    // Store the round in the database (serverSeed is secret)
    const round = await prisma.round.create({
      data: {
        serverSeed,
        nonce,
        commitHex,
        status: 'CREATED',
      },
    });

    // Return only public information — serverSeed is NOT exposed
    return NextResponse.json({
      roundId: round.id,
      commitHex: round.commitHex,
      nonce: round.nonce,
    });
  } catch (error) {
    console.error('Error creating round commit:', error);
    return NextResponse.json(
      { error: 'Failed to create round' },
      { status: 500 }
    );
  }
}
