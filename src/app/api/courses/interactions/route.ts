import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({}, { status: 200 }); // Return empty object for non-authenticated users
    }

    const body = await request.json();
    const { courseIds } = body;

    if (!courseIds || !Array.isArray(courseIds)) {
      return NextResponse.json({ error: 'Invalid courseIds' }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({}, { status: 200 });
    }

    // Batch fetch all course interactions for the user
    const interactions = await prisma.courseInteraction.findMany({
      where: {
        userId: user.id,
        courseId: {
          in: courseIds
        }
      }
    });

    // Transform to a map for easy access
    const interactionMap: Record<string, { liked: boolean; inMyList: boolean }> = {};
    
    interactions.forEach(interaction => {
      interactionMap[interaction.courseId] = {
        liked: interaction.liked || false,
        inMyList: interaction.inMyList || false
      };
    });

    // Ensure all courseIds have entries (defaulting to false)
    courseIds.forEach((courseId: string) => {
      if (!interactionMap[courseId]) {
        interactionMap[courseId] = {
          liked: false,
          inMyList: false
        };
      }
    });

    return NextResponse.json(interactionMap);
  } catch (error) {
    console.error('Error fetching course interactions:', error);
    return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
  }
}
