'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ContentStatus } from '@prisma/client';
import {
    X,
    Play,
    FileText,
    Star,
    Calendar,
    DollarSign,
    Users,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    BookOpen,
    Loader2,
    MessageSquare,
    Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface Lesson {
    id: string;
    title: string;
    description: string;
    order: number;
    duration: number;
    videoUrl?: string;
    content?: string;
    isPublished: boolean;
    createdAt: string;
}

interface Creator {
    id: string;
    name: string;
    email: string;
    isVerified: boolean;
    totalStudents: number;
    totalEarnings: number;
}

interface Course {
    id: string;
    title: string;
    description: string;
    price: number;
    thumbnail: string;
    status: ContentStatus;
    category: string;
    level: string;
    duration: number;
    rating: number;
    totalStudents: number;
    totalRevenue: number;
    createdAt: string;
    updatedAt: string;
    creator: Creator;
    lessons: Lesson[];
    _count: {
        enrollments: number;
        lessons: number;
    };
}

interface CourseDetailsModalProps {
    courseId: string;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (courseId: string, status: ContentStatus) => void;
}

export default function CourseDetailsModal({ courseId, isOpen, onClose, onUpdate }: CourseDetailsModalProps) {
    const { data: session } = useSession();
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'reviews'>('overview');
    const [isUpdating, setIsUpdating] = useState(false);
    const [reviewNote, setReviewNote] = useState('');

    useEffect(() => {
        if (isOpen && courseId) {
            fetchCourseDetails();
        }
    }, [isOpen, courseId]);

    const fetchCourseDetails = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/content/${courseId}`);
            if (response.ok) {
                const data = await response.json();
                setCourse(data);
            } else {
                throw new Error('Failed to fetch course details');
            }
        } catch (error) {
            console.error('Error fetching course details:', error);
            toast.error('Failed to load course details');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: ContentStatus) => {
        if (!course) return;

        setIsUpdating(true);
        try {
            const response = await fetch(`/api/admin/content/${course.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: newStatus,
                    reviewNote: reviewNote.trim() || undefined
                }),
            });

            if (response.ok) {
                setCourse({ ...course, status: newStatus });
                onUpdate(course.id, newStatus);
                setReviewNote('');
                toast.success(`Course status updated to ${newStatus}`);
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update course status');
            }
        } catch (error) {
            console.error('Error updating course status:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to update status');
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusDetails = (status: ContentStatus) => {
        switch (status) {
            case 'PUBLISHED':
                return { color: 'bg-green-500/10 text-green-400 border-green-500/20', label: 'Published' };
            case 'UNDER_REVIEW':
                return { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'Under Review' };
            case 'REJECTED':
                return { color: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Rejected' };
            default:
                return { color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', label: 'Draft' };
        }
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="bg-background/80 backdrop-blur-xl rounded-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col border border-white/20 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] relative z-10 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-border/50 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                            <BookOpen className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground tracking-tight">Course Details</h2>
                            <p className="text-sm text-muted-foreground">Manage course content and moderation</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center p-24">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                            <p className="text-muted-foreground font-medium">Loading course data...</p>
                        </div>
                    </div>
                ) : course ? (
                    <div className="flex flex-col flex-1 overflow-hidden">
                        {/* Course Hero Banner */}
                        <div className="p-6 bg-gradient-to-r from-blue-600/10 via-transparent to-indigo-600/10 border-b border-border/50">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-blue-500/20 blur-xl group-hover:bg-blue-500/30 transition-all rounded-xl" />
                                    <img
                                        src={course.thumbnail || '/images/placeholder-course.jpg'}
                                        alt={course.title}
                                        className="relative w-48 h-32 object-cover rounded-xl border border-white/10 shadow-lg"
                                    />
                                </div>

                                <div className="flex-1">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-2xl font-bold text-foreground">{course.title}</h3>
                                                {(() => {
                                                    const status = getStatusDetails(course.status);
                                                    return (
                                                        <span className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${status.color}`}>
                                                            {status.label}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <p className="text-muted-foreground text-sm line-clamp-2 mb-4 max-w-2xl">{course.description}</p>

                                            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-blue-500" />
                                                    <span>{new Date(course.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <DollarSign className="w-4 h-4 text-green-500" />
                                                    <span className="font-semibold text-foreground">${course.price}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-orange-500" />
                                                    <span>{formatDuration(course.duration)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-purple-500" />
                                                    <span>{course.totalStudents} students</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500/20" />
                                                    <span>{course.rating.toFixed(1)} Rating</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2 bg-white/5 p-4 rounded-xl border border-white/10">
                                            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Revenue</div>
                                            <div className="text-2xl font-black text-green-400">${course.totalRevenue.toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Creator Info Card */}
                        <div className="mx-6 mt-6 p-4 bg-muted/30 rounded-xl border border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-inner">
                                    {course.creator.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-foreground">{course.creator.name}</p>
                                        {course.creator.isVerified && (
                                            <CheckCircle className="w-4 h-4 text-blue-500" />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{course.creator.email}</p>
                                </div>
                            </div>

                            <div className="flex gap-8 text-sm">
                                <div className="text-center md:text-right">
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Students</p>
                                    <p className="font-bold text-foreground">{course.creator.totalStudents.toLocaleString()}</p>
                                </div>
                                <div className="text-center md:text-right">
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Earnings</p>
                                    <p className="font-bold text-foreground">${course.creator.totalEarnings.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="px-6 mt-6">
                            <div className="flex space-x-6 border-b border-border/50">
                                {[
                                    { id: 'overview', icon: FileText, label: 'Course Overview' },
                                    { id: 'lessons', icon: Play, label: `Curriculum (${course._count.lessons})` },
                                    { id: 'reviews', icon: Shield, label: 'Moderation & Safety' }
                                ].map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`flex items-center gap-2 px-1 py-4 text-sm font-semibold transition-all relative ${activeTab === tab.id
                                                    ? 'text-blue-500'
                                                    : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {tab.label}
                                            {activeTab === tab.id && (
                                                <motion.div
                                                    layoutId="activeTab"
                                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Content Scroll Area */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {activeTab === 'overview' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-colors">
                                            <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Category & Level</h5>
                                            <div className="space-y-1">
                                                <p className="text-foreground font-medium flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                    {course.category}
                                                </p>
                                                <p className="text-foreground font-medium flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                    {course.level}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-colors">
                                            <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Total Enrollments</h5>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black text-foreground">{course._count.enrollments}</span>
                                                <span className="text-sm text-muted-foreground">Students</span>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-colors">
                                            <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Course Health</h5>
                                            <div className="flex items-center gap-2">
                                                <div className="flex text-yellow-500">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star key={i} className={`w-4 h-4 ${i < Math.floor(course.rating) ? 'fill-current' : ''}`} />
                                                    ))}
                                                </div>
                                                <span className="text-foreground font-bold">{course.rating.toFixed(1)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                                        <h5 className="text-sm font-bold text-foreground mb-4">Course Description</h5>
                                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{course.description}</p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-8 text-xs text-muted-foreground bg-black/20 p-4 rounded-xl">
                                        <div className="flex flex-col gap-1">
                                            <span className="uppercase tracking-widest opacity-50 font-bold">First Published</span>
                                            <span className="text-foreground font-medium">{new Date(course.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="uppercase tracking-widest opacity-50 font-bold">Last Modified</span>
                                            <span className="text-foreground font-medium">{new Date(course.updatedAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'lessons' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {course.lessons.length === 0 ? (
                                        <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                                            <Play className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                            <p className="text-muted-foreground">No lessons have been added to this course yet.</p>
                                        </div>
                                    ) : (
                                        course.lessons.map((lesson, idx) => (
                                            <div
                                                key={lesson.id}
                                                className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 p-5 rounded-2xl transition-all"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between gap-4 mb-2">
                                                            <h6 className="font-bold text-foreground text-lg">{lesson.title}</h6>
                                                            {lesson.isPublished ? (
                                                                <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                                                                    <CheckCircle className="w-3 h-3" /> Published
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-400/10 px-2 py-0.5 rounded-full">
                                                                    <XCircle className="w-3 h-3" /> Disabled
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-muted-foreground text-sm mb-4">{lesson.description}</p>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-1.5 text-xs bg-black/20 px-3 py-1.5 rounded-lg text-muted-foreground">
                                                                <Clock className="w-3.5 h-3.5 text-orange-400" />
                                                                {formatDuration(lesson.duration)}
                                                            </div>
                                                            {lesson.videoUrl && (
                                                                <div className="flex items-center gap-1.5 text-xs bg-black/20 px-3 py-1.5 rounded-lg text-muted-foreground">
                                                                    <Play className="w-3.5 h-3.5 text-blue-400" />
                                                                    Video Lesson
                                                                </div>
                                                            )}
                                                            {lesson.content && (
                                                                <div className="flex items-center gap-1.5 text-xs bg-black/20 px-3 py-1.5 rounded-lg text-muted-foreground">
                                                                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                                                    Written Content
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 transform rotate-12 opacity-5 translate-x-4 -translate-y-4">
                                            <Shield className="w-32 h-32" />
                                        </div>
                                        <div className="flex items-start gap-4 relative z-10">
                                            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                                                <AlertTriangle className="w-6 h-6 text-yellow-500" />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-yellow-500 text-lg mb-2">Content Moderation & Policy</h5>
                                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-yellow-500/80">
                                                    <li className="flex items-start gap-2">
                                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-500" />
                                                        Ensure all contents meet educational standards
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-500" />
                                                        Verify course title/desc match lesson content
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-500" />
                                                        Audit video and audio quality for production standards
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-500" />
                                                        Monitor for potential copyright violations
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h5 className="text-sm font-bold text-foreground flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4 text-blue-500" />
                                            Admin Moderation Notes
                                        </h5>
                                        <textarea
                                            value={reviewNote}
                                            onChange={(e) => setReviewNote(e.target.value)}
                                            placeholder="Document your review findings or reasons for rejection/approval..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-foreground placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none transition-all"
                                            rows={5}
                                        />
                                    </div>

                                    <div className="flex flex-wrap gap-4 pt-4">
                                        {course.status !== 'PUBLISHED' && (
                                            <button
                                                onClick={() => handleStatusUpdate('PUBLISHED')}
                                                disabled={isUpdating}
                                                className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                                            >
                                                {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                                Approve & Go Live
                                            </button>
                                        )}

                                        {course.status !== 'REJECTED' && (
                                            <button
                                                onClick={() => handleStatusUpdate('REJECTED')}
                                                disabled={isUpdating}
                                                className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-4 bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-500 hover:text-white font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                                            >
                                                {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                                                Reject Course
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleStatusUpdate('UNDER_REVIEW')}
                                            disabled={isUpdating || course.status === 'UNDER_REVIEW'}
                                            className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-4 bg-yellow-600/20 hover:bg-yellow-600 border border-yellow-500/30 text-yellow-500 hover:text-white font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                                        >
                                            {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-5 h-5" />}
                                            Return to Review
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-20 text-center text-muted-foreground flex flex-col items-center gap-6">
                        <AlertTriangle className="w-16 h-16 text-yellow-500/30" />
                        <div>
                            <p className="text-xl font-bold text-foreground mb-1">Course Not Found</p>
                            <p>The course might have been deleted or the ID is invalid.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
