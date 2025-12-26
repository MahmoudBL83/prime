'use client'

import { useState } from 'react'
import { Upload, FileText, CheckCircle, Clock, AlertCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Assignment {
    id: string
    title: string
    titleAr: string
    description: string
    descriptionAr: string
    instructions: string
    instructionsAr: string
    dueDate?: Date
    maxPoints: number
    allowedFileTypes: string[]
    maxFileSize: number // in MB
    resources?: {
        title: string
        titleAr: string
        url: string
        type: string
    }[]
}

interface AssignmentComponentProps {
    assignment: Assignment
    lang: 'en' | 'de'
    onSubmit: (files: File[], text: string) => void
    submission?: {
        files: { name: string; url: string }[]
        text: string
        submittedAt: Date
        grade?: number
        feedback?: string
    }
}

export default function AssignmentComponent({
    assignment,
    lang,
    onSubmit,
    submission
}: AssignmentComponentProps) {
    const [files, setFiles] = useState<File[]>([])
    const [textSubmission, setTextSubmission] = useState('')
    const [dragActive, setDragActive] = useState(false)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            setFiles(prev => [...prev, ...newFiles])
        }
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files) {
            const newFiles = Array.from(e.dataTransfer.files)
            setFiles(prev => [...prev, ...newFiles])
        }
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = () => {
        onSubmit(files, textSubmission)
    }

    const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null
    const isOverdue = dueDate && new Date() > dueDate
    const daysUntilDue = dueDate
        ? Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <div className="max-w-4xl mx-auto p-6 bg-background text-foreground">
            {/* Assignment Header */}
            <div className="mb-8">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold mb-2 text-foreground">
                            {lang === 'en' ? assignment.title : assignment.titleAr}
                        </h1>
                        <p className="text-foreground">
                            {lang === 'en' ? assignment.description : assignment.descriptionAr}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-1">
                            {lang === 'en' ? 'Max Points' : 'النقاط الكاملة'}
                        </div>
                        <div className="text-lg font-semibold text-foreground">{assignment.maxPoints}</div>
                    </div>
                </div>

                {/* Due Date Status */}
                {assignment.dueDate && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${isOverdue
                        ? 'bg-red-50 text-red-700'
                        : daysUntilDue && daysUntilDue <= 3
                            ? 'bg-yellow-50 text-yellow-700'
                            : 'bg-green-50 text-green-700'
                        }`}>
                        {isOverdue ? (
                            <AlertCircle className="w-4 h-4" />
                        ) : (
                            <Clock className="w-4 h-4" />
                        )}
                        <span className="text-sm">
                            {isOverdue
                                ? (lang === 'en' ? 'Overdue' : 'متأخر')
                                : daysUntilDue === 0
                                    ? (lang === 'en' ? 'Due today' : 'مطلوب اليوم')
                                    : daysUntilDue === 1
                                        ? (lang === 'en' ? 'Due tomorrow' : 'مطلوب غداً')
                                        : (lang === 'en' ? `Due in ${daysUntilDue} days` : `مطلوب خلال ${daysUntilDue} أيام`)
                            }
                        </span>
                        <span className="text-xs opacity-75">
                            ({dueDate?.toLocaleDateString()})
                        </span>
                    </div>
                )}
            </div>

            {/* Assignment Instructions */}
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
                <h2 className="font-semibold text-lg mb-3 flex items-center gap-2 text-foreground">
                    <FileText className="w-5 h-5 text-blue-600" />
                    {lang === 'en' ? 'Instructions' : 'التعليمات'}
                </h2>
                <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-line text-foreground">
                        {lang === 'en' ? assignment.instructions : assignment.instructionsAr}
                    </p>
                </div>
            </div>

            {/* Resources */}
            {assignment.resources && assignment.resources.length > 0 && (
                <div className="mb-8">
                    <h3 className="font-semibold text-lg mb-4">
                        {lang === 'en' ? 'Resources' : 'المصادر'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {assignment.resources.map((resource, index) => (
                            <a
                                key={index}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-background transition-colors"
                            >
                                <Download className="w-5 h-5 text-blue-600" />
                                <div>
                                    <div className="font-medium">
                                        {lang === 'en' ? resource.title : resource.titleAr}
                                    </div>
                                    <div className="text-sm text-muted-foreground">{resource.type}</div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Submission Status */}
            {submission ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-green-800">
                            {lang === 'en' ? 'Assignment Submitted' : 'تم تسليم الواجب'}
                        </h3>
                    </div>
                    <p className="text-sm text-green-700 mb-4">
                        {lang === 'en' ? 'Submitted on' : 'تم التسليم في'} {submission.submittedAt.toLocaleDateString()}
                    </p>

                    {submission.files.length > 0 && (
                        <div className="mb-4">
                            <h4 className="font-medium mb-2">
                                {lang === 'en' ? 'Submitted Files:' : 'الملفات المرسلة:'}
                            </h4>
                            <ul className="space-y-1">
                                {submission.files.map((file, index) => (
                                    <li key={index} className="text-sm text-blue-600 hover:underline">
                                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                                            {file.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {submission.text && (
                        <div className="mb-4">
                            <h4 className="font-medium mb-2">
                                {lang === 'en' ? 'Text Submission:' : 'النص المرسل:'}
                            </h4>
                            <p className="text-sm bg-background p-3 rounded border">
                                {submission.text}
                            </p>
                        </div>
                    )}

                    {submission.grade !== undefined && (
                        <div className="mb-4">
                            <h4 className="font-medium mb-2">
                                {lang === 'en' ? 'Grade:' : 'الدرجة:'}
                            </h4>
                            <p className="text-lg font-semibold">
                                {submission.grade} / {assignment.maxPoints}
                            </p>
                        </div>
                    )}

                    {submission.feedback && (
                        <div>
                            <h4 className="font-medium mb-2">
                                {lang === 'en' ? 'Feedback:' : 'التعليقات:'}
                            </h4>
                            <p className="text-sm bg-background p-3 rounded border">
                                {submission.feedback}
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                /* Submission Form */
                <div className="space-y-6">
                    <h3 className="font-semibold text-lg">
                        {lang === 'en' ? 'Submit Assignment' : 'تسليم الواجب'}
                    </h3>

                    {/* File Upload */}
                    <div>
                        <label className="block font-medium mb-2">
                            {lang === 'en' ? 'Upload Files' : 'رفع الملفات'}
                        </label>
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                                ? 'border-blue-400 bg-blue-50'
                                : 'border-border hover:border-gray-400'
                                }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                            <p className="text-sm text-muted-foreground mb-2">
                                {lang === 'en'
                                    ? 'Drag and drop files here, or click to select'
                                    : 'اسحب الملفات هنا أو اضغط للاختيار'
                                }
                            </p>
                            <p className="text-xs text-muted-foreground mb-4">
                                {lang === 'en'
                                    ? `Allowed: ${assignment.allowedFileTypes.join(', ')} (Max ${assignment.maxFileSize}MB)`
                                    : `مسموح: ${assignment.allowedFileTypes.join(', ')} (حد أقصى ${assignment.maxFileSize}ميجابايت)`
                                }
                            </p>
                            <input
                                type="file"
                                multiple
                                accept={assignment.allowedFileTypes.map(type => `.${type}`).join(',')}
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload">
                                <Button variant="outline" className="cursor-pointer">
                                    {lang === 'en' ? 'Select Files' : 'اختر الملفات'}
                                </Button>
                            </label>
                        </div>

                        {/* File List */}
                        {files.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {files.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium">{file.name}</p>
                                                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeFile(index)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Text Submission */}
                    <div>
                        <label className="block font-medium mb-2">
                            {lang === 'en' ? 'Text Submission (Optional)' : 'النص (اختياري)'}
                        </label>
                        <textarea
                            value={textSubmission}
                            onChange={(e) => setTextSubmission(e.target.value)}
                            rows={6}
                            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={lang === 'en'
                                ? 'Add any additional comments or explanations...'
                                : 'أضف أي تعليقات أو توضيحات إضافية...'
                            }
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <Button
                            onClick={handleSubmit}
                            disabled={files.length === 0 && !textSubmission.trim()}
                            className="px-8"
                        >
                            {lang === 'en' ? 'Submit Assignment' : 'تسليم الواجب'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
