'use client'

import { useState } from 'react'
import { BookOpen, Clock, CheckCircle, FileText, Download, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ReadingMaterial {
    id: string
    title: string
    titleAr: string
    content: string
    contentAr: string
    estimatedReadingTime: number // in minutes
    resources?: {
        title: string
        titleAr: string
        url: string
        type: 'pdf' | 'doc' | 'link' | 'video'
        description?: string
        descriptionAr?: string
    }[]
    keyPoints?: {
        text: string
        textAr: string
    }[]
}

interface ReadingMaterialProps {
    material: ReadingMaterial
    lang: 'en' | 'ar'
    onComplete: () => void
    isCompleted?: boolean
}

export default function ReadingMaterialComponent({
    material,
    lang,
    onComplete,
    isCompleted = false
}: ReadingMaterialProps) {
    const [showKeyPoints, setShowKeyPoints] = useState(false)
    const [readingProgress, setReadingProgress] = useState(0)

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const element = e.currentTarget
        const scrollTop = element.scrollTop
        const scrollHeight = element.scrollHeight - element.clientHeight
        const progress = (scrollTop / scrollHeight) * 100
        setReadingProgress(Math.min(100, Math.max(0, progress)))

        // Mark as complete when 80% read
        if (progress > 80 && !isCompleted) {
            onComplete()
        }
    }

    const getResourceIcon = (type: string) => {
        switch (type) {
            case 'pdf':
            case 'doc':
                return <FileText className="w-4 h-4" />
            case 'link':
                return <ExternalLink className="w-4 h-4" />
            case 'video':
                return <BookOpen className="w-4 h-4" />
            default:
                return <FileText className="w-4 h-4" />
        }
    }

    return (
        <div className="max-w-4xl mx-auto bg-background">
            {/* Header */}
            <div className="bg-background border-b sticky top-0 z-10 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                        <div>
                            <h1 className="text-xl font-semibold text-foreground">
                                {lang === 'en' ? material.title : material.titleAr}
                            </h1>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {material.estimatedReadingTime} {lang === 'en' ? 'min read' : 'دقيقة قراءة'}
                                </span>
                                {isCompleted && (
                                    <span className="flex items-center gap-1 text-green-600">
                                        <CheckCircle className="w-4 h-4" />
                                        {lang === 'en' ? 'Completed' : 'مكتمل'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {material.keyPoints && material.keyPoints.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowKeyPoints(!showKeyPoints)}
                        >
                            {showKeyPoints
                                ? (lang === 'en' ? 'Hide Key Points' : 'إخفاء النقاط الرئيسية')
                                : (lang === 'en' ? 'Show Key Points' : 'عرض النقاط الرئيسية')
                            }
                        </Button>
                    )}
                </div>

                {/* Reading Progress */}
                <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                            className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${readingProgress}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-6">
                {/* Main Content */}
                <div className="flex-1">
                    <div
                        className="prose prose-lg max-w-none p-6 h-[calc(100vh-200px)] overflow-y-auto text-gray-800"
                        onScroll={handleScroll}
                        style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}
                    >
                        <div
                            className="text-gray-800"
                            dangerouslySetInnerHTML={{
                                __html: lang === 'en' ? material.content : material.contentAr
                            }}
                        />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="w-80 border-l bg-background">
                    {/* Key Points */}
                    {showKeyPoints && material.keyPoints && material.keyPoints.length > 0 && (
                        <div className="p-6 border-b">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-foreground">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                {lang === 'en' ? 'Key Points' : 'النقاط الرئيسية'}
                            </h3>
                            <ul className="space-y-3">
                                {material.keyPoints.map((point, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                                        <span className="text-sm text-foreground">
                                            {lang === 'en' ? point.text : point.textAr}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Resources */}
                    {material.resources && material.resources.length > 0 && (
                        <div className="p-6">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-foreground">
                                <Download className="w-5 h-5 text-blue-600" />
                                {lang === 'en' ? 'Additional Resources' : 'مصادر إضافية'}
                            </h3>
                            <div className="space-y-3">
                                {material.resources.map((resource, index) => (
                                    <a
                                        key={index}
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block p-3 border rounded-lg hover:bg-background transition-colors group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="text-blue-600 group-hover:text-blue-700">
                                                {getResourceIcon(resource.type)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">
                                                    {lang === 'en' ? resource.title : resource.titleAr}
                                                </div>
                                                {resource.description && (
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {lang === 'en' ? resource.description : resource.descriptionAr}
                                                    </div>
                                                )}
                                                <div className="text-xs text-blue-600 mt-1 capitalize">
                                                    {resource.type}
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reading Stats */}
                    <div className="p-6 border-t">
                        <h3 className="font-semibold text-lg mb-4">
                            {lang === 'en' ? 'Reading Progress' : 'تقدم القراءة'}
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span>{lang === 'en' ? 'Progress' : 'التقدم'}</span>
                                <span>{Math.round(readingProgress)}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>{lang === 'en' ? 'Est. Time' : 'الوقت المقدر'}</span>
                                <span>{material.estimatedReadingTime} {lang === 'en' ? 'min' : 'دقيقة'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>{lang === 'en' ? 'Status' : 'الحالة'}</span>
                                <span className={isCompleted ? 'text-green-600' : 'text-yellow-600'}>
                                    {isCompleted
                                        ? (lang === 'en' ? 'Completed' : 'مكتمل')
                                        : (lang === 'en' ? 'In Progress' : 'قيد القراءة')
                                    }
                                </span>
                            </div>
                        </div>

                        {!isCompleted && readingProgress < 80 && (
                            <Button
                                onClick={onComplete}
                                variant="outline"
                                size="sm"
                                className="w-full mt-4"
                            >
                                {lang === 'en' ? 'Mark as Read' : 'اعتبر مقروء'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
