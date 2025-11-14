import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { AppealStatus } from '@prisma/client';

// Appeal schema
const appealSchema = z.object({
  strikeId: z.string(),
  appealNotes: z.string().min(100, 'Please provide at least 100 characters explaining your appeal').max(2000),
});

// POST: Submit strike appeal
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = appealSchema.parse(body);

    // Get strike
    const strike = await prisma.contentStrike.findUnique({
      where: { id: validatedData.strikeId },
    });

    if (!strike) {
      return NextResponse.json({ error: 'Strike not found' }, { status: 404 });
    }

    // Verify ownership
    const creator = await prisma.creator.findUnique({
      where: { userId: session.user.id },
    });

    if (!creator || creator.id !== strike.creatorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if already appealed
    if (strike.appealStatus !== null) {
      return NextResponse.json({ 
        error: 'Strike has already been appealed' 
      }, { status: 400 });
    }

    // Update strike with appeal
    const updated = await prisma.contentStrike.update({
      where: { id: validatedData.strikeId },
      data: {
        appealStatus: AppealStatus.PENDING,
        appealNotes: validatedData.appealNotes,
      },
    });

    // TODO: Notify admin team of new appeal
    // await notifyAdminOfAppeal(updated);

    return NextResponse.json({
      success: true,
      message: 'Appeal submitted successfully',
      strike: updated,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.issues 
      }, { status: 400 });
    }

    console.error('Error submitting appeal:', error);
    return NextResponse.json({ 
      error: 'Failed to submit appeal' 
    }, { status: 500 });
  }
}
