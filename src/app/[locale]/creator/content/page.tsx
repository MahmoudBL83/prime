'use client'
import { Upload as LucideUpload, Video as LucideVideo, BarChart3 as LucideBarChart3, Users as LucideUsers, Settings as LucideSettings, DollarSign as LucideDollarSign, TrendingUp as LucideTrendingUp, Eye as LucideEye, Clock as LucideClock, Bell as LucideBell, Play as LucidePlay, ArrowLeft as LucideArrowLeft, Home as LucideHome, Search as LucideSearch, Filter as LucideFilter, MoreVertical as LucideMoreVertical, Edit as LucideEdit, Trash2 as LucideTrash2, Copy as LucideCopy, Share2 as LucideShare2, Download as LucideDownload, Image as LucideImage, FileText as LucideFileText, Calendar as LucideCalendar, Loader2 as LucideLoader2 } from 'lucide-react'

import { useState, useEffect, lazy, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'
import { CreatorSidebar, CreatorHeader } from '@/components/creator'

// Icon Components with lazy loading
const IconComponents = {
    Upload: LucideUpload,
    Video: LucideVideo,
    BarChart3: LucideBarChart3,
    Users: LucideUsers,
    Settings: LucideSettings,
    DollarSign: LucideDollarSign,
    TrendingUp: LucideTrendingUp,
    Eye: LucideEye,
    Clock: LucideClock,
    Bell: LucideBell,
    Play: LucidePlay,
    ArrowLeft: LucideArrowLeft,
    Home: LucideHome,
    Search: LucideSearch,
    Filter: LucideFilter,
    MoreVertical: LucideMoreVertical,
    Edit: LucideEdit,
    Trash2: LucideTrash2,
    Copy: LucideCopy,
    Share2: LucideShare2,
    Download: LucideDownload,
    ImageIcon: LucideImage,
    FileText: LucideFileText,
    Calendar: LucideCalendar,
    Loader2: LucideLoader2
}

// Dynamic Icon Component
const DynamicIcon = ({ name, className, ...props }: { name: keyof typeof IconComponents; className?: string; [key: string]: any }) => {
    const IconComponent = IconComponents[name]
    
    return (
        <Suspense fallback={<div className={className} />}>
            <IconComponent className={className} {...props} />
        </Suspense>
    )
}

interface ContentItem {
    id: string
    title: string
    type: 'VIDEO' | 'IMAGE' | 'TEXT'
    thumbnail: string | null
    views: number
    likes: number
    comments: number
    status: 'PUBLISHED' | 'DRAFT' | 'SCHEDULED'
    visibility: 'PUBLIC' | 'VIP' | 'VVIP'
    publishedAt: string
    duration?: number
}

export default function CreatorContent() {
    const { data: session } = useSession()
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string
    const isArabic = locale === 'ar'

    const [content, setContent] = useState<ContentItem[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('content')
    const [filterType, setFilterType] = useState<'ALL' | 'VIDEO' | 'IMAGE' | 'TEXT'>('ALL')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        if (session?.user) {
            fetchContent()
        }
    }, [session])

    const fetchContent = async () => {
        try {
            const response = await fetch('/api/creator/content')
            if (response.ok) {
                const data = await response.json()
                setContent(data.content || [])
            } else {
                toast.error(isArabic ? 'فشل تحميل المحتوى' : 'Failed to load content')
            }
        } catch (error) {
            console.error('Failed to fetch content:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm(isArabic ? 'هل تريد حذف هذا المحتوى؟' : 'Delete this content?')) return

        try {
            const response = await fetch(`/api/creator/content/${id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم الحذف بنجاح' : 'Deleted successfully')
                fetchContent()
            }
        } catch (error) {
            toast.error(isArabic ? 'فشل الحذف' : 'Delete failed')
        }
    }

    if (!session?.user) {
        router.push(`/${locale}/login`)
        return null
    }

    const filteredContent = content.filter(item => {
        const matchesType = filterType === 'ALL' || item.type === filterType
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesType && matchesSearch
    })

    return (
        <div className="min-h-screen bg-background">
            <CreatorHeader 
                title="Content" 
                titleAr="المحتوى" 
                rightContent={
                    <Button
                        onClick={() => router.push(`/${locale}/creator/content/upload`)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                        <DynamicIcon name="Upload" className="w-4 h-4 mr-2" />
                        {isArabic ? 'إنشاء' : 'Create'}
                    </Button>
                }
            />

            <div className="flex">
                <CreatorSidebar />

                {/* Main Content */}
                <main className="flex-1 p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">
                            {isArabic ? 'محتوى القناة' : 'Channel content'}
                        </h1>
                        <p className="text-muted-foreground">
                            {isArabic ? 'إدارة جميع المحتوى الخاص بك' : 'Manage all your content'}
                        </p>
                    </div>

                    {/* Filters and Search */}
                    <div className="flex items-center justify-between mb-6 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1 min-w-[300px]">
                                <DynamicIcon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder={isArabic ? 'بحث في المحتوى...' : 'Search content...'}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1">
                                <button
                                    onClick={() => setFilterType('ALL')}
                                    className={`px-4 py-2 rounded-md transition-colors ${
                                        filterType === 'ALL' 
                                            ? 'bg-accent text-foreground font-semibold' 
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {isArabic ? 'الكل' : 'All'}
                                </button>
                                <button
                                    onClick={() => setFilterType('VIDEO')}
                                    className={`px-4 py-2 rounded-md transition-colors ${
                                        filterType === 'VIDEO' 
                                            ? 'bg-accent text-foreground font-semibold' 
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <DynamicIcon name="Video" className="w-4 h-4 inline mr-1" />
                                    {isArabic ? 'فيديو' : 'Videos'}
                                </button>
                                <button
                                    onClick={() => setFilterType('IMAGE')}
                                    className={`px-4 py-2 rounded-md transition-colors ${
                                        filterType === 'IMAGE' 
                                            ? 'bg-accent text-foreground font-semibold' 
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <DynamicIcon name="ImageIcon" className="w-4 h-4 inline mr-1" />
                                    {isArabic ? 'صور' : 'Images'}
                                </button>
                                <button
                                    onClick={() => setFilterType('TEXT')}
                                    className={`px-4 py-2 rounded-md transition-colors ${
                                        filterType === 'TEXT' 
                                            ? 'bg-accent text-foreground font-semibold' 
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <DynamicIcon name="FileText" className="w-4 h-4 inline mr-1" />
                                    {isArabic ? 'نص' : 'Text'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content Table */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        {loading ? (
                            <div className="text-center py-12 text-muted-foreground">
                                {isArabic ? 'جاري التحميل...' : 'Loading...'}
                            </div>
                        ) : filteredContent.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full mb-4">
                                    <DynamicIcon name="Video" className="w-10 h-10 text-purple-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">
                                    {isArabic ? 'لا يوجد محتوى بعد' : 'No content yet'}
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    {isArabic ? 'ابدأ بإنشاء محتوى جديد' : 'Start by creating new content'}
                                </p>
                                <Button
                                    onClick={() => router.push(`/${locale}/creator/content/upload`)}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                                >
                                    <DynamicIcon name="Upload" className="w-4 h-4 mr-2" />
                                    {isArabic ? 'إنشاء محتوى' : 'Create Content'}
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-accent/50 border-b border-border">
                                        <tr>
                                            <th className="text-left px-6 py-4 font-semibold">
                                                {isArabic ? 'المحتوى' : 'Content'}
                                            </th>
                                            <th className="text-left px-6 py-4 font-semibold">
                                                {isArabic ? 'الحالة' : 'Status'}
                                            </th>
                                            <th className="text-left px-6 py-4 font-semibold">
                                                {isArabic ? 'الرؤية' : 'Visibility'}
                                            </th>
                                            <th className="text-left px-6 py-4 font-semibold">
                                                {isArabic ? 'المشاهدات' : 'Views'}
                                            </th>
                                            <th className="text-left px-6 py-4 font-semibold">
                                                {isArabic ? 'التفاعل' : 'Engagement'}
                                            </th>
                                            <th className="text-right px-6 py-4 font-semibold">
                                                {isArabic ? 'الإجراءات' : 'Actions'}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredContent.map((item) => (
                                            <tr key={item.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                                            {item.thumbnail ? (
                                                                <Image
                                                                    src={item.thumbnail}
                                                                    alt={item.title}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    {item.type === 'VIDEO' && <DynamicIcon name="Video" className="w-8 h-8 text-muted-foreground" />}
                                                                    {item.type === 'IMAGE' && <DynamicIcon name="ImageIcon" className="w-8 h-8 text-muted-foreground" />}
                                                                    {item.type === 'TEXT' && <DynamicIcon name="FileText" className="w-8 h-8 text-muted-foreground" />}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold line-clamp-2 mb-1">
                                                                {item.title}
                                                            </h3>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <Badge variant="outline" className="text-xs">
                                                                    {item.type}
                                                                </Badge>
                                                                {item.duration && (
                                                                    <span>{Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, '0')}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge 
                                                        variant={item.status === 'PUBLISHED' ? 'default' : 'secondary'}
                                                        className={
                                                            item.status === 'PUBLISHED' 
                                                                ? 'bg-green-500/20 text-green-500 border-green-500/30'
                                                                : item.status === 'DRAFT'
                                                                ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
                                                                : 'bg-blue-500/20 text-blue-500 border-blue-500/30'
                                                        }
                                                    >
                                                        {item.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline">
                                                        {item.visibility}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <DynamicIcon name="Eye" className="w-4 h-4 text-muted-foreground" />
                                                        <span>{item.views}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                        <span>{item.likes} 👍</span>
                                                        <span>{item.comments} 💬</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => router.push(`/${locale}/creator/content/${item.id}/edit`)}
                                                            className="p-2 hover:bg-accent rounded-lg transition-colors"
                                                            title={isArabic ? 'تعديل' : 'Edit'}
                                                        >
                                                            <DynamicIcon name="Edit" className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                                                            title={isArabic ? 'حذف' : 'Delete'}
                                                        >
                                                            <DynamicIcon name="Trash2" className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
