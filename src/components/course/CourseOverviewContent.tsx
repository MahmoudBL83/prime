/**
 * Enhanced Course Overview Content Component
 * Comprehensive course details with integrated learning flow
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import {
    Play,
    Clock,
    Users,
    BookOpen,
    Star,
    CheckCircle2,
    Lock,
    Download,
    Share2,
    Heart,
    Award,
    Bookmark,
    PlayCircle,
    Eye,
    TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDuration } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface CourseOverviewContentProps {
    course: any; // TODO: Type this properly
}

export default function CourseOverviewContent({ course }: CourseOverviewContentProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const t = useTranslations('courses');
    const tCommon = useTranslations('common');
    const locale = useLocale();
    const [enrolling, setEnrolling] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [liked, setLiked] = useState(false);

    const handleEnroll = async () => {
        if (!session) {
            router.push('/auth/signin');
            return;
        }

        try {
            setEnrolling(true);
            const response = await fetch(`/api/courses/${course.id}/enroll`, {
                method: 'POST',
            });

            if (response.ok) {
                router.refresh();
            } else {
                throw new Error('Failed to enroll');
            }
        } catch (error) {
            console.error('Enrollment failed:', error);
        } finally {
            setEnrolling(false);
        }
    };

    const handleStartLearning = () => {
        const firstLesson = course.lessons[0];
        if (firstLesson) {
            router.push(`/courses/${course.id}/learn-new?lesson=${firstLesson.id}`);
        }
    };

    const handleContinueLearning = () => {
        // Find the first incomplete lesson
        const nextLesson = course.lessons.find((lesson: any) =>
            !lesson.progress?.some((p: any) => p.completed)
        );

        if (nextLesson) {
            router.push(`/courses/${course.id}/learn-new?lesson=${nextLesson.id}`);
        } else {
            // All lessons complete, go to first lesson
            router.push(`/courses/${course.id}/learn-new?lesson=${course.lessons[0].id}`);
        }
    };

    const shareCourse = async () => {
        const shareText = locale === 'ar'
            ? `شاهد هذا الكورس الرائع: ${course.titleAr || course.title}`
            : locale === 'de'
                ? `Sehen Sie sich diesen großartigen Kurs an: ${course.title}`
                : `Check out this amazing course: ${course.title}`;

        const shareData = {
            title: locale === 'ar' ? course.titleAr || course.title : course.title,
            text: shareText,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            // Show toast here
        }
    };

    const toggleBookmark = async () => {
        // TODO: Implement bookmark API
        setBookmarked(!bookmarked);
    };

    const toggleLike = async () => {
        // TODO: Implement like API
        setLiked(!liked);
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-foreground">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Course Info */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <Badge variant="secondary" className="bg-white/20 text-foreground">
                                    {course.category}
                                </Badge>
                                <Badge variant="secondary" className="bg-white/20 text-foreground">
                                    {course.skillLevel}
                                </Badge>
                            </div>

                            <h1 className="text-4xl font-bold mb-4">
                                {course.titleAr || course.title}
                            </h1>

                            <p className="text-xl text-blue-100 mb-6 leading-relaxed">
                                {course.descriptionAr || course.description}
                            </p>

                            {/* Course Stats */}
                            <div className="flex flex-wrap items-center gap-6 mb-6">
                                <div className="flex items-center gap-2">
                                    <Star className="w-5 h-5 text-yellow-400" />
                                    <span className="font-medium">{course.rating.toFixed(1)}</span>
                                    <span className="text-blue-200">
                                        ({course.reviews.length} {locale === 'ar' ? 'تقييم' : locale === 'de' ? 'Bewertungen' : 'reviews'})
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    <span>
                                        {course.totalEnrollments.toLocaleString()} {locale === 'ar' ? 'طالب' : locale === 'de' ? 'Schüler' : 'students'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    <span>{formatDuration(course.duration * 60)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5" />
                                    <span>
                                        {course.totalLessons} {locale === 'ar' ? 'درس' : locale === 'de' ? 'Lektionen' : 'lessons'}
                                    </span>
                                </div>
                            </div>

                            {/* Instructor Info */}
                            <div className="flex items-center gap-4 bg-white/10 rounded-lg p-4">
                                <Avatar className="w-12 h-12">
                                    <AvatarImage src={course.instructor.avatar} />
                                    <AvatarFallback>{course.instructor.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">
                                        {locale === 'ar' ? 'المدرب: ' : locale === 'de' ? 'Trainer: ' : 'Instructor: '}
                                        {course.instructor.name}
                                    </p>
                                    <p className="text-blue-200 text-sm">{course.instructor.bio}</p>
                                </div>
                            </div>
                        </div>

                        {/* Course Preview & Actions */}
                        <div className="lg:col-span-1">
                            <Card className="bg-background shadow-2xl">
                                <CardContent className="p-6">
                                    {/* Video Preview */}
                                    <div className="relative mb-6">
                                        <img
                                            src={course.thumbnail}
                                            alt={course.titleAr || course.title}
                                            className="w-full h-48 object-cover rounded-lg"
                                        />
                                        <div className="absolute inset-0 bg-background/20 rounded-lg flex items-center justify-center">
                                            <Button
                                                size="lg"
                                                className="bg-white/90 text-foreground hover:bg-background"
                                                onClick={() => course.demoVideoUrl && window.open(course.demoVideoUrl)}
                                            >
                                                <PlayCircle className="w-6 h-6 mr-2" />
                                                {locale === 'ar' ? 'معاينة الكورس' : locale === 'de' ? 'Kursvorschau' : 'Preview Course'}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Progress (if enrolled) */}
                                    {course.isEnrolled && (
                                        <div className="mb-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-foreground">
                                                    {locale === 'ar' ? 'التقدم' : locale === 'de' ? 'Fortschritt' : 'Progress'}
                                                </span>
                                                <span className="text-sm font-medium text-foreground">{course.progress}%</span>
                                            </div>
                                            <Progress value={course.progress} className="h-2" />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {course.completedLessons} {locale === 'ar' ? 'من' : locale === 'de' ? 'von' : 'of'} {course.totalLessons} {locale === 'ar' ? 'درس مكتمل' : locale === 'de' ? 'Lektionen abgeschlossen' : 'lessons completed'}
                                            </p>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="space-y-3">
                                        {course.isEnrolled ? (
                                            <>
                                                <Button
                                                    size="lg"
                                                    className="w-full"
                                                    onClick={course.progress > 0 ? handleContinueLearning : handleStartLearning}
                                                >
                                                    <Play className="w-5 h-5 mr-2" />
                                                    {course.progress > 0
                                                        ? (locale === 'ar' ? 'متابعة التعلم' : locale === 'de' ? 'Lernen fortsetzen' : 'Continue Learning')
                                                        : (locale === 'ar' ? 'بدء التعلم' : locale === 'de' ? 'Lernen beginnen' : 'Start Learning')
                                                    }
                                                </Button>
                                                {course.progress >= 90 && (
                                                    <Button
                                                        variant="outline"
                                                        size="lg"
                                                        className="w-full"
                                                        onClick={() => router.push(`/courses/${course.id}/certificate`)}
                                                    >
                                                        <Award className="w-5 h-5 mr-2" />
                                                        {locale === 'ar' ? 'تحميل الشهادة' : locale === 'de' ? 'Zertifikat herunterladen' : 'Download Certificate'}
                                                    </Button>
                                                )}
                                            </>
                                        ) : (
                                            <Button
                                                size="lg"
                                                className="w-full"
                                                onClick={handleEnroll}
                                                disabled={enrolling}
                                            >
                                                {enrolling
                                                    ? (locale === 'ar' ? 'جاري التسجيل...' : locale === 'de' ? 'Registrierung läuft...' : 'Enrolling...')
                                                    : (locale === 'ar' ? 'التسجيل في الكورس' : locale === 'de' ? 'Für Kurs anmelden' : 'Enroll in Course')
                                                }
                                            </Button>
                                        )}

                                        {/* Secondary Actions */}
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={toggleBookmark}
                                            >
                                                <Bookmark className={cn("w-4 h-4", bookmarked && "fill-current")} />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={toggleLike}
                                            >
                                                <Heart className={cn("w-4 h-4", liked && "fill-current text-red-500")} />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={shareCourse}
                                            >
                                                <Share2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Course Features */}
                                    <div className="mt-6 pt-6 border-t">
                                        <h4 className="font-medium text-foreground mb-3">
                                            {locale === 'ar' ? 'ما ستحصل عليه:' : locale === 'de' ? 'Was Sie erhalten werden:' : 'What you will get:'}
                                        </h4>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                {locale === 'ar' ? 'وصول مدى الحياة للكورس' : locale === 'de' ? 'Lebenslanger Zugang zum Kurs' : 'Lifetime access to the course'}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                {locale === 'ar' ? 'شهادة إتمام معتمدة' : locale === 'de' ? 'Zertifiziertes Abschlusszertifikat' : 'Certified completion certificate'}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                {locale === 'ar' ? 'ملفات ومواد تعليمية قابلة للتحميل' : locale === 'de' ? 'Herunterladbare Dateien und Lernmaterialien' : 'Downloadable files and learning materials'}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                {locale === 'ar' ? 'دعم من المدرب والمجتمع' : locale === 'de' ? 'Unterstützung vom Trainer und der Community' : 'Support from instructor and community'}
                                            </li>
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Content */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <Tabs defaultValue="curriculum" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="curriculum">
                                    {locale === 'ar' ? 'المنهج' : locale === 'de' ? 'Lehrplan' : 'Curriculum'}
                                </TabsTrigger>
                                <TabsTrigger value="about">
                                    {locale === 'ar' ? 'عن الكورس' : locale === 'de' ? 'Über den Kurs' : 'About Course'}
                                </TabsTrigger>
                                <TabsTrigger value="instructor">
                                    {locale === 'ar' ? 'المدرب' : locale === 'de' ? 'Trainer' : 'Instructor'}
                                </TabsTrigger>
                                <TabsTrigger value="reviews">
                                    {locale === 'ar' ? 'التقييمات' : locale === 'de' ? 'Bewertungen' : 'Reviews'}
                                </TabsTrigger>
                            </TabsList>

                            {/* Curriculum Tab */}
                            <TabsContent value="curriculum" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            {locale === 'ar' ? 'محتوى الكورس' : locale === 'de' ? 'Kursinhalt' : 'Course Content'}
                                        </CardTitle>
                                        <CardDescription>
                                            {course.totalLessons} {locale === 'ar' ? 'درس' : locale === 'de' ? 'Lektionen' : 'lessons'} • {formatDuration(course.duration * 60)}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {course.lessons.map((lesson: any, index: number) => {
                                                const isCompleted = lesson.progress?.some((p: any) => p.completed);
                                                const isLocked = !course.isEnrolled && index > 0;

                                                return (
                                                    <div
                                                        key={lesson.id}
                                                        className={cn(
                                                            "flex items-center justify-between p-3 rounded-lg border",
                                                            isCompleted && "bg-green-50 border-green-200",
                                                            isLocked && "bg-background opacity-60"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-shrink-0">
                                                                {isCompleted ? (
                                                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                                ) : isLocked ? (
                                                                    <Lock className="w-5 h-5 text-muted-foreground" />
                                                                ) : (
                                                                    <PlayCircle className="w-5 h-5 text-blue-500" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium text-foreground">
                                                                    {locale === 'ar' ? lesson.titleAr || lesson.title : lesson.title}
                                                                </h4>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {locale === 'ar' ? 'الدرس' : locale === 'de' ? 'Lektion' : 'Lesson'} {index + 1} • {formatDuration(lesson.duration * 60)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {course.isEnrolled && !isLocked && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => router.push(`/courses/${course.id}/learn-new?lesson=${lesson.id}`)}
                                                            >
                                                                {isCompleted
                                                                    ? (locale === 'ar' ? 'مراجعة' : locale === 'de' ? 'Überprüfen' : 'Review')
                                                                    : (locale === 'ar' ? 'مشاهدة' : locale === 'de' ? 'Ansehen' : 'Watch')
                                                                }
                                                            </Button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* About Tab */}
                            <TabsContent value="about" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            {locale === 'ar' ? 'وصف الكورس' : locale === 'de' ? 'Kursbeschreibung' : 'Course Description'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="prose prose-gray max-w-none">
                                            <p className="text-foreground leading-relaxed">
                                                {locale === 'ar' ? course.descriptionAr || course.description : course.description}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Instructor Tab */}
                            <TabsContent value="instructor" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            {locale === 'ar' ? 'عن المدرب' : locale === 'de' ? 'Über den Trainer' : 'About Instructor'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-start gap-4">
                                            <Avatar className="w-16 h-16">
                                                <AvatarImage src={course.instructor.avatar} />
                                                <AvatarFallback>{course.instructor.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h4 className="text-xl font-semibold">{course.instructor.name}</h4>
                                                <p className="text-muted-foreground mt-2">{course.instructor.bio}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Reviews Tab */}
                            <TabsContent value="reviews" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            {locale === 'ar' ? 'تقييمات الطلاب' : locale === 'de' ? 'Schülerbewertungen' : 'Student Reviews'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {course.reviews.map((review: any) => (
                                                <div key={review.id} className="border-b pb-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="font-medium">{review.userName}</span>
                                                        <div className="flex">
                                                            {[1, 2, 3, 4, 5].map(star => (
                                                                <Star
                                                                    key={star}
                                                                    className={cn(
                                                                        "w-4 h-4",
                                                                        star <= review.rating ? "text-yellow-400 fill-current" : "text-muted-foreground"
                                                                    )}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-foreground">{review.comment}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        {/* Related Courses */}
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {locale === 'ar' ? 'كورسات ذات صلة' : locale === 'de' ? 'Verwandte Kurse' : 'Related Courses'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {course.relatedCourses.map((related: any) => (
                                        <div
                                            key={related.id}
                                            className="flex gap-3 p-3 rounded-lg border hover:bg-background cursor-pointer"
                                            onClick={() => router.push(`/courses/${related.id}`)}
                                        >
                                            <img
                                                src={related.thumbnail}
                                                alt={locale === 'ar' ? related.titleAr || related.title : related.title}
                                                className="w-16 h-16 object-cover rounded"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-sm truncate">
                                                    {locale === 'ar' ? related.titleAr || related.title : related.title}
                                                </h4>
                                                <p className="text-xs text-muted-foreground">
                                                    {locale === 'ar'
                                                        ? related.creator.user.arabicName || related.creator.user.name
                                                        : related.creator.user.name
                                                    }
                                                </p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                                    <span className="text-xs">{related.rating.toFixed(1)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
