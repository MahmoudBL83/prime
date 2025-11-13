/**
 * Course Player Page - Complete video learning experience
 * Provides video player with navigation, progress tracking, and resources
 */

import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import CoursePlayerLayout from '@/components/course/CoursePlayerLayout';
import { prisma } from '@/lib/prisma';
import { useTranslationsSafe } from '@/hooks/useTranslationsSafe';

interface CoursePlayerPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    lesson?: string;
  }>;
}

async function CoursePlayerPage({ params, searchParams }: CoursePlayerPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const { id: courseId } = await params;
  const { lesson: lessonId } = await searchParams;

  // Verify user has access to this course
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId: session.user.id,
      courseId: courseId,
    },
  });

  if (!enrollment) {
    redirect(`/courses/${courseId}`);
  }

  // Verify course exists and has video content
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      lessons: {
        include: {
          videoAsset: true,
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!course) {
    redirect('/courses');
  }

  // Get first lesson if none specified
  const firstLesson = lessonId || course.lessons[0]?.id;

  if (!firstLesson) {
    redirect(`/courses/${courseId}`);
  }

  return (
    <div className="h-screen bg-gray-50">
      <CoursePlayerLayout
        courseId={courseId}
        initialLessonId={firstLesson}
        className="h-full"
      />
    </div>
  );
}

// Loading component for course player
function CoursePlayerLoading() {
  const t = useTranslationsSafe('coursePage');

  return (
    <div className="h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{t('loadingPlayer')}</p>
      </div>
    </div>
  );
}

export default function Page({ params, searchParams }: CoursePlayerPageProps) {
  return (
    <Suspense fallback={<CoursePlayerLoading />}>
      <CoursePlayerPage params={params} searchParams={searchParams} />
    </Suspense>
  );
}
