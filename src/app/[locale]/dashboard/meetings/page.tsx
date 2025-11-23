'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useLocale } from 'next-intl'
import {
    Calendar,
    Clock,
    DollarSign,
    Users,
    MoreVertical,
    ExternalLink,
    MessageSquare,
    XCircle,
    CheckCircle,
    AlertCircle,
    Video,
    Award,
    TrendingUp,
    Star,
    ArrowLeft,
    ChevronLeft,
    Home
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNavigationLoading } from '@/hooks/useNavigationLoading'

interface Meeting {
    id: string
    title: string
    description?: string
    scheduledAt: string
    duration: number
    meetingType: string
    status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
    price?: number
    meetingLink?: string
    notes?: string
    cancelReason?: string
    createdAt: string
    updatedAt: string
    student: {
        id: string
        name: string
        arabicName?: string
        email: string
        phone?: string
    }
    creator: {
        id: string
        user: {
            id: string
            name: string
            arabicName?: string
            email: string
        }
    }
}

export default function MeetingsPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const locale = useLocale()
    const { navigateWithLoading, isLoading } = useNavigationLoading()
    const [meetings, setMeetings] = useState<Meeting[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('all')
    
    const isArabic = locale === 'ar'
    const dir = isArabic ? 'rtl' : 'ltr'

    useEffect(() => {
        if (session?.user) {
            loadMeetings()
        }
    }, [session])

    const loadMeetings = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/meetings?role=learner')
            if (response.ok) {
                const data = await response.json()
                setMeetings(data.meetings || [])
            }
        } catch (error) {
            console.error('Failed to load meetings:', error)
            toast.error('فشل في تحميل الاجتماعات')
        } finally {
            setLoading(false)
        }
    }

    const getMeetingStatusText = (status: Meeting['status']) => {
        if (isArabic) {
            switch (status) {
                case 'SCHEDULED': return 'مجدول'
                case 'CONFIRMED': return 'مؤكد'
                case 'IN_PROGRESS': return 'جاري'
                case 'COMPLETED': return 'مكتمل'
                case 'CANCELLED': return 'ملغي'
                case 'NO_SHOW': return 'غياب'
                default: return status
            }
        } else {
            switch (status) {
                case 'SCHEDULED': return 'Scheduled'
                case 'CONFIRMED': return 'Confirmed'
                case 'IN_PROGRESS': return 'In Progress'
                case 'COMPLETED': return 'Completed'
                case 'CANCELLED': return 'Cancelled'
                case 'NO_SHOW': return 'No Show'
                default: return status
            }
        }
    }

    const getMeetingStatusColor = (status: Meeting['status']) => {
        switch (status) {
            case 'SCHEDULED': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
            case 'CONFIRMED': return 'bg-green-500/20 text-green-300 border-green-500/30'
            case 'IN_PROGRESS': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
            case 'COMPLETED': return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
            case 'CANCELLED': return 'bg-red-500/20 text-red-300 border-red-500/30'
            case 'NO_SHOW': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
            default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
        }
    }

    const getMeetingTypeText = (type: string) => {
        if (isArabic) {
            switch (type) {
                case 'CONSULTATION': return 'استشارة عامة'
                case 'COURSE_HELP': return 'مساعدة في الدورة'
                case 'CAREER_ADVICE': return 'إرشاد مهني'
                case 'CODE_REVIEW': return 'مراجعة كود'
                case 'MOCK_INTERVIEW': return 'مقابلة تجريبية'
                case 'MENTORSHIP': return 'إرشاد'
                default: return type
            }
        } else {
            switch (type) {
                case 'CONSULTATION': return 'General Consultation'
                case 'COURSE_HELP': return 'Course Help'
                case 'CAREER_ADVICE': return 'Career Advice'
                case 'CODE_REVIEW': return 'Code Review'
                case 'MOCK_INTERVIEW': return 'Mock Interview'
                case 'MENTORSHIP': return 'Mentorship'
                default: return type
            }
        }
    }

    const handleMeetingAction = async (meetingId: string, action: string, data?: any) => {
        try {
            const response = await fetch(`/api/meetings/${meetingId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })

            if (response.ok) {
                toast.success('تم تحديث الاجتماع بنجاح')
                loadMeetings() // Reload meetings
            } else {
                toast.error('فشل في تحديث الاجتماع')
            }
        } catch (error) {
            console.error('Meeting action error:', error)
            toast.error('حدث خطأ في تحديث الاجتماع')
        }
    }

    const filterMeetings = (status?: string) => {
        if (!status || status === 'all') return meetings
        
        const now = new Date()
        
        switch (status) {
            case 'upcoming':
                return meetings.filter(m => 
                    new Date(m.scheduledAt) > now && 
                    (m.status === 'SCHEDULED' || m.status === 'CONFIRMED')
                )
            case 'completed':
                return meetings.filter(m => m.status === 'COMPLETED')
            case 'cancelled':
                return meetings.filter(m => m.status === 'CANCELLED' || m.status === 'NO_SHOW')
            default:
                return meetings
        }
    }

    const renderMeetingCard = (meeting: Meeting) => {
        const instructorName = isArabic && meeting.creator.user.arabicName 
            ? meeting.creator.user.arabicName 
            : meeting.creator.user.name

        const formatDate = (dateStr: string) => {
            return new Date(dateStr).toLocaleDateString(
                isArabic ? 'ar-EG' : 'en-US',
                {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }
            )
        }

        const formatTime = (dateStr: string) => {
            return new Date(dateStr).toLocaleTimeString(
                isArabic ? 'ar-EG' : 'en-US',
                { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }
            )
        }

        return (
            <div key={meeting.id} className="group relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-3xl border border-gray-700/50 overflow-hidden hover:border-purple-400/60 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 mb-6">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 rounded-full blur-2xl"></div>
                
                <div className="relative p-8">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <h3 className="font-bold text-xl text-white group-hover:text-purple-200 transition-colors">
                                    {meeting.title}
                                </h3>
                                <Badge className={`${getMeetingStatusColor(meeting.status)} border`}>
                                    {getMeetingStatusText(meeting.status)}
                                </Badge>
                            </div>
                            {meeting.description && (
                                <p className="text-gray-300 mb-4 leading-relaxed group-hover:text-gray-200 transition-colors">
                                    {meeting.description}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    {/* Meeting Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">{isArabic ? 'المدرب' : 'Instructor'}</p>
                                    <p className="font-semibold text-white">{instructorName}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">{isArabic ? 'التاريخ' : 'Date'}</p>
                                    <p className="font-semibold text-white">{formatDate(meeting.scheduledAt)}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">{isArabic ? 'الوقت والمدة' : 'Time & Duration'}</p>
                                    <p className="font-semibold text-white">
                                        {formatTime(meeting.scheduledAt)} • {meeting.duration} {isArabic ? 'دقيقة' : 'min'}
                                    </p>
                                </div>
                            </div>
                            
                            {meeting.price && (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                                        <DollarSign className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm">{isArabic ? 'السعر' : 'Price'}</p>
                                        <p className="font-semibold text-white">{meeting.price} {isArabic ? 'ج.م' : 'EGP'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Meeting Type and Actions */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="inline-flex items-center gap-2 bg-gray-700/50 backdrop-blur-sm border border-gray-600/50 rounded-full px-4 py-2">
                            <Award className="w-4 h-4 text-blue-400" />
                            <span className="text-blue-300 text-sm font-medium">
                                {getMeetingTypeText(meeting.meetingType)}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {meeting.status === 'CONFIRMED' && meeting.meetingLink && (
                                <Button 
                                    onClick={() => window.open(meeting.meetingLink, '_blank')}
                                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    <Video className="w-4 h-4 mr-2" />
                                    {isArabic ? 'دخول الاجتماع' : 'Join Meeting'}
                                </Button>
                            )}
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-xl"
                                    >
                                        <MoreVertical className="w-5 h-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent 
                                    align="end" 
                                    className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-xl"
                                >
                                    {meeting.status === 'SCHEDULED' && (
                                        <DropdownMenuItem 
                                            onClick={() => handleMeetingAction(meeting.id, 'cancel', { 
                                                status: 'CANCELLED', 
                                                cancelReason: isArabic ? 'تم الإلغاء من قبل الطالب' : 'Cancelled by student' 
                                            })}
                                            className="text-red-300 hover:text-red-200 hover:bg-red-500/20"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            {isArabic ? 'إلغاء الحجز' : 'Cancel Booking'}
                                        </DropdownMenuItem>
                                    )}
                                    
                                    <DropdownMenuItem 
                                        onClick={() => navigateWithLoading(`/${locale}/messaging?contact=${meeting.creator.user.id}`, 'message-instructor')}
                                        className="text-blue-300 hover:text-blue-200 hover:bg-blue-500/20"
                                        disabled={isLoading('message-instructor')}
                                    >
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        {isArabic ? 'مراسلة المدرب' : 'Message Instructor'}
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuItem 
                                        onClick={() => navigateWithLoading(`/${locale}/instructors/${meeting.creator.id}`, 'instructor-profile')}
                                        className="text-purple-300 hover:text-purple-200 hover:bg-purple-500/20"
                                        disabled={isLoading('instructor-profile')}
                                    >
                                        <Users className="w-4 h-4 mr-2" />
                                        {isArabic ? 'ملف المدرب' : 'Instructor Profile'}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    
                    {/* Additional Information */}
                    {meeting.cancelReason && (
                        <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-2xl p-4 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-5 h-5 text-red-400" />
                                <span className="text-red-300 font-semibold">
                                    {isArabic ? 'سبب الإلغاء:' : 'Cancellation Reason:'}
                                </span>
                            </div>
                            <p className="text-red-200">{meeting.cancelReason}</p>
                        </div>
                    )}
                    
                    {meeting.notes && (
                        <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-5 h-5 text-blue-400" />
                                <span className="text-blue-300 font-semibold">
                                    {isArabic ? 'ملاحظات المدرب:' : 'Instructor Notes:'}
                                </span>
                            </div>
                            <p className="text-blue-200">{meeting.notes}</p>
                        </div>
                    )}
                </div>
                
                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"></div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center" dir={dir}>
                <div className="text-center">
                    <div className="relative">
                        {/* Decorative loading elements */}
                        <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/30 rounded-full animate-ping"></div>
                        <div className="w-16 h-16 border-4 border-purple-500/50 border-t-purple-400 rounded-full animate-spin mx-auto mb-6"></div>
                    </div>
                    <p className="text-purple-200 text-lg font-medium">
                        {isArabic ? 'جاري تحميل الاجتماعات...' : 'Loading meetings...'}
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                        {isArabic ? 'الرجاء الانتظار' : 'Please wait'}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900" dir={dir}>
            {/* Background Elements */}
            <div className="absolute inset-0">
                <div className="absolute top-20 left-20 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative max-w-6xl mx-auto py-8 px-6">
                {/* Header */}
                <div className="relative bg-gradient-to-br from-gray-900 via-purple-900/30 to-blue-900/30 rounded-3xl p-8 mb-8 border border-gray-700/50 backdrop-blur-sm">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10 flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigateWithLoading(`/${locale}/dashboard`, 'back-dashboard')}
                                disabled={isLoading('back-dashboard')}
                                className="text-purple-300 hover:text-purple-200 hover:bg-purple-500/20"
                            >
                                {isLoading('back-dashboard') ? (
                                    <div className="w-4 h-4 border-2 border-purple-300/30 border-t-purple-400 rounded-full animate-spin mr-2"></div>
                                ) : (
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                )}
                                {isArabic ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
                            </Button>
                            
                            <div>
                                <div className="inline-flex items-center gap-2 bg-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-full px-4 py-2 mb-4">
                                    <Calendar className="w-4 h-4 text-purple-400" />
                                    <span className="text-purple-200 font-medium text-sm">
                                        {isArabic ? 'إدارة الاجتماعات' : 'Meeting Management'}
                                    </span>
                                </div>
                                
                                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-3">
                                    {isArabic ? 'اجتماعاتي' : 'My Meetings'}
                                </h1>
                                <p className="text-purple-100/80 text-lg">
                                    {isArabic 
                                        ? 'عرض وإدارة جلساتك المحجوزة مع المدربين المتخصصين' 
                                        : 'View and manage your booked sessions with expert instructors'
                                    }
                                </p>
                            </div>
                        </div>
                        
                        <Button
                            onClick={() => navigateWithLoading(`/${locale}/instructors`, 'browse-instructors')}
                            disabled={isLoading('browse-instructors')}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            {isLoading('browse-instructors') && (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                            )}
                            {isArabic ? 'حجز جلسة جديدة' : 'Book New Session'}
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-6 hover:border-blue-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-2xl"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    {filterMeetings('upcoming').length}
                                </div>
                            </div>
                            <div className="text-sm text-blue-300 font-medium">
                                {isArabic ? 'اجتماعات قادمة' : 'Upcoming'}
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-6 hover:border-green-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/20">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full blur-2xl"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    {filterMeetings('completed').length}
                                </div>
                            </div>
                            <div className="text-sm text-green-300 font-medium">
                                {isArabic ? 'اجتماعات مكتملة' : 'Completed'}
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-6 hover:border-red-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/20">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full blur-2xl"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                                    <XCircle className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    {filterMeetings('cancelled').length}
                                </div>
                            </div>
                            <div className="text-sm text-red-300 font-medium">
                                {isArabic ? 'اجتماعات ملغية' : 'Cancelled'}
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-6 hover:border-purple-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-full blur-2xl"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    {meetings.length}
                                </div>
                            </div>
                            <div className="text-sm text-purple-300 font-medium">
                                {isArabic ? 'إجمالي الاجتماعات' : 'Total Meetings'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Meetings Tabs */}
                <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-3xl border border-gray-700/50 overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10 p-8">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                            <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-1">
                                <TabsList className="grid w-full grid-cols-4 bg-transparent gap-1">
                                    <TabsTrigger 
                                        value="all" 
                                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-300 rounded-xl"
                                    >
                                        {isArabic ? 'الكل' : 'All'}
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="upcoming"
                                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-300 rounded-xl"
                                    >
                                        {isArabic ? 'القادمة' : 'Upcoming'}
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="completed"
                                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-300 rounded-xl"
                                    >
                                        {isArabic ? 'المكتملة' : 'Completed'}
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="cancelled"
                                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-300 rounded-xl"
                                    >
                                        {isArabic ? 'الملغية' : 'Cancelled'}
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="all">
                                {meetings.length > 0 ? (
                                    <div className="space-y-6">
                                        {meetings.map(renderMeetingCard)}
                                    </div>
                                ) : (
                                    <div className="relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-12 text-center">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
                                        <div className="relative z-10">
                                            <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-blue-600/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                                <Calendar className="w-10 h-10 text-purple-400" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-3">
                                                {isArabic ? 'لا توجد اجتماعات' : 'No meetings yet'}
                                            </h3>
                                            <p className="text-gray-400 mb-6 leading-relaxed">
                                                {isArabic 
                                                    ? 'لم تحجز أي جلسات بعد. ابدأ بحجز جلسة مع أحد مدربينا المميزين.' 
                                                    : 'You haven\'t booked any sessions yet. Start by booking a session with one of our expert instructors.'
                                                }
                                            </p>
                                            <Button 
                                                onClick={() => navigateWithLoading(`/${locale}/instructors`, 'browse-instructors')}
                                                disabled={isLoading('browse-instructors')}
                                                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                                            >
                                                {isLoading('browse-instructors') && (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                                )}
                                                {isArabic ? 'تصفح المدربين' : 'Browse Instructors'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="upcoming">
                                <div className="space-y-6">
                                    {filterMeetings('upcoming').map(renderMeetingCard)}
                                    {filterMeetings('upcoming').length === 0 && (
                                        <div className="relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-12 text-center">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl"></div>
                                            <div className="relative z-10">
                                                <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                                    <TrendingUp className="w-10 h-10 text-blue-400" />
                                                </div>
                                                <h3 className="text-xl font-bold text-white mb-3">
                                                    {isArabic ? 'لا توجد اجتماعات قادمة' : 'No upcoming meetings'}
                                                </h3>
                                                <p className="text-gray-400 leading-relaxed">
                                                    {isArabic ? 'جميع اجتماعاتك المجدولة ستظهر هنا.' : 'All your scheduled meetings will appear here.'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="completed">
                                <div className="space-y-6">
                                    {filterMeetings('completed').map(renderMeetingCard)}
                                    {filterMeetings('completed').length === 0 && (
                                        <div className="relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-12 text-center">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-3xl"></div>
                                            <div className="relative z-10">
                                                <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                                    <CheckCircle className="w-10 h-10 text-green-400" />
                                                </div>
                                                <h3 className="text-xl font-bold text-white mb-3">
                                                    {isArabic ? 'لا توجد اجتماعات مكتملة' : 'No completed meetings'}
                                                </h3>
                                                <p className="text-gray-400 leading-relaxed">
                                                    {isArabic ? 'الاجتماعات التي تمت ستظهر هنا.' : 'Completed meetings will appear here.'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="cancelled">
                                <div className="space-y-6">
                                    {filterMeetings('cancelled').map(renderMeetingCard)}
                                    {filterMeetings('cancelled').length === 0 && (
                                        <div className="relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-12 text-center">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
                                            <div className="relative z-10">
                                                <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-pink-600/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                                    <XCircle className="w-10 h-10 text-red-400" />
                                                </div>
                                                <h3 className="text-xl font-bold text-white mb-3">
                                                    {isArabic ? 'لا توجد اجتماعات ملغية' : 'No cancelled meetings'}
                                                </h3>
                                                <p className="text-gray-400 leading-relaxed">
                                                    {isArabic ? 'الاجتماعات الملغية ستظهر هنا.' : 'Cancelled meetings will appear here.'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    )
}