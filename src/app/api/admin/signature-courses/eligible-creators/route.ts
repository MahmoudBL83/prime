import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users with CREATOR role
    const users = await prisma.user.findMany({
      where: {
        role: 'CREATOR',
      },
      include: {
        creator: true,
        signatureCourseInvitation: true,
      },
    });

    // Get courses for all creators separately
    const creatorIds = users
      .filter(user => user.creator)
      .map(user => user.creator!.id);

    const courses = await prisma.course.findMany({
      where: {
        creatorId: { in: creatorIds },
        status: 'PUBLISHED',
      },
      include: {
        enrollments: true,
      },
    });

    // Transform creators with calculated stats
    const eligibleCreators = await Promise.all(
      users.map(async (user) => {
        if (!user.creator) return null;

        const userCourses = courses.filter(course => course.creatorId === user.creator!.id);
        const totalStudents = userCourses.reduce(
          (sum: number, course) => sum + course.enrollments.length,
          0
        );

        // Calculate average rating across all courses
        const reviews = await prisma.courseReview.findMany({
          where: {
            course: {
              creatorId: user.creator.id,
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
          id: user.id,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage,
          stats: {
            courses: userCourses.length,
            students: totalStudents,
            avgRating,
          },
          isInvited: !!user.signatureCourseInvitation,
        };
      })
    );

    // Filter out null values and sort by performance
    const validCreators = eligibleCreators.filter(creator => creator !== null);
    validCreators.sort((a, b) => {
      const scoreA = a.stats.courses * a.stats.students * a.stats.avgRating;
      const scoreB = b.stats.courses * b.stats.students * b.stats.avgRating;
      return scoreB - scoreA;
    });

    return NextResponse.json({
      creators: validCreators,
      total: validCreators.length,
    });
  } catch (error) {
    console.error('Error fetching eligible creators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch eligible creators' },
      { status: 500 }
    );
  }
}
