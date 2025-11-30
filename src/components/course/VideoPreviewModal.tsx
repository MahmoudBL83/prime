'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useSession } from 'next-auth/react';

interface VideoPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    course: {
        id: string;
        title: string;
        titleAr: string;
        thumbnail?: string;
        creator: {
            user: {
                name: string;
                arabicName?: string;
            }
        }
    };
    userSubscriptionStatus?: 'NONE' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    lang?: 'ar' | 'en';
}

export function VideoPreviewModal({
    isOpen,
    onClose,
    course,
    userSubscriptionStatus = 'NONE',
    lang = 'ar'
}: VideoPreviewModalProps) {
    const { data: session } = useSession();
    const { openAuthModal } = useAuthModal();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [previewTimeLeft, setPreviewTimeLeft] = useState(180); // 3 minutes preview
    const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const maxPreviewTime = session ? 180 : 60; // 3 minutes for logged in, 1 minute for anonymous

    useEffect(() => {
        if (isOpen) {
            setPreviewTimeLeft(maxPreviewTime);
            setCurrentTime(0);
            setShowSubscriptionPrompt(false);
        }
    }, [isOpen, maxPreviewTime]);

    useEffect(() => {
        if (isPlaying && previewTimeLeft > 0 && userSubscriptionStatus !== 'ACTIVE') {
            timerRef.current = setInterval(() => {
                setPreviewTimeLeft(prev => {
                    if (prev <= 1) {
                        setIsPlaying(false);
                        setShowSubscriptionPrompt(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isPlaying, previewTimeLeft, userSubscriptionStatus]);

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                if (previewTimeLeft > 0 || userSubscriptionStatus === 'ACTIVE') {
                    videoRef.current.play();
                } else {
                    setShowSubscriptionPrompt(true);
                    return;
                }
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
    const previewProgressPercentage = previewTimeLeft > 0 ? ((maxPreviewTime - previewTimeLeft) / maxPreviewTime) * 100 : 100;

    const t = {
        en: {
            freePreview: 'Free Preview',
            subscribeToWatch: 'Subscribe to Watch Full Course',
            previewTimeRemaining: 'Preview time remaining',
            fullAccess: 'Get unlimited access to this course and 150+ others',
            subscribe: 'Subscribe Now',
            signIn: 'Sign In to Continue',
            createAccount: 'Create Account',
            loginPrompt: 'Sign in to get a longer preview',
        },
        ar: {
            freePreview: 'معاينة مجانية',
            subscribeToWatch: 'اشترك لمشاهدة الدورة كاملة',
            previewTimeRemaining: 'الوقت المتبقي للمعاينة',
            fullAccess: 'احصل على وصول غير محدود لهذه الدورة و150+ دورة أخرى',
            subscribe: 'اشترك الآن',
            signIn: 'سجل دخولك للمتابعة',
            createAccount: 'إنشاء حساب',
            loginPrompt: 'سجل دخولك للحصول على معاينة أطول',
        }
    };

    const currentT = t[lang];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background bg-opacity-90"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="relative w-full max-w-4xl mx-4 bg-background rounded-xl overflow-hidden"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-10 p-2 bg-background bg-opacity-60 rounded-full text-foreground hover:bg-opacity-80 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Video container */}
                        <div className="relative aspect-video bg-background">
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                                poster={course.thumbnail}
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                muted={isMuted}
                            >
                                {/* Sample video source - in real implementation, this would come from your video service */}
                                <source src="/videos/sample-preview.mp4" type="video/mp4" />
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-foreground text-center">
                                        <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Play className="w-12 h-12" />
                                        </div>
                                        <p>Sample video preview would play here</p>
                                    </div>
                                </div>
                            </video>

                            {/* Preview restriction overlay */}
                            {showSubscriptionPrompt && (
                                <motion.div
                                    className="absolute inset-0 bg-background bg-opacity-80 flex items-center justify-center"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="text-center text-foreground max-w-md mx-4">
                                        <div className="w-20 h-20 bg-yellow-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Play className="w-10 h-10 text-yellow-400" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">
                                            {!session ? currentT.signIn : currentT.subscribeToWatch}
                                        </h3>
                                        <p className="text-muted-foreground mb-6">
                                            {!session ? currentT.loginPrompt : currentT.fullAccess}
                                        </p>
                                        <div className="space-y-3">
                                            {!session ? (
                                                <>
                                                    <Button
                                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                                        onClick={() => openAuthModal('signin')}
                                                    >
                                                        {currentT.signIn}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full border-gray-600 text-muted-foreground hover:bg-card"
                                                        onClick={() => openAuthModal('signup')}
                                                    >
                                                        {currentT.createAccount}
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button
                                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                                    onClick={() => window.location.href = `/subscribe?course=${course.id}`}
                                                >
                                                    {currentT.subscribe}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Play/Pause overlay */}
                            {!showSubscriptionPrompt && (
                                <div
                                    className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                                    onClick={handlePlayPause}
                                >
                                    <div className="w-20 h-20 bg-background bg-opacity-60 rounded-full flex items-center justify-center">
                                        {isPlaying ? (
                                            <Pause className="w-10 h-10 text-foreground" />
                                        ) : (
                                            <Play className="w-10 h-10 text-foreground ml-1" />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Video controls */}
                            {!showSubscriptionPrompt && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                                    {/* Progress bar */}
                                    <div className="w-full bg-gray-600 rounded-full h-1 mb-4">
                                        <div
                                            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                                            style={{ width: `${progressPercentage}%` }}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={handlePlayPause}
                                                className="p-2 rounded-full hover:bg-background hover:bg-opacity-20 transition-colors"
                                            >
                                                {isPlaying ? (
                                                    <Pause className="w-5 h-5 text-foreground" />
                                                ) : (
                                                    <Play className="w-5 h-5 text-foreground" />
                                                )}
                                            </button>

                                            <button
                                                onClick={() => setIsMuted(!isMuted)}
                                                className="p-2 rounded-full hover:bg-background hover:bg-opacity-20 transition-colors"
                                            >
                                                {isMuted ? (
                                                    <VolumeX className="w-5 h-5 text-foreground" />
                                                ) : (
                                                    <Volume2 className="w-5 h-5 text-foreground" />
                                                )}
                                            </button>

                                            <span className="text-foreground text-sm">
                                                {formatTime(currentTime)} / {formatTime(duration)}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {userSubscriptionStatus !== 'ACTIVE' && (
                                                <div className="text-foreground text-sm bg-red-600 bg-opacity-80 px-3 py-1 rounded">
                                                    {currentT.previewTimeRemaining}: {formatTime(previewTimeLeft)}
                                                </div>
                                            )}

                                            <button className="p-2 rounded-full hover:bg-background hover:bg-opacity-20 transition-colors">
                                                <Maximize2 className="w-5 h-5 text-foreground" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Course info */}
                        <div className="p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-foreground mb-2">
                                        {lang === 'ar' ? course.titleAr : course.title}
                                    </h2>
                                    <p className="text-muted-foreground">
                                        {lang === 'ar' ? 'بواسطة' : 'by'} {course.creator.user.arabicName || course.creator.user.name}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <div className="text-sm text-muted-foreground mb-1">{currentT.freePreview}</div>
                                    {userSubscriptionStatus !== 'ACTIVE' && (
                                        <div className="w-32 bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${previewProgressPercentage}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
