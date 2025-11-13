/**
 * Enhanced Course Player Layout Component
 * Combines video player with course navigation for complete learning experience
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    PlayCircle,
    PauseCircle,
    CheckCircle2,
    Clock,
    Book,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
    Settings,
    MoreVertical,
    Download,
    Share2,
    Flag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetHeader,
    SheetTitle
} from '@/components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import MuxVideoPlayer from './MuxVideoPlayer';
import CourseNavigation from './CourseNavigation';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/video-utils';

interface CoursePlayerLayoutProps {
    courseId: string;
    initialLessonId?: string;
    className?: string;
}

interface CurrentLesson {
    id: string;
    title: string;
    titleAr: string;
    description?: string;
    videoAssetId: string;
    muxPlaybackId: string;
    duration: number;
    order: number;
    moduleTitle: string;
    moduleTitleAr?: string;
    nextLessonId?: string;
    prevLessonId?: string;
    resources?: ResourceItem[];
    transcript?: string;
}

interface ResourceItem {
    id: string;
    title: string;
    titleAr: string;
    type: 'PDF' | 'DOC' | 'LINK' | 'QUIZ';
    url: string;
    size?: number;
}

interface CourseInfo {
    id: string;
    title: string;
    titleAr: string;
    instructor: {
        id: string;
        name: string;
        avatar?: string;
    };
    progress: number;
    totalLessons: number;
    completedLessons: number;
}

export default function CoursePlayerLayout({
    courseId,
    initialLessonId,
    className
}: CoursePlayerLayoutProps) {
    const { data: session } = useSession();
    const [currentLesson, setCurrentLesson] = useState<CurrentLesson | null>(null);
    const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showResources, setShowResources] = useState(false);
    const [lessonProgress, setLessonProgress] = useState<number>(0);

    // Load lesson and course data
    useEffect(() => {
        if (!session?.user?.id || !courseId) return;

        const loadLessonData = async (lessonId?: string) => {
            try {
                setLoading(true);
                setError(null);

                const [lessonResponse, courseResponse] = await Promise.all([
                    fetch(`/api/courses/${courseId}/lessons/${lessonId || initialLessonId || 'first'}`),
                    fetch(`/api/courses/${courseId}/info`)
                ]);

                if (!lessonResponse.ok) {
                    throw new Error('فشل في تحميل بيانات الدرس');
                }

                if (!courseResponse.ok) {
                    throw new Error('فشل في تحميل بيانات الكورس');
                }

                const lesson = await lessonResponse.json();
                const course = await courseResponse.json();

                setCurrentLesson(lesson);
                setCourseInfo(course);

                // Load saved progress for this lesson
                const progressResponse = await fetch(`/api/videos/progress?videoAssetId=${lesson.videoAssetId}`);
                if (progressResponse.ok) {
                    const progress = await progressResponse.json();
                    if (progress.progress) {
                        setLessonProgress(progress.progress.progress);
                    }
                }

            } catch (err) {
                console.error('Failed to load lesson data:', err);
                setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
            } finally {
                setLoading(false);
            }
        };

        loadLessonData();
    }, [courseId, initialLessonId, session]);

    const handleLessonSelect = async (lesson: any) => {
        setCurrentLesson(lesson);
        setSidebarOpen(false);

        // Update URL without page reload
        const newUrl = `/courses/${courseId}/learn?lesson=${lesson.id}`;
        window.history.pushState(null, '', newUrl);
    };

    const navigateLesson = (direction: 'next' | 'prev') => {
        if (!currentLesson) return;

        const targetLessonId = direction === 'next' ?
            currentLesson.nextLessonId :
            currentLesson.prevLessonId;

        if (targetLessonId) {
            handleLessonSelect({ id: targetLessonId });
        }
    };

    const handleVideoProgress = (progress: any) => {
        setLessonProgress(progress.progress);

        // Auto-advance to next lesson when current one is completed
        if (progress.completed && currentLesson?.nextLessonId) {
            setTimeout(() => {
                navigateLesson('next');
            }, 2000); // 2 second delay for user to see completion
        }
    };

    const handleVideoComplete = () => {
        // Mark lesson as complete in the navigation
        console.log('Lesson completed:', currentLesson?.id);
    };

    const shareLesson = async () => {
        if (!currentLesson) return;

        const shareData = {
            title: currentLesson.titleAr || currentLesson.title,
            text: `شاهد هذا الدرس من كورس ${courseInfo?.titleAr || courseInfo?.title}`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            // Show toast notification here
        }
    };

    const downloadResource = async (resource: ResourceItem) => {
        try {
            const response = await fetch(`/api/courses/${courseId}/resources/${resource.id}/download`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = resource.title;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Failed to download resource:', error);
        }
    };

    if (loading) {
        return (
            <div className={cn("flex items-center justify-center h-screen bg-background", className)}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">جاري تحميل الدرس...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cn("flex items-center justify-center h-screen bg-background", className)}>
                <div className="text-center">
                    <div className="text-red-500 mb-4">
                        <Book className="w-16 h-16 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold">خطأ في تحميل الدرس</h2>
                        <p className="text-muted-foreground mt-2">{error}</p>
                    </div>
                    <Button onClick={() => window.location.reload()}>
                        إعادة المحاولة
                    </Button>
                </div>
            </div>
        );
    }

    if (!currentLesson || !courseInfo) return null;

    return (
        <div className={cn("h-screen bg-background flex flex-col", className)}>
            {/* Header */}
            <header className="bg-background border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    {/* Mobile Menu Toggle */}
                    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="sm" className="lg:hidden">
                                <Menu className="w-5 h-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-80 p-0">
                            <SheetHeader className="p-4 border-b">
                                <SheetTitle className="text-right">محتويات الكورس</SheetTitle>
                            </SheetHeader>
                            <CourseNavigation
                                courseId={courseId}
                                modules={[]} // TODO: Load proper modules data
                                currentLessonId={currentLesson.id}
                                onLessonSelect={(lessonId) => handleLessonSelect({ id: lessonId })}
                                onLessonComplete={() => { }}
                                lang="ar"
                            />
                        </SheetContent>
                    </Sheet>

                    {/* Course Title */}
                    <div className="hidden lg:block">
                        <h1 className="font-semibold text-foreground">
                            {courseInfo.titleAr || courseInfo.title}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {currentLesson.moduleTitle} - {currentLesson.titleAr || currentLesson.title}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    {/* Progress */}
                    <div className="hidden md:flex items-center space-x-2 rtl:space-x-reverse">
                        <span className="text-sm text-muted-foreground">التقدم:</span>
                        <div className="w-24">
                            <Progress value={courseInfo.progress} className="h-2" />
                        </div>
                        <span className="text-sm font-medium">{Math.round(courseInfo.progress)}%</span>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={shareLesson}>
                                <Share2 className="w-4 h-4 mr-2" />
                                مشاركة الدرس
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShowResources(!showResources)}>
                                <Download className="w-4 h-4 mr-2" />
                                الملفات المرفقة
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Flag className="w-4 h-4 mr-2" />
                                الإبلاغ عن مشكلة
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Video Player Area */}
                <main className="flex-1 flex flex-col">
                    {/* Video Player */}
                    <div className="bg-background flex-shrink-0">
                        <MuxVideoPlayer
                            playbackId={currentLesson.muxPlaybackId}
                            title={currentLesson.title}
                            titleAr={currentLesson.titleAr}
                            videoAssetId={currentLesson.videoAssetId}
                            courseId={courseId}
                            lessonId={currentLesson.id}
                            onProgress={handleVideoProgress}
                            onComplete={handleVideoComplete}
                            className="w-full aspect-video"
                        />
                    </div>

                    {/* Video Controls Bar */}
                    <div className="bg-background border-b px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center space-x-4 rtl:space-x-reverse">
                            {/* Previous/Next Lesson */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigateLesson('prev')}
                                disabled={!currentLesson.prevLessonId}
                            >
                                <ChevronRight className="w-4 h-4 mr-1" />
                                الدرس السابق
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigateLesson('next')}
                                disabled={!currentLesson.nextLessonId}
                            >
                                الدرس التالي
                                <ChevronLeft className="w-4 h-4 ml-1" />
                            </Button>
                        </div>

                        <div className="flex items-center space-x-4 rtl:space-x-reverse">
                            {/* Lesson Progress */}
                            <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
                                <span className="text-muted-foreground">تقدم الدرس:</span>
                                <div className="w-20">
                                    <Progress value={lessonProgress} className="h-1" />
                                </div>
                                <span className="font-medium">{Math.round(lessonProgress)}%</span>
                            </div>

                            {/* Completion Badge */}
                            {lessonProgress >= 85 && (
                                <Badge className="bg-green-100 text-green-700">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    مكتمل
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Lesson Content */}
                    <div className="flex-1 overflow-y-auto bg-background">
                        <div className="p-6">
                            {/* Lesson Header */}
                            <div className="mb-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground mb-2">
                                            {currentLesson.titleAr || currentLesson.title}
                                        </h2>
                                        <div className="flex items-center space-x-4 rtl:space-x-reverse text-sm text-muted-foreground">
                                            <div className="flex items-center">
                                                <Clock className="w-4 h-4 mr-1" />
                                                <span>{formatDuration(currentLesson.duration)}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <Book className="w-4 h-4 mr-1" />
                                                <span>{currentLesson.moduleTitle}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {currentLesson.description && (
                                    <p className="text-foreground leading-relaxed">
                                        {currentLesson.description}
                                    </p>
                                )}
                            </div>

                            {/* Resources Section */}
                            {currentLesson.resources && currentLesson.resources.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-foreground mb-4">الملفات المرفقة</h3>
                                    <div className="grid gap-3">
                                        {currentLesson.resources.map(resource => (
                                            <div
                                                key={resource.id}
                                                className="flex items-center justify-between p-4 bg-background rounded-lg border"
                                            >
                                                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                                    <div className="p-2 bg-blue-100 rounded">
                                                        <Download className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-foreground">
                                                            {resource.titleAr || resource.title}
                                                        </h4>
                                                        <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-muted-foreground">
                                                            <Badge variant="outline">{resource.type}</Badge>
                                                            {resource.size && (
                                                                <span>{(resource.size / 1024 / 1024).toFixed(1)} ميجابايت</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => downloadResource(resource)}
                                                >
                                                    تحميل
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Transcript Section */}
                            {currentLesson.transcript && (
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground mb-4">النص المكتوب</h3>
                                    <div className="prose prose-gray max-w-none">
                                        <div className="bg-background rounded-lg p-4 border">
                                            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground font-arabic">
                                                {currentLesson.transcript}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* Sidebar - Desktop Only */}
                <aside className="hidden lg:block w-80 bg-background border-l">
                    <CourseNavigation
                        courseId={courseId}
                        modules={[]} // TODO: Load proper modules data
                        currentLessonId={currentLesson.id}
                        onLessonSelect={(lessonId) => handleLessonSelect({ id: lessonId })}
                        onLessonComplete={() => { }}
                        lang="ar"
                    />
                </aside>
            </div>
        </div>
    );
}
