import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testWatchAPI() {
  const courseId = 'cmgwg5yay0007uq7okm20t9vq';
  const userEmail = 'admin@prime.eg';
  
  console.log('Testing watch API logic...\n');
  
  // Get user
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });
  
  if (!user) {
    console.log('❌ User not found');
    return;
  }
  
  console.log('✅ User found:', user.email);
  
  // Get course with all relations
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
      enrollments: {
        where: {
          userId: user.id,
        },
      },
    },
  });
  
  if (!course) {
    console.log('❌ Course not found');
    return;
  }
  
  console.log('✅ Course found:', course.title);
  console.log('📚 Number of lessons:', course.lessons.length);
  console.log('👥 Number of enrollments:', course.enrollments.length);
  
  if (course.enrollments.length === 0) {
    console.log('❌ User not enrolled in this course');
    return;
  }
  
  console.log('✅ User is enrolled');
  
  // Get lesson progress
  const lessonProgress = await prisma.lessonProgress.findMany({
    where: {
      userId: user.id,
      lessonId: {
        in: course.lessons.map(l => l.id),
      },
    },
  });
  
  console.log('📊 Lesson progress records:', lessonProgress.length);
  
  // Format episodes
  const episodes = course.lessons.map((lesson, index) => {
    const progress = lessonProgress.find(p => p.lessonId === lesson.id);

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
      videoUrl: lesson.videoUrl || '/videos/demo-lesson.mp4',
      thumbnail: `/images/courses/netflix${(index % 6) + 1}.jpg`,
      episodeNumber: index + 1,
      seasonNumber: 1,
      watched: progress?.completed || false,
      progress: progress?.lastPosition ? Math.round((progress.lastPosition / (lesson.duration * 60)) * 100) : 0,
    };
  });
  
  console.log('\n✅ API Response would be:');
  console.log(JSON.stringify({
    course: {
      id: course.id,
      title: course.title,
      description: course.description,
      instructor: {
        name: course.creator.user.name,
        profileImage: course.creator.user.profileImage,
      },
      episodes: episodes.slice(0, 2), // Show first 2 episodes
    },
  }, null, 2));
  
  console.log(`\n... and ${episodes.length - 2} more episodes`);
  
  await prisma.$disconnect();
}

testWatchAPI().catch(console.error);
