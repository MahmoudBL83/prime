'use client'

import { useState } from 'react'

interface Resource {
    id: string
    title: string
    titleAr: string
    type: 'pdf' | 'doc' | 'ppt' | 'xls' | 'link' | 'video' | 'audio' | 'image'
    url: string
    size?: string
    description?: string
    descriptionAr?: string
}

interface Objective {
    id: string
    text: string
    textAr: string
}

interface RelatedLesson {
    id: string
    title: string
    titleAr: string
    moduleId: string
    order: number
}

interface LessonContentProps {
    lessonId: string
    title: string
    titleAr: string
    description?: string
    descriptionAr?: string
    objectives?: Objective[]
    resources?: Resource[]
    transcript?: string
    transcriptAr?: string
    relatedLessons?: RelatedLesson[]
    lang?: 'en' | 'de'
    onRelatedLessonClick?: (lessonId: string) => void
}

export default function LessonContent({
    lessonId,
    title,
    titleAr,
    description,
    descriptionAr,
    objectives = [],
    resources = [],
    transcript,
    transcriptAr,
    relatedLessons = [],
    lang = 'en',
    onRelatedLessonClick
}: LessonContentProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'transcript' | 'related'>('overview')
    const [showFullTranscript, setShowFullTranscript] = useState(false)

    // Translation helper
    const t = {
        en: {
            overview: 'Overview',
            resources: 'Resources',
            transcript: 'Transcript',
            related: 'Related',
            learningObjectives: 'Learning Objectives',
            views: 'Views',
            duration: 'Duration',
            students: 'Students',
            discussionPractice: 'Discussion & Practice',
            comingSoon: 'Coming soon: Participate in discussions and complete interactive exercises',
            lessonResources: 'Lesson Resources',
            download: 'Download',
            videoTranscript: 'Video Transcript',
            showLess: 'Show Less',
            readMore: 'Read More',
            transcriptNote: 'Note: Transcript may not be 100% accurate. Auto-generated.',
            relatedLessons: 'Related Lessons',
            lesson: 'Lesson'
        },
        de: {
            overview: 'Übersicht',
            resources: 'Ressourcen',
            transcript: 'Transkript',
            related: 'Ähnlich',
            learningObjectives: 'Lernziele',
            views: 'Aufrufe',
            duration: 'Dauer',
            students: 'Studenten',
            discussionPractice: 'Diskussion & Übung',
            comingSoon: 'In Kürze: Nehmen Sie an Diskussionen teil und absolvieren Sie interaktive Übungen',
            lessonResources: 'Lektionsressourcen',
            download: 'Herunterladen',
            videoTranscript: 'Video-Transkript',
            showLess: 'Weniger anzeigen',
            readMore: 'Mehr lesen',
            transcriptNote: 'Hinweis: Das Transkript ist möglicherweise nicht 100% genau. Automatisch generiert.',
            relatedLessons: 'Ähnliche Lektionen',
            lesson: 'Lektion'
        }
    }
    const currentT = t[lang]
    const currentTitle = title
    const currentDescription = description

    const getResourceIcon = (type: string) => {
        switch (type) {
            case 'pdf':
                return (
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V9z" clipRule="evenodd" />
                    </svg>
                )
            case 'doc':
                return (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm3 6a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                )
            case 'ppt':
                return (
                    <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 10-2 0v1H7a1 1 0 100 2h2v1a1 1 0 102 0v-1h2a1 1 0 100-2h-2V9z" clipRule="evenodd" />
                    </svg>
                )
            case 'xls':
                return (
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V9z" clipRule="evenodd" />
                    </svg>
                )
            case 'link':
                return (
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                    </svg>
                )
            case 'video':
                return (
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                )
            case 'audio':
                return (
                    <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                )
            case 'image':
                return (
                    <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                )
            default:
                return (
                    <svg className="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V9z" clipRule="evenodd" />
                    </svg>
                )
        }
    }

    const formatFileSize = (bytes?: string) => {
        if (!bytes) return ''
        // Simple formatting - in a real app, you'd parse the bytes properly
        return bytes
    }

    const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text
        return text.substring(0, maxLength) + '...'
    }

    const currentTranscript = transcript
    const truncatedTranscript = currentTranscript ? truncateText(currentTranscript, 300) : ''

    return (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
            {/* Lesson Title */}
            <h2 className="text-2xl font-bold mb-4 text-[var(--foreground)]">
                {currentTitle}
            </h2>

            {/* Lesson Description */}
            {currentDescription && (
                <p className="text-[var(--muted-foreground)] mb-6 leading-relaxed">
                    {currentDescription}
                </p>
            )}

            {/* Tabs */}
            <div className="border-b border-[var(--border)] mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'overview'
                            ? 'border-[var(--accent)] text-[var(--accent)]'
                            : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border)]'
                            }`}
                    >
                        {currentT.overview}
                    </button>
                    {resources.length > 0 && (
                        <button
                            onClick={() => setActiveTab('resources')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'resources'
                                ? 'border-[var(--accent)] text-[var(--accent)]'
                                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border)]'
                                }`}
                        >
                            {currentT.resources} ({resources.length})
                        </button>
                    )}
                    {currentTranscript && (
                        <button
                            onClick={() => setActiveTab('transcript')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'transcript'
                                ? 'border-[var(--accent)] text-[var(--accent)]'
                                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border)]'
                                }`}
                        >
                            {currentT.transcript}
                        </button>
                    )}
                    {relatedLessons.length > 0 && (
                        <button
                            onClick={() => setActiveTab('related')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'related'
                                ? 'border-[var(--accent)] text-[var(--accent)]'
                                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border)]'
                                }`}
                        >
                            {currentT.related}
                        </button>
                    )}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Learning Objectives */}
                        {objectives.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-3 text-[var(--foreground)]">
                                    {currentT.learningObjectives}
                                </h3>
                                <div className="space-y-2">
                                    {objectives.map((objective) => (
                                        <div key={objective.id} className="flex items-start space-x-3">
                                            <div className="flex-shrink-0 mt-1">
                                                <svg className="w-5 h-5 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <p className="text-[var(--foreground)]">
                                                {objective.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-[var(--secondary)] rounded-lg p-4">
                                <div className="flex items-center space-x-3">
                                    <div className="flex-shrink-0">
                                        <svg className="w-8 h-8 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-[var(--muted-foreground)]">
                                            {currentT.views}
                                        </p>
                                        <p className="text-lg font-semibold text-[var(--foreground)]">
                                            1,234
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[var(--secondary)] rounded-lg p-4">
                                <div className="flex items-center space-x-3">
                                    <div className="flex-shrink-0">
                                        <svg className="w-8 h-8 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-[var(--muted-foreground)]">
                                            {currentT.duration}
                                        </p>
                                        <p className="text-lg font-semibold text-[var(--foreground)]">
                                            15:30
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[var(--secondary)] rounded-lg p-4">
                                <div className="flex items-center space-x-3">
                                    <div className="flex-shrink-0">
                                        <svg className="w-8 h-8 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-[var(--muted-foreground)]">
                                            {currentT.students}
                                        </p>
                                        <p className="text-lg font-semibold text-[var(--foreground)]">
                                            856
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Placeholder for future features */}
                        <div className="bg-[var(--secondary)] border-2 border-dashed border-[var(--border)] rounded-lg p-8 text-center">
                            <svg className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <h4 className="text-lg font-medium text-[var(--foreground)] mb-2">
                                {currentT.discussionPractice}
                            </h4>
                            <p className="text-[var(--muted-foreground)]">
                                {currentT.comingSoon}
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'resources' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold mb-4 text-[var(--foreground)]">
                            {currentT.lessonResources}
                        </h3>
                        {resources.map((resource) => (
                            <div
                                key={resource.id}
                                className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg hover:bg-[var(--secondary)] transition-colors"
                            >
                                <div className="flex items-center space-x-4">
                                    {getResourceIcon(resource.type)}
                                    <div>
                                        <h4 className="font-medium text-[var(--foreground)]">
                                            {resource.title}
                                        </h4>
                                        {(resource.description || resource.descriptionAr) && (
                                            <p className="text-sm text-[var(--muted-foreground)]">
                                                {resource.description}
                                            </p>
                                        )}
                                        {resource.size && (
                                            <p className="text-xs text-[var(--muted-foreground)] mt-1">
                                                {formatFileSize(resource.size)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-foreground)] rounded-lg hover:bg-[var(--primary)] transition-colors text-sm font-medium"
                                >
                                    {currentT.download}
                                </a>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'transcript' && currentTranscript && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold mb-4 text-[var(--foreground)]">
                            {currentT.videoTranscript}
                        </h3>
                        <div className="bg-[var(--secondary)] rounded-lg p-4">
                            <p className="text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                                {showFullTranscript ? currentTranscript : truncatedTranscript}
                            </p>
                            {currentTranscript.length > 300 && (
                                <button
                                    onClick={() => setShowFullTranscript(!showFullTranscript)}
                                    className="mt-4 text-[var(--accent)] hover:text-[var(--primary)] transition-colors font-medium"
                                >
                                    {showFullTranscript
                                        ? currentT.showLess
                                        : currentT.readMore
                                    }
                                </button>
                            )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-[var(--muted-foreground)]">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span>
                                {currentT.transcriptNote}
                            </span>
                        </div>
                    </div>
                )}

                {activeTab === 'related' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold mb-4 text-[var(--foreground)]">
                            {currentT.relatedLessons}
                        </h3>
                        <div className="grid gap-4">
                            {relatedLessons.map((relatedLesson) => (
                                <div
                                    key={relatedLesson.id}
                                    onClick={() => onRelatedLessonClick?.(relatedLesson.id)}
                                    className="p-4 border border-[var(--border)] rounded-lg hover:bg-[var(--secondary)] transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <span className="w-8 h-8 bg-[var(--muted)] rounded-full flex items-center justify-center text-sm font-medium text-[var(--foreground)]">
                                                {relatedLesson.order + 1}
                                            </span>
                                            <div>
                                                <h4 className="font-medium text-[var(--foreground)]">
                                                    {relatedLesson.title}
                                                </h4>
                                                <p className="text-sm text-[var(--muted-foreground)]">
                                                    {currentT.lesson} {relatedLesson.order + 1}
                                                </p>
                                            </div>
                                        </div>
                                        <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
