'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Crown, Play, Lock, X, Star } from 'lucide-react';
import { CourseCard as CourseCardType } from '@/types/landing';
import { useAuthModal } from '@/contexts/AuthModalContext';

interface CoursePlayerGateProps {
    children: React.ReactNode;
    course: CourseCardType;
    userSubscriptionStatus?: 'NONE' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    onPreviewComplete?: () => void;
}

interface PreviewState {
    hasWatchedPreview: boolean;
    previewTimeRemaining: number;
    isPreviewPlaying: boolean;
}

export function CoursePlayerGate({
    children,
    course,
    userSubscriptionStatus = 'NONE',
    onPreviewComplete
}: CoursePlayerGateProps) {
    const { data: session } = useSession();
    const [previewState, setPreviewState] = useState<PreviewState>({
        hasWatchedPreview: false,
        previewTimeRemaining: 300, // 5 minutes preview
        isPreviewPlaying: false,
    });
    const [showGate, setShowGate] = useState(true);
    const [isExiting, setIsExiting] = useState(false);
    const { openAuthModal } = useAuthModal();

    // Check if user should see the gate
    useEffect(() => {
        if (userSubscriptionStatus === 'ACTIVE') {
            setShowGate(false);
        } else if (!session) {
            // Anonymous users get a shorter preview
            setPreviewState(prev => ({ ...prev, previewTimeRemaining: 120 }));
        }
    }, [userSubscriptionStatus, session]);

    const handlePreviewStart = () => {
        setPreviewState(prev => ({ ...prev, isPreviewPlaying: true }));
        // Start countdown timer
        const timer = setInterval(() => {
            setPreviewState(prev => {
                if (prev.previewTimeRemaining <= 1) {
                    clearInterval(timer);
                    return { ...prev, isPreviewPlaying: false, hasWatchedPreview: true };
                }
                return { ...prev, previewTimeRemaining: prev.previewTimeRemaining - 1 };
            });
        }, 1000);
    };

    const handleSubscribe = () => {
        // Navigate to subscribe page with course context
        window.location.href = `/subscribe?course=${course.id}`;
    };

    const handleLogin = () => {
        openAuthModal('signin');
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Don't show gate for subscribed users
    if (!showGate || userSubscriptionStatus === 'ACTIVE') {
        return <>{children}</>;
    }

    return (
        <div className="relative">
            {/* Content being gated */}
            <div className={`${isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} transition-all duration-300`}>
                {children}
            </div>

            {/* Premium Content Overlay */}
            <div className={`absolute inset-0 bg-background bg-opacity-90 flex items-center justify-center ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-all duration-300`}>
                <div className="max-w-2xl w-full mx-4 p-8 bg-background rounded-xl text-foreground relative">
                    {/* Close button for preview */}
                    {previewState.hasWatchedPreview && (
                        <button
                            onClick={() => setIsExiting(true)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-card transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}

                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <Crown className="w-10 h-10 text-yellow-400" />
                            <h2 className="text-3xl font-bold">محتوى مميز</h2>
                        </div>
                        <p className="text-muted-foreground text-lg mb-6">
                            {course.titleAr} - دورة حصرية للمشتركين
                        </p>

                        {/* Course Info */}
                        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mb-8">
                            <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span>{course.rating} تقييم</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>{course.duration}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>{course.level}</span>
                            </div>
                        </div>
                    </div>

                    {!previewState.hasWatchedPreview ? (
                        // Preview state
                        <div className="text-center">
                            <div className="mb-6">
                                <div className="w-20 h-20 bg-yellow-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Play className="w-10 h-10 text-yellow-400" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">
                                    {session ? 'شاهد معاينة مجانية' : 'سجل دخولك للمشاهدة'}
                                </h3>
                                <p className="text-muted-foreground">
                                    {session
                                        ? `احصل على ${formatTime(previewState.previewTimeRemaining)} من المشاهدة المجانية`
                                        : 'سجل دخولك لتتمكن من مشاهدة معاينة الدورة'
                                    }
                                </p>
                            </div>

                            <div className="space-y-3">
                                {session ? (
                                    <Button
                                        onClick={handlePreviewStart}
                                        disabled={previewState.isPreviewPlaying}
                                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-foreground font-semibold py-3"
                                    >
                                        <Play className="w-5 h-5 ml-2" />
                                        {previewState.isPreviewPlaying ? 'جاري المشاهدة...' : 'ابدأ المعاينة المجانية'}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleLogin}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-foreground font-semibold py-3"
                                    >
                                        سجل دخولك للمشاهدة
                                    </Button>
                                )}

                                <div className="border-t border-border pt-4">
                                    <p className="text-sm text-muted-foreground mb-3">
                                        أو احصل على وصول غير محدود إلى جميع الدورات:
                                    </p>
                                    <Button
                                        onClick={handleSubscribe}
                                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-foreground font-semibold py-3"
                                    >
                                        <Crown className="w-5 h-5 ml-2" />
                                        اشترك الآن - 150 جنيه/شهر
                                    </Button>
                                </div>
                            </div>

                            {/* Features list */}
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Star className="w-4 h-4 text-green-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm mb-1">150+ دورة</h4>
                                        <p className="text-xs text-muted-foreground">وصول لجميع الدورات الحصرية</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Crown className="w-4 h-4 text-green-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm mb-1">محتوى مميز</h4>
                                        <p className="text-xs text-muted-foreground">دورات من معلمين خبراء</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Lock className="w-4 h-4 text-green-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm mb-1">دعم أولوية</h4>
                                        <p className="text-xs text-muted-foreground">مساعدة فورية للمشتركين</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Preview completed state
                        <div className="text-center">
                            <div className="mb-6">
                                <div className="w-20 h-20 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Lock className="w-10 h-10 text-red-400" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">انتهت المعاينة المجانية</h3>
                                <p className="text-muted-foreground">
                                    لقد استهلكت معاينتك المجانية ({formatTime(previewState.previewTimeRemaining)})
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    onClick={handleSubscribe}
                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-foreground font-semibold py-3"
                                >
                                    <Crown className="w-5 h-5 ml-2" />
                                    استمر في المشاهدة - 150 جنيه/شهر
                                </Button>

                                <Button
                                    onClick={() => setIsExiting(true)}
                                    variant="outline"
                                    className="w-full border-gray-600 text-muted-foreground hover:bg-card"
                                >
                                    استكشف دورات أخرى
                                </Button>
                            </div>

                            {/* Trust indicators */}
                            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span>إلغاء في أي وقت</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span>دفع آمن</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span>دعم 24/7</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
