'use client'

import { useState, useEffect } from 'react'
import {
    FileText,
    Play,
    Edit3,
    Save,
    RefreshCw,
    Clock,
    Check,
    Loader2,
    Globe,
    ChevronDown,
    ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

interface CaptionSegment {
    start: number
    end: number
    text: string
}

interface CaptionEditorProps {
    lessonId: string
    lessonTitle?: string
    onSave?: (transcript: string) => void
    className?: string
}

export default function CaptionEditor({
    lessonId,
    lessonTitle,
    onSave,
    className = ''
}: CaptionEditorProps) {
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [saving, setSaving] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [transcriptAr, setTranscriptAr] = useState('')
    const [segments, setSegments] = useState<CaptionSegment[]>([])
    const [hasCaptions, setHasCaptions] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'de'>('en')
    const [showSegments, setShowSegments] = useState(false)
    const [editedSegments, setEditedSegments] = useState<CaptionSegment[]>([])

    // Fetch existing captions
    useEffect(() => {
        fetchCaptions()
    }, [lessonId])

    const fetchCaptions = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/videos/captions/generate?lessonId=${lessonId}`)
            if (response.ok) {
                const data = await response.json()
                setTranscript(data.transcript || '')
                setTranscriptAr(data.transcriptAr || '')
                setHasCaptions(data.hasCaptions)
                if (data.captions?.segments) {
                    setSegments(data.captions.segments)
                    setEditedSegments(data.captions.segments)
                }
            }
        } catch (error) {
            console.error('Failed to fetch captions:', error)
        } finally {
            setLoading(false)
        }
    }

    const generateCaptions = async (regenerate = false) => {
        setGenerating(true)
        try {
            const response = await fetch('/api/videos/captions/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId,
                    language: selectedLanguage === 'ar' ? 'ar' : 'auto',
                    regenerate
                })
            })

            if (response.ok) {
                const data = await response.json()
                if (selectedLanguage === 'ar') {
                    setTranscriptAr(data.captions.fullText)
                } else {
                    setTranscript(data.captions.fullText)
                }
                setSegments(data.captions.segments)
                setEditedSegments(data.captions.segments)
                setHasCaptions(true)
                toast.success('Captions generated successfully!')
            } else {
                const error = await response.json()
                toast.error(error.error || 'Failed to generate captions')
            }
        } catch (error) {
            console.error('Failed to generate captions:', error)
            toast.error('Failed to generate captions')
        } finally {
            setGenerating(false)
        }
    }

    const saveCaptions = async () => {
        setSaving(true)
        try {
            const response = await fetch('/api/videos/captions/generate', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId,
                    transcript,
                    transcriptAr,
                    segments: editedSegments
                })
            })

            if (response.ok) {
                toast.success('Captions saved successfully!')
                setIsEditing(false)
                onSave?.(transcript)
            } else {
                toast.error('Failed to save captions')
            }
        } catch (error) {
            console.error('Failed to save captions:', error)
            toast.error('Failed to save captions')
        } finally {
            setSaving(false)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const updateSegment = (index: number, text: string) => {
        const updated = [...editedSegments]
        updated[index] = { ...updated[index], text }
        setEditedSegments(updated)
    }

    if (loading) {
        return (
            <div className={`p-4 bg-gray-800/50 rounded-xl animate-pulse ${className}`}>
                <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-32 bg-gray-700 rounded"></div>
            </div>
        )
    }

    return (
        <div className={`bg-gray-800/50 rounded-xl border border-gray-700 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-purple-400" />
                    <div>
                        <h3 className="font-semibold text-white">Auto-Captions</h3>
                        {lessonTitle && (
                            <p className="text-sm text-gray-400">{lessonTitle}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Language Selector */}
                    <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
                        <button
                            onClick={() => setSelectedLanguage('en')}
                            className={`px-3 py-1 rounded text-sm ${selectedLanguage === 'en'
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            English
                        </button>
                        <button
                            onClick={() => setSelectedLanguage('ar')}
                            className={`px-3 py-1 rounded text-sm ${selectedLanguage === 'ar'
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            العربية
                        </button>
                    </div>

                    {hasCaptions ? (
                        <span className="flex items-center gap-1 text-green-400 text-sm">
                            <Check className="w-4 h-4" />
                            Generated
                        </span>
                    ) : null}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {!hasCaptions ? (
                    /* No Captions - Generate prompt */
                    <div className="text-center py-8">
                        <Globe className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-white mb-2">
                            No Captions Yet
                        </h4>
                        <p className="text-gray-400 mb-4">
                            Generate automatic captions for this video using AI
                        </p>
                        <Button
                            onClick={() => generateCaptions(false)}
                            disabled={generating}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {generating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Generate Captions
                                </>
                            )}
                        </Button>
                    </div>
                ) : (
                    /* Has Captions - Show editor */
                    <div className="space-y-4">
                        {/* Full Transcript View/Edit */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-300">
                                    Full Transcript ({selectedLanguage === 'ar' ? 'Arabic' : 'English'})
                                </label>
                                {!isEditing ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        <Edit3 className="w-4 h-4 mr-1" />
                                        Edit
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsEditing(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={saveCaptions}
                                            disabled={saving}
                                        >
                                            {saving ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4 mr-1" />
                                            )}
                                            Save
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {isEditing ? (
                                <textarea
                                    value={selectedLanguage === 'ar' ? transcriptAr : transcript}
                                    onChange={(e) =>
                                        selectedLanguage === 'ar'
                                            ? setTranscriptAr(e.target.value)
                                            : setTranscript(e.target.value)
                                    }
                                    dir={selectedLanguage === 'ar' ? 'rtl' : 'ltr'}
                                    className="w-full h-40 p-3 bg-gray-900 border border-gray-600 rounded-lg text-white resize-y focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            ) : (
                                <div
                                    className="p-3 bg-gray-900/50 rounded-lg text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto"
                                    dir={selectedLanguage === 'ar' ? 'rtl' : 'ltr'}
                                >
                                    {selectedLanguage === 'ar' ? transcriptAr : transcript}
                                </div>
                            )}
                        </div>

                        {/* Segment Editor (collapsible) */}
                        {segments.length > 0 && (
                            <div className="border-t border-gray-700 pt-4">
                                <button
                                    onClick={() => setShowSegments(!showSegments)}
                                    className="flex items-center gap-2 text-gray-300 hover:text-white"
                                >
                                    {showSegments ? (
                                        <ChevronUp className="w-4 h-4" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4" />
                                    )}
                                    <span className="text-sm font-medium">
                                        Timed Segments ({segments.length})
                                    </span>
                                </button>

                                {showSegments && (
                                    <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                                        {editedSegments.map((segment, index) => (
                                            <div
                                                key={index}
                                                className="flex items-start gap-3 p-2 bg-gray-900/50 rounded-lg"
                                            >
                                                <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap pt-2">
                                                    <Clock className="w-3 h-3" />
                                                    {formatTime(segment.start)} - {formatTime(segment.end)}
                                                </div>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={segment.text}
                                                        onChange={(e) => updateSegment(index, e.target.value)}
                                                        className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                                                    />
                                                ) : (
                                                    <span className="flex-1 text-sm text-gray-300">
                                                        {segment.text}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Regenerate Button */}
                        <div className="flex justify-end pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generateCaptions(true)}
                                disabled={generating}
                            >
                                {generating ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-4 h-4 mr-1" />
                                )}
                                Regenerate
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
