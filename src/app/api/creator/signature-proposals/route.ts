import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const proposalSchema = z.object({
  courseTitle: z.string().min(10, 'Title must be at least 10 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  syllabus: z.string().min(100, 'Syllabus must be at least 100 characters'),
  targetAudience: z.string().optional(),
  learningGoals: z.string().optional(),
  duration: z.string().optional(),
  pricing: z.number().optional(),
  cohortSize: z.number().int().min(10).max(500).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const proposals = await prisma.signatureCourseProposal.findMany({
      where: { creatorId: session.user.id },
      orderBy: { submittedAt: 'desc' },
    });

    return NextResponse.json({ proposals });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if creator has accepted invitation
    const invitation = await prisma.signatureCourseInvitation.findUnique({
      where: { creatorId: session.user.id },
    });

    if (!invitation || invitation.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: 'You must accept the signature course invitation first' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = proposalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Create proposal
    const proposal = await prisma.signatureCourseProposal.create({
      data: {
        creatorId: session.user.id,
        courseTitle: data.courseTitle,
        description: data.description,
        syllabus: data.syllabus,
        targetAudience: data.targetAudience,
        learningGoals: data.learningGoals,
        duration: data.duration,
        pricing: data.pricing,
        cohortSize: data.cohortSize || 50,
        stage: 'PROPOSAL',
      },
    });

    // TODO: Notify admin team

    return NextResponse.json({
      proposal,
      message: 'Proposal submitted successfully',
    });
  } catch (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to create proposal' },
      { status: 500 }
    );
  }
}
