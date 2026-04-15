/**
 * POST /api/rounds/[id]/reveal
 * 
 * Step 3 of the provably fair protocol:
 * - Reveals the serverSeed so the client can verify the result
 * - Sets the round status to REVEALED
 * - Returns the full round data including serverSeed
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const round = await prisma.round.findUnique({ where: { id } });
    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }
    if (round.status === 'CREATED') {
      return NextResponse.json({ error: 'Round has not been started yet' }, { status: 400 });
    }

    // Update status to REVEALED and record timestamp
    const updated = await prisma.round.update({
      where: { id },
      data: {
        status: 'REVEALED',
        revealedAt: new Date(),
      },
    });

    // Now expose the serverSeed for client-side verification
    return NextResponse.json({
      roundId: updated.id,
      serverSeed: updated.serverSeed,
      clientSeed: updated.clientSeed,
      nonce: updated.nonce,
      commitHex: updated.commitHex,
      combinedSeed: updated.combinedSeed,
      pegMapHash: updated.pegMapHash,
      dropColumn: updated.dropColumn,
      binIndex: updated.binIndex,
      payoutMultiplier: updated.payoutMultiplier,
      betCents: updated.betCents,
      path: updated.pathJson ? JSON.parse(updated.pathJson) : [],
      status: updated.status,
      revealedAt: updated.revealedAt,
    });
  } catch (error) {
    console.error('Error revealing round:', error);
    return NextResponse.json(
      { error: 'Failed to reveal round' },
      { status: 500 }
    );
  }
}
