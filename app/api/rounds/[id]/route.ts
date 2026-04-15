/**
 * GET /api/rounds/[id]
 * 
 * Returns full round details.
 * Only exposes serverSeed if the round has been REVEALED.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const round = await prisma.round.findUnique({ where: { id } });
    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    // Only expose serverSeed if round has been revealed
    return NextResponse.json({
      roundId: round.id,
      status: round.status,
      nonce: round.nonce,
      commitHex: round.commitHex,
      serverSeed: round.status === 'REVEALED' ? round.serverSeed : undefined,
      clientSeed: round.clientSeed,
      combinedSeed: round.status === 'REVEALED' ? round.combinedSeed : undefined,
      pegMapHash: round.pegMapHash,
      dropColumn: round.dropColumn,
      binIndex: round.binIndex,
      payoutMultiplier: round.payoutMultiplier,
      betCents: round.betCents,
      path: round.pathJson ? JSON.parse(round.pathJson) : undefined,
      createdAt: round.createdAt,
      revealedAt: round.revealedAt,
    });
  } catch (error) {
    console.error('Error fetching round:', error);
    return NextResponse.json(
      { error: 'Failed to fetch round' },
      { status: 500 }
    );
  }
}
