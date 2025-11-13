import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const proposals = await prisma.signatureCourseProposal.findMany({
      include: {
        course: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    // Transform proposals with creator names
    const transformedProposals = await Promise.all(
      proposals.map(async (proposal) => {
        const creator = await prisma.user.findUnique({
          where: { id: proposal.creatorId },
          select: { name: true, email: true },
        });

        return {
          id: proposal.id,
          creatorId: proposal.creatorId,
          creatorName: creator?.name || 'Unknown',
          courseTitle: proposal.courseTitle,
          description: proposal.description,
          stage: proposal.stage,
          submittedAt: proposal.submittedAt,
          reviewNotes: proposal.reviewNotes,
          reviewedAt: proposal.reviewedAt,
        };
      })
    );

    return NextResponse.json({
      proposals: transformedProposals,
      total: transformedProposals.length,
    });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
      { status: 500 }
    );
  }
}
