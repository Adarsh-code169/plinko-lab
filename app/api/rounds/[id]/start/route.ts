/**
 * POST /api/rounds/[id]/start
 * 
 * Step 2 of the provably fair protocol:
 * - Client sends clientSeed, betCents, dropColumn
 * - Server computes combinedSeed = SHA256(serverSeed + ":" + clientSeed + ":" + nonce)
 * - Runs the deterministic engine to get the result
 * - Returns the result (but NOT the serverSeed yet)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createCombinedSeed } from '@/lib/provably-fair';
import { runEngine } from '@/lib/engine';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { clientSeed, betCents, dropColumn } = body;

    // Validate inputs
    if (!clientSeed || typeof clientSeed !== 'string') {
      return NextResponse.json({ error: 'clientSeed is required' }, { status: 400 });
    }
    if (typeof dropColumn !== 'number' || dropColumn < 0 || dropColumn > 12) {
      return NextResponse.json({ error: 'dropColumn must be 0–12' }, { status: 400 });
    }
    if (typeof betCents !== 'number' || betCents < 1) {
      return NextResponse.json({ error: 'betCents must be positive' }, { status: 400 });
    }

    // Fetch the round
    const round = await prisma.round.findUnique({ where: { id } });
    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }
    if (round.status !== 'CREATED') {
      return NextResponse.json({ error: 'Round already started' }, { status: 400 });
    }

    // Compute combined seed
    const combinedSeed = createCombinedSeed(round.serverSeed, clientSeed, round.nonce);

    // Run deterministic engine
    const result = runEngine(combinedSeed, dropColumn);

    // Update the round in the database
    const updated = await prisma.round.update({
      where: { id },
      data: {
        status: 'STARTED',
        clientSeed,
        combinedSeed,
        betCents,
        dropColumn,
        binIndex: result.binIndex,
        payoutMultiplier: result.payoutMultiplier,
        pegMapHash: result.pegMapHash,
        pathJson: JSON.stringify(result.path),
      },
    });

    // Return result — serverSeed still hidden
    return NextResponse.json({
      roundId: updated.id,
      binIndex: result.binIndex,
      payoutMultiplier: result.payoutMultiplier,
      pegMapHash: result.pegMapHash,
      path: result.path,
      betCents: updated.betCents,
      dropColumn: updated.dropColumn,
    });
  } catch (error) {
    console.error('Error starting round:', error);
    return NextResponse.json(
      { error: 'Failed to start round' },
      { status: 500 }
    );
  }
}
