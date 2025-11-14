import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const reviewSchema = z.object({
  proposalId: z.string(),
  action: z.enum(['APPROVE', 'REJECT', 'REQUEST_CHANGES']),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = reviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues },
        { status: 400 }
      );
    }

    const { proposalId, action, notes } = validation.data;

    // Get current proposal
    const proposal = await prisma.signatureCourseProposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Determine next stage based on action and current stage
    let newStage = proposal.stage;

    if (action === 'APPROVE') {
      switch (proposal.stage) {
        case 'PROPOSAL':
          newStage = 'SCRIPT_REVIEW';
          break;
        case 'SCRIPT_REVIEW':
          newStage = 'PRODUCTION_REVIEW';
          break;
        case 'PRODUCTION_REVIEW':
          newStage = 'APPROVED';
          // If there's a linked course, publish it
          if (proposal.courseId) {
            await prisma.course.update({
              where: { id: proposal.courseId },
              data: {
                status: 'PUBLISHED',
                publishedAt: new Date(),
                contentCategory: 'CATEGORY_B',
              },
            });
          }
          break;
        default:
          newStage = 'APPROVED';
      }
    } else if (action === 'REJECT') {
      newStage = 'REJECTED';
      // If there's a linked course, reject it
      if (proposal.courseId) {
        await prisma.course.update({
          where: { id: proposal.courseId },
          data: {
            status: 'REJECTED',
          },
        });
      }
    } else if (action === 'REQUEST_CHANGES') {
      // Stage stays the same, but notes are added
      newStage = proposal.stage;
    }

    // Update proposal
    const updatedProposal = await prisma.signatureCourseProposal.update({
      where: { id: proposalId },
      data: {
        stage: newStage,
        reviewNotes: notes,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    });

    // TODO: Send notification to creator

    return NextResponse.json({
      proposal: updatedProposal,
      message: `Proposal ${action.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error('Error reviewing proposal:', error);
    return NextResponse.json(
      { error: 'Failed to review proposal' },
      { status: 500 }
    );
  }
}
