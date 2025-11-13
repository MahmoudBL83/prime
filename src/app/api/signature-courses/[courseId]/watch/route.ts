import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const demo = request.nextUrl.searchParams.get('demo') === 'true';

    // If not demo, require authenticated session. In demo mode we allow access without enrollment.
    const session = demo ? await getServerSession(authOptions).catch(() => null) : await getServerSession(authOptions);

    if (!demo && !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = params;

    // Get user if available (may be null in demo mode)
    const user = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null;

    // Get course with lessons (episodes). Only include enrollments for the current user if available.
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        creator: {
          select: {
            user: {
              select: {
                name: true,
                profileImage: true,
              },
            },
          },
        },
        lessons: {
          orderBy: {
            order: 'asc',
          },
        },
        enrollments: user
          ? {
              where: {
                userId: user.id,
              },
            }
          : false,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if user is enrolled (unless demo bypass is active)
    if (!demo) {
      if (!course.enrollments || course.enrollments.length === 0) {
        return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
      }
    }

    // Get lesson progress for this user (if available)
    const lessonProgress = user
      ? await prisma.lessonProgress.findMany({
          where: {
            userId: user.id,
            lessonId: {
              in: course.lessons.map(l => l.id),
            },
          },
        })
      : [];

    // If no lessons exist, create mock episodes for demo
    let episodes;
    if (!course.lessons || course.lessons.length === 0) {
      episodes = [
        {
          id: 'demo-episode-1',
          title: 'Introduction and Course Overview',
          description: 'Welcome to this signature course! Learn what you\'ll master and how to get the most out of this learning experience.',
          duration: '12:30',
          videoUrl: '/videos/demo/course-promo.mp4',
          thumbnail: '/images/courses/netflix1.jpg',
          episodeNumber: 1,
          seasonNumber: 1,
          watched: false,
          progress: 0,
        },
        {
          id: 'demo-episode-2',
          title: 'Fundamentals and Core Principles',
          description: 'Deep dive into the foundational concepts that will serve as building blocks for everything else.',
          duration: '18:45',
          videoUrl: '/videos/demo/course-promo.mp4',
          thumbnail: '/images/courses/netflix2.jpg',
          episodeNumber: 2,
          seasonNumber: 1,
          watched: false,
          progress: 0,
        },
        {
          id: 'demo-episode-3',
          title: 'Advanced Techniques',
          description: 'Master advanced techniques used by industry professionals to achieve exceptional results.',
          duration: '22:15',
          videoUrl: '/videos/demo/course-promo.mp4',
          thumbnail: '/images/courses/netflix3.jpg',
          episodeNumber: 3,
          seasonNumber: 1,
          watched: false,
          progress: 0,
        },
        {
          id: 'demo-episode-4',
          title: 'Real-World Applications',
          description: 'Apply what you\'ve learned to real-world scenarios and case studies from actual projects.',
          duration: '25:00',
          videoUrl: '/videos/demo/course-promo.mp4',
          thumbnail: '/images/courses/netflix4.jpg',
          episodeNumber: 4,
          seasonNumber: 1,
          watched: false,
          progress: 0,
        },
        {
          id: 'demo-episode-5',
          title: 'Best Practices and Optimization',
          description: 'Learn the best practices and optimization strategies that separate good from great.',
          duration: '20:30',
          videoUrl: '/videos/demo/course-promo.mp4',
          thumbnail: '/images/courses/netflix5.jpg',
          episodeNumber: 5,
          seasonNumber: 1,
          watched: false,
          progress: 0,
        },
        {
          id: 'demo-episode-6',
          title: 'Final Project and Portfolio',
          description: 'Create your final masterpiece project that showcases all your new skills and belongs in your portfolio.',
          duration: '28:15',
          videoUrl: '/videos/demo/course-promo.mp4',
          thumbnail: '/images/courses/netflix6.jpg',
          episodeNumber: 6,
          seasonNumber: 1,
          watched: false,
          progress: 0,
        },
      ];
    } else {
      // Transform lessons to episodes format
      episodes = course.lessons.map((lesson, index) => {
        const progress = lessonProgress.find(p => p.lessonId === lesson.id);

        // Format duration from minutes to MM:SS or HH:MM:SS
        const formatDuration = (minutes: number) => {
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:00`;
          }
          return `${mins}:00`;
        };

        return {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description || '',
          duration: formatDuration(lesson.duration),
          videoUrl: lesson.videoUrl || '/videos/demo/course-promo.mp4',
          thumbnail: `/images/courses/netflix${(index % 6) + 1}.jpg`,
          episodeNumber: index + 1,
          seasonNumber: 1,
          watched: progress?.completed || false,
          progress: progress?.lastPosition ? Math.round((progress.lastPosition / (lesson.duration * 60)) * 100) : 0,
        };
      });
    }

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        instructor: {
          name: course.creator.user.name,
          profileImage: course.creator.user.profileImage,
        },
        episodes,
      },
    });
  } catch (error) {
    console.error('Error fetching course for watch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}
