'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale } from 'next-intl';
import { ContentStatus } from '@prisma/client';
import { X, Play, FileText, Star, Calendar, DollarSign, Users, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

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
    const locale = useLocale();
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
            } else {
                throw new Error('Failed to update course status');
            }
        } catch (error) {
            console.error('Error updating course status:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusColor = (status: ContentStatus) => {
        switch (status) {
            case 'PUBLISHED': return 'text-green-600 bg-green-100';
            case 'UNDER_REVIEW': return 'text-yellow-600 bg-yellow-100';
            case 'REJECTED': return 'text-red-600 bg-red-100';
            case 'DRAFT': return 'text-muted-foreground bg-muted';
            default: return 'text-muted-foreground bg-muted';
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
        <div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold">
                        {locale === 'ar' ? 'تفاصيل الدورة' : locale === 'de' ? 'Kursdetails' : 'Course Details'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-card-hover rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : course ? (
                    <div className="flex flex-col h-full max-h-[80vh]">
                        {/* Course Header */}
                        <div className="p-6 border-b bg-background">
                            <div className="flex gap-6">
                                <img
                                    src={course.thumbnail || '/images/placeholder-course.jpg'}
                                    alt={course.title}
                                    className="w-32 h-20 object-cover rounded-lg"
                                />
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                                            <p className="text-muted-foreground mb-3">{course.description}</p>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(course.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : locale === 'de' ? 'de-DE' : 'en-US')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <DollarSign className="w-4 h-4" />
                                                    ${course.price}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {formatDuration(course.duration)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-4 h-4" />
                                                    {course.totalStudents} {locale === 'ar' ? 'طلاب' : locale === 'de' ? 'Studenten' : 'students'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Star className="w-4 h-4" />
                                                    {course.rating.toFixed(1)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(course.status)}`}>
                                                {course.status === 'PUBLISHED'
                                                    ? (locale === 'ar' ? 'منشور' : locale === 'de' ? 'Veröffentlicht' : 'Published')
                                                    : course.status === 'UNDER_REVIEW'
                                                        ? (locale === 'ar' ? 'قيد المراجعة' : locale === 'de' ? 'In Überprüfung' : 'Under Review')
                                                        : course.status === 'REJECTED'
                                                            ? (locale === 'ar' ? 'مرفوض' : locale === 'de' ? 'Abgelehnt' : 'Rejected')
                                                            : (locale === 'ar' ? 'مسودة' : locale === 'de' ? 'Entwurf' : 'Draft')
                                                }
                                            </span>
                                            <div className="mt-2 text-sm text-muted-foreground">
                                                {locale === 'ar' ? 'الإيرادات' : locale === 'de' ? 'Einnahmen' : 'Revenue'}: ${course.totalRevenue.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Creator Info */}
                        <div className="p-6 border-b bg-blue-50">
                            <h4 className="font-medium mb-2">
                                {locale === 'ar' ? 'معلومات المبدع' : locale === 'de' ? 'Erstellerinformationen' : 'Creator Information'}
                            </h4>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-foreground font-medium">
                                        {course.creator.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium">{course.creator.name}</p>
                                        <p className="text-sm text-muted-foreground">{course.creator.email}</p>
                                    </div>
                                    {course.creator.isVerified && (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    )}
                                </div>
                                <div className="text-right text-sm text-muted-foreground">
                                    <div>{course.creator.totalStudents} {locale === 'ar' ? 'إجمالي الطلاب' : locale === 'de' ? 'Gesamtstudenten' : 'total students'}</div>
                                    <div>${course.creator.totalEarnings.toLocaleString()} {locale === 'ar' ? 'إجمالي الأرباح' : locale === 'de' ? 'Gesamteinnahmen' : 'total earnings'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="border-b">
                            <nav className="flex">
                                {[
                                    {
                                        id: 'overview',
                                        label: locale === 'ar' ? 'نظرة عامة' : locale === 'de' ? 'Übersicht' : 'Overview'
                                    },
                                    {
                                        id: 'lessons',
                                        label: `${locale === 'ar' ? 'الدروس' : locale === 'de' ? 'Lektionen' : 'Lessons'} (${course._count.lessons})`
                                    },
                                    {
                                        id: 'reviews',
                                        label: locale === 'ar' ? 'مراجعة المحتوى' : locale === 'de' ? 'Inhaltsprüfung' : 'Content Review'
                                    }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-background p-4 rounded-lg">
                                            <h5 className="font-medium mb-2">
                                                {locale === 'ar' ? 'الفئة والمستوى' : locale === 'de' ? 'Kategorie & Niveau' : 'Category & Level'}
                                            </h5>
                                            <p className="text-sm text-muted-foreground">{course.category}</p>
                                            <p className="text-sm text-muted-foreground">{course.level}</p>
                                        </div>
                                        <div className="bg-background p-4 rounded-lg">
                                            <h5 className="font-medium mb-2">
                                                {locale === 'ar' ? 'التسجيلات' : locale === 'de' ? 'Anmeldungen' : 'Enrollments'}
                                            </h5>
                                            <p className="text-2xl font-bold text-blue-600">{course._count.enrollments}</p>
                                        </div>
                                        <div className="bg-background p-4 rounded-lg">
                                            <h5 className="font-medium mb-2">
                                                {locale === 'ar' ? 'الإيرادات' : locale === 'de' ? 'Einnahmen' : 'Revenue'}
                                            </h5>
                                            <p className="text-2xl font-bold text-green-600">${course.totalRevenue.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h5 className="font-medium mb-3">
                                            {locale === 'ar' ? 'الوصف الكامل' : locale === 'de' ? 'Vollständige Beschreibung' : 'Full Description'}
                                        </h5>
                                        <div className="bg-background p-4 rounded-lg">
                                            <p className="text-foreground whitespace-pre-wrap">{course.description}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h5 className="font-medium mb-3">
                                            {locale === 'ar' ? 'الجدول الزمني للدورة' : locale === 'de' ? 'Kurszeitplan' : 'Course Timeline'}
                                        </h5>
                                        <div className="space-y-2 text-sm text-muted-foreground">
                                            <div>
                                                {locale === 'ar' ? 'تم الإنشاء' : locale === 'de' ? 'Erstellt' : 'Created'}: {new Date(course.createdAt).toLocaleString(locale === 'ar' ? 'ar-EG' : locale === 'de' ? 'de-DE' : 'en-US')}
                                            </div>
                                            <div>
                                                {locale === 'ar' ? 'آخر تحديث' : locale === 'de' ? 'Zuletzt aktualisiert' : 'Last Updated'}: {new Date(course.updatedAt).toLocaleString(locale === 'ar' ? 'ar-EG' : locale === 'de' ? 'de-DE' : 'en-US')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'lessons' && (
                                <div className="space-y-4">
                                    {course.lessons.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            {locale === 'ar' ? 'لم يتم العثور على دروس لهذه الدورة.' : locale === 'de' ? 'Keine Lektionen für diesen Kurs gefunden.' : 'No lessons found for this course.'}
                                        </div>
                                    ) : (
                                        course.lessons.map((lesson) => (
                                            <div key={lesson.id} className="border rounded-lg p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="text-sm font-medium text-muted-foreground">#{lesson.order}</span>
                                                            <h6 className="font-medium">{lesson.title}</h6>
                                                            {lesson.isPublished ? (
                                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                            ) : (
                                                                <XCircle className="w-4 h-4 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mb-2">{lesson.description}</p>
                                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {formatDuration(lesson.duration)}
                                                            </span>
                                                            {lesson.videoUrl && (
                                                                <span className="flex items-center gap-1">
                                                                    <Play className="w-3 h-3" />
                                                                    {locale === 'ar' ? 'فيديو' : locale === 'de' ? 'Video' : 'Video'}
                                                                </span>
                                                            )}
                                                            {lesson.content && (
                                                                <span className="flex items-center gap-1">
                                                                    <FileText className="w-3 h-3" />
                                                                    {locale === 'ar' ? 'محتوى' : locale === 'de' ? 'Inhalt' : 'Content'}
                                                                </span>
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
                                <div className="space-y-6">
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                            <div>
                                                <h5 className="font-medium text-yellow-800 mb-1">
                                                    {locale === 'ar' ? 'إرشادات مراجعة المحتوى' : locale === 'de' ? 'Richtlinien zur Inhaltsprüfung' : 'Content Review Guidelines'}
                                                </h5>
                                                <ul className="text-sm text-yellow-700 space-y-1">
                                                    <li>• {locale === 'ar' ? 'تأكد من أن جميع المحتويات تعليمية ومناسبة' : locale === 'de' ? 'Stellen Sie sicher, dass alle Inhalte pädagogisch und angemessen sind' : 'Ensure all content is educational and appropriate'}</li>
                                                    <li>• {locale === 'ar' ? 'تحقق من أن الدروس تطابق وصف الدورة' : locale === 'de' ? 'Überprüfen Sie, ob die Lektionen der Kursbeschreibung entsprechen' : 'Verify that lessons match the course description'}</li>
                                                    <li>• {locale === 'ar' ? 'تحقق من جودة الفيديو المناسبة ووضوح الصوت' : locale === 'de' ? 'Überprüfen Sie die richtige Videoqualität und Audioklarheit' : 'Check for proper video quality and audio clarity'}</li>
                                                    <li>• {locale === 'ar' ? 'مراجعة أي انتهاكات لحقوق النشر' : locale === 'de' ? 'Auf Urheberrechtsverletzungen prüfen' : 'Review for any copyright violations'}</li>
                                                    <li>• {locale === 'ar' ? 'تأكد من هيكل الدورة وأهداف التعلم' : locale === 'de' ? 'Kursstruktur und Lernziele bestätigen' : 'Confirm course structure and learning objectives'}</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h5 className="font-medium mb-3">
                                            {locale === 'ar' ? 'ملاحظات المراجعة (اختياري)' : locale === 'de' ? 'Prüfnotizen (Optional)' : 'Review Notes (Optional)'}
                                        </h5>
                                        <textarea
                                            value={reviewNote}
                                            onChange={(e) => setReviewNote(e.target.value)}
                                            placeholder={locale === 'ar' ? 'أضف أي ملاحظات حول مراجعة هذه الدورة...' : locale === 'de' ? 'Fügen Sie Notizen zur Kursprüfung hinzu...' : 'Add any notes about this course review...'}
                                            className="w-full px-3 py-2 border border-border rounded-lg resize-none"
                                            rows={4}
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        {course.status !== 'PUBLISHED' && (
                                            <button
                                                onClick={() => handleStatusUpdate('PUBLISHED')}
                                                disabled={isUpdating}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-foreground rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                {locale === 'ar' ? 'الموافقة والنشر' : locale === 'de' ? 'Genehmigen & Veröffentlichen' : 'Approve & Publish'}
                                            </button>
                                        )}

                                        {course.status !== 'REJECTED' && (
                                            <button
                                                onClick={() => handleStatusUpdate('REJECTED')}
                                                disabled={isUpdating}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-foreground rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                {locale === 'ar' ? 'رفض' : locale === 'de' ? 'Ablehnen' : 'Reject'}
                                            </button>
                                        )}

                                        {course.status !== 'UNDER_REVIEW' && (
                                            <button
                                                onClick={() => handleStatusUpdate('UNDER_REVIEW')}
                                                disabled={isUpdating}
                                                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-foreground rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <AlertTriangle className="w-4 h-4" />
                                                {locale === 'ar' ? 'تعيين للمراجعة' : locale === 'de' ? 'Zur Überprüfung markieren' : 'Mark for Review'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-6 text-center text-muted-foreground">
                        Course not found
                    </div>
                )}
            </div>
        </div>
    );
}
