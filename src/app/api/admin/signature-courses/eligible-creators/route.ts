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

    // Get all creators with their stats
    const creators = await prisma.user.findMany({
      where: {
        role: 'CREATOR',
      },
      include: {
        courses: {
          where: {
            status: 'PUBLISHED',
          },
          include: {
            enrollments: true,
          },
        },
        signatureCourseInvitation: true,
      },
    });

    // Transform creators with calculated stats
    const eligibleCreators = await Promise.all(
      creators.map(async (creator) => {
        const totalStudents = creator.courses.reduce(
          (sum, course) => sum + course.enrollments.length,
          0
        );

        // Calculate average rating across all courses
        const reviews = await prisma.courseReview.findMany({
          where: {
            course: {
              instructorId: creator.id,
            },
            qualityScore: {
              not: null,
            },
          },
          select: {
            qualityScore: true,
          },
        });

        const avgRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + (r.qualityScore || 0), 0) / reviews.length
            : 0;

        return {
          id: creator.id,
          name: creator.name,
          email: creator.email,
          profileImage: creator.profileImage,
          stats: {
            courses: creator.courses.length,
            students: totalStudents,
            avgRating,
          },
          isInvited: !!creator.signatureCourseInvitation,
        };
      })
    );

    // Sort by performance (courses * students * avgRating)
    eligibleCreators.sort((a, b) => {
      const scoreA = a.stats.courses * a.stats.students * a.stats.avgRating;
      const scoreB = b.stats.courses * b.stats.students * b.stats.avgRating;
      return scoreB - scoreA;
    });

    return NextResponse.json({
      creators: eligibleCreators,
      total: eligibleCreators.length,
    });
  } catch (error) {
    console.error('Error fetching eligible creators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch eligible creators' },
      { status: 500 }
    );
  }
}
