'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  FileText,
  Link as LinkIcon,
  Video,
  Image as ImageIcon,
  File,
  Plus,
  Pin,
  Trash2,
  Edit,
  Target,
  PlayCircle,
  ArrowLeft,
  Upload,
  StickyNote,
  Check,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Workspace {
  id: string
  name: string
  description?: string
  resources: WorkspaceResource[]
  notes: WorkspaceNote[]
  goals: WorkspaceGoal[]
  coWatchSessions: CoWatchSession[]
}

interface WorkspaceResource {
  id: string
  title: string
  description?: string
  type: string
  url: string
  isPinned: boolean
  uploader: {
    id: string
    name: string
  }
  createdAt: string
}

interface WorkspaceNote {
  id: string
  title: string
  content: string
  color?: string
  isPinned: boolean
  creator: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

interface WorkspaceGoal {
  id: string
  title: string
  description?: string
  status: string
  progress: number
  targetDate?: string
  priority?: string
  creator: {
    id: string
    name: string
  }
  createdAt: string
}

interface CoWatchSession {
  id: string
  videoTitle: string
  videoUrl: string
  currentTime: number
  isPlaying: boolean
  status: string
}

export default function WorkspacePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const locale = params.locale as string || 'en'
  const isArabic = locale === 'ar'
  const matchId = searchParams.get('matchId')

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'resources' | 'notes' | 'goals' | 'cowatch'>('resources')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/auth/login`)
      return
    }

    if (status === 'authenticated' && matchId) {
      fetchWorkspace()
    }
  }, [status, matchId, router, locale])

  const fetchWorkspace = async () => {
    try {
      const response = await fetch(`/api/study-buddy/workspace?matchId=${matchId}`)
      if (response.ok) {
        const data = await response.json()
        setWorkspace(data.workspace)
      } else {
        toast.error(isArabic ? 'فشل تحميل مساحة العمل' : 'Failed to load workspace')
      }
    } catch (error) {
      console.error('Error fetching workspace:', error)
      toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getResourceIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PDF':
      case 'DOCUMENT':
        return <FileText className="w-5 h-5" />
      case 'LINK':
        return <LinkIcon className="w-5 h-5" />
      case 'VIDEO':
        return <Video className="w-5 h-5" />
      case 'IMAGE':
        return <ImageIcon className="w-5 h-5" />
      default:
        return <File className="w-5 h-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/20 text-green-300 border-green-400/30'
      case 'IN_PROGRESS':
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30'
      case 'NOT_STARTED':
        return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
      case 'PAUSED':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-6 text-xl text-purple-200">
            {isArabic ? 'جار تحميل مساحة العمل...' : 'Loading workspace...'}
          </p>
        </div>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <Card className="bg-gray-800/80 backdrop-blur-md border-gray-700/50 p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">
            {isArabic ? 'مساحة العمل غير موجودة' : 'Workspace Not Found'}
          </h2>
          <p className="text-gray-300 mb-6">
            {isArabic 
              ? 'لم نتمكن من العثور على مساحة العمل المطلوبة'
              : 'We couldn\'t find the requested workspace'}
          </p>
          <Link href={`/${locale}/study-buddy/matches`}>
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isArabic ? 'العودة إلى التطابقات' : 'Back to Matches'}
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-8 px-4" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href={`/${locale}/study-buddy/matches`}>
            <Button variant="ghost" className="text-white">
              <ArrowLeft className={`w-5 h-5 ${isArabic ? 'rotate-180' : ''}`} />
            </Button>
          </Link>
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">{workspace.name}</h1>
            {workspace.description && (
              <p className="text-gray-400">{workspace.description}</p>
            )}
          </div>
          <div className="w-20"></div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <Button
            onClick={() => setActiveTab('resources')}
            className={`${
              activeTab === 'resources'
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isArabic ? 'الموارد' : 'Resources'}
            <Badge className="ml-2 bg-white/20">{workspace.resources.length}</Badge>
          </Button>

          <Button
            onClick={() => setActiveTab('notes')}
            className={`${
              activeTab === 'notes'
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            <StickyNote className="w-4 h-4 mr-2" />
            {isArabic ? 'الملاحظات' : 'Notes'}
            <Badge className="ml-2 bg-white/20">{workspace.notes.length}</Badge>
          </Button>

          <Button
            onClick={() => setActiveTab('goals')}
            className={`${
              activeTab === 'goals'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            <Target className="w-4 h-4 mr-2" />
            {isArabic ? 'الأهداف' : 'Goals'}
            <Badge className="ml-2 bg-white/20">{workspace.goals.length}</Badge>
          </Button>

          <Button
            onClick={() => setActiveTab('cowatch')}
            className={`${
              activeTab === 'cowatch'
                ? 'bg-pink-600 hover:bg-pink-700'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            {isArabic ? 'مشاهدة معًا' : 'Co-Watch'}
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'resources' && (
          <ResourcesTab 
            resources={workspace.resources}
            workspaceId={workspace.id}
            onRefresh={fetchWorkspace}
            isArabic={isArabic}
          />
        )}

        {activeTab === 'notes' && (
          <NotesTab 
            notes={workspace.notes}
            workspaceId={workspace.id}
            onRefresh={fetchWorkspace}
            isArabic={isArabic}
          />
        )}

        {activeTab === 'goals' && (
          <GoalsTab 
            goals={workspace.goals}
            workspaceId={workspace.id}
            onRefresh={fetchWorkspace}
            isArabic={isArabic}
          />
        )}

        {activeTab === 'cowatch' && (
          <CoWatchTab 
            sessions={workspace.coWatchSessions}
            workspaceId={workspace.id}
            onRefresh={fetchWorkspace}
            isArabic={isArabic}
          />
        )}
      </div>
    </div>
  )
}

// Resources Tab Component
function ResourcesTab({ resources, workspaceId, onRefresh, isArabic }: any) {
  const [showUpload, setShowUpload] = useState(false)

  return (
    <div className="space-y-6">
      {/* Upload Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowUpload(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isArabic ? 'إضافة مورد' : 'Add Resource'}
        </Button>
      </div>

      {/* Resources Grid */}
      {resources.length === 0 ? (
        <Card className="bg-gray-800/80 backdrop-blur-md border-gray-700/50 p-12 text-center">
          <Upload className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            {isArabic ? 'لا توجد موارد حتى الآن' : 'No Resources Yet'}
          </h3>
          <p className="text-gray-400 mb-6">
            {isArabic 
              ? 'ابدأ بإضافة موارد لمشاركتها مع شريك الدراسة'
              : 'Start adding resources to share with your study buddy'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource: any) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onRefresh={onRefresh}
              isArabic={isArabic}
            />
          ))}
        </div>
      )}

      {showUpload && (
        <UploadResourceModal
          workspaceId={workspaceId}
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false)
            onRefresh()
          }}
          isArabic={isArabic}
        />
      )}
    </div>
  )
}

// Resource Card Component
function ResourceCard({ resource, onRefresh, isArabic }: any) {
  const getResourceIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PDF':
      case 'DOCUMENT':
        return <FileText className="w-6 h-6 text-red-400" />
      case 'LINK':
        return <LinkIcon className="w-6 h-6 text-blue-400" />
      case 'VIDEO':
        return <Video className="w-6 h-6 text-purple-400" />
      case 'IMAGE':
        return <ImageIcon className="w-6 h-6 text-green-400" />
      default:
        return <File className="w-6 h-6 text-gray-400" />
    }
  }

  const handleDelete = async () => {
    if (!confirm(isArabic ? 'هل أنت متأكد؟' : 'Are you sure?')) return

    try {
      const response = await fetch(`/api/study-buddy/workspace/resources?id=${resource.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success(isArabic ? 'تم الحذف بنجاح' : 'Deleted successfully')
        onRefresh()
      } else {
        toast.error(isArabic ? 'فشل الحذف' : 'Failed to delete')
      }
    } catch (error) {
      toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
    }
  }

  return (
    <Card className="bg-gray-800/80 backdrop-blur-md border-gray-700/50 p-4 hover:border-purple-500/50 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {getResourceIcon(resource.type)}
          <div>
            <h3 className="font-semibold text-white">{resource.title}</h3>
            <p className="text-sm text-gray-400">{resource.uploader.name}</p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="text-gray-400 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {resource.description && (
        <p className="text-sm text-gray-300 mb-3">{resource.description}</p>
      )}

      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
      >
        {isArabic ? 'فتح' : 'Open'} →
      </a>
    </Card>
  )
}

// Upload Resource Modal (placeholder - you'd implement file upload)
function UploadResourceModal({ workspaceId, onClose, onSuccess, isArabic }: any) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'LINK',
    url: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/study-buddy/workspace/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          ...formData
        })
      })

      if (response.ok) {
        toast.success(isArabic ? 'تمت الإضافة بنجاح' : 'Added successfully')
        onSuccess()
      } else {
        toast.error(isArabic ? 'فشلت الإضافة' : 'Failed to add')
      }
    } catch (error) {
      toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-gray-800/90 border-purple-500/50 p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-4">
          {isArabic ? 'إضافة مورد' : 'Add Resource'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white mb-2">{isArabic ? 'العنوان' : 'Title'}</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              required
            />
          </div>

          <div>
            <label className="block text-white mb-2">{isArabic ? 'الرابط/URL' : 'URL/Link'}</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              required
            />
          </div>

          <div>
            <label className="block text-white mb-2">{isArabic ? 'النوع' : 'Type'}</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="LINK">Link</option>
              <option value="PDF">PDF</option>
              <option value="VIDEO">Video</option>
              <option value="IMAGE">Image</option>
              <option value="DOCUMENT">Document</option>
            </select>
          </div>

          <div>
            <label className="block text-white mb-2">{isArabic ? 'الوصف' : 'Description'}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1">
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
              {isArabic ? 'إضافة' : 'Add'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

// Notes Tab Component
function NotesTab({ notes, workspaceId, onRefresh, isArabic }: any) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingNote, setEditingNote] = useState<WorkspaceNote | null>(null)

  const handleDelete = async (noteId: string) => {
    if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذه الملاحظة؟' : 'Are you sure you want to delete this note?')) return

    try {
      const response = await fetch(`/api/study-buddy/workspace/notes?id=${noteId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success(isArabic ? 'تم الحذف بنجاح' : 'Note deleted successfully')
        onRefresh()
      } else {
        toast.error(isArabic ? 'فشل الحذف' : 'Failed to delete note')
      }
    } catch (error) {
      toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
    }
  }

  const handleTogglePin = async (noteId: string, isPinned: boolean) => {
    try {
      const response = await fetch('/api/study-buddy/workspace/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: noteId, isPinned: !isPinned })
      })

      if (response.ok) {
        toast.success(isArabic ? 'تم التحديث' : 'Note updated')
        onRefresh()
      }
    } catch (error) {
      toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
    }
  }

  const pinnedNotes = notes.filter((n: WorkspaceNote) => n.isPinned)
  const unpinnedNotes = notes.filter((n: WorkspaceNote) => !n.isPinned)

  return (
    <div className="space-y-6">
      {/* Add Note Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isArabic ? 'إضافة ملاحظة' : 'Add Note'}
        </Button>
      </div>

      {/* Empty State */}
      {notes.length === 0 ? (
        <Card className="bg-gray-800/80 backdrop-blur-md border-gray-700/50 p-12 text-center">
          <StickyNote className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            {isArabic ? 'لا توجد ملاحظات بعد' : 'No Notes Yet'}
          </h3>
          <p className="text-gray-400 mb-6">
            {isArabic 
              ? 'ابدأ بإضافة ملاحظات لتنظيم أفكارك ومشاركتها'
              : 'Start adding notes to organize your thoughts and share them'}
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Pinned Notes */}
          {pinnedNotes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Pin className="w-5 h-5 text-yellow-400" />
                {isArabic ? 'الملاحظات المثبتة' : 'Pinned Notes'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinnedNotes.map((note: WorkspaceNote) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={() => setEditingNote(note)}
                    onDelete={() => handleDelete(note.id)}
                    onTogglePin={() => handleTogglePin(note.id, note.isPinned)}
                    isArabic={isArabic}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular Notes */}
          {unpinnedNotes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-gray-400" />
                {isArabic ? 'جميع الملاحظات' : 'All Notes'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unpinnedNotes.map((note: WorkspaceNote) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={() => setEditingNote(note)}
                    onDelete={() => handleDelete(note.id)}
                    onTogglePin={() => handleTogglePin(note.id, note.isPinned)}
                    isArabic={isArabic}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingNote) && (
        <NoteModal
          workspaceId={workspaceId}
          note={editingNote}
          onClose={() => {
            setShowCreateModal(false)
            setEditingNote(null)
          }}
          onSuccess={() => {
            setShowCreateModal(false)
            setEditingNote(null)
            onRefresh()
          }}
          isArabic={isArabic}
        />
      )}
    </div>
  )
}

// Note Card Component
function NoteCard({ note, onEdit, onDelete, onTogglePin, isArabic }: any) {
  const colors: Record<string, string> = {
    yellow: 'bg-yellow-900/40 border-yellow-500/30',
    blue: 'bg-blue-900/40 border-blue-500/30',
    green: 'bg-green-900/40 border-green-500/30',
    pink: 'bg-pink-900/40 border-pink-500/30',
    purple: 'bg-purple-900/40 border-purple-500/30',
    orange: 'bg-orange-900/40 border-orange-500/30',
  }

  const bgColor = note.color ? colors[note.color] || colors.yellow : colors.yellow

  return (
    <Card className={`${bgColor} backdrop-blur-md border-2 p-4 hover:scale-105 transition-transform duration-200 relative group`}>
      {/* Pin Badge */}
      {note.isPinned && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
          <Pin className="w-4 h-4 text-white fill-white" />
        </div>
      )}

      {/* Note Content */}
      <div className="mb-4">
        <h4 className="font-bold text-white text-lg mb-2">{note.title}</h4>
        <p className="text-gray-200 text-sm whitespace-pre-wrap line-clamp-4">
          {note.content}
        </p>
      </div>

      {/* Meta Info */}
      <div className="text-xs text-gray-400 mb-3">
        <p>{isArabic ? 'بواسطة' : 'By'} {note.creator.name}</p>
        <p>
          {new Date(note.updatedAt).toLocaleDateString(isArabic ? 'ar' : 'en', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onTogglePin}
          className="flex-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-white text-sm flex items-center justify-center gap-1"
        >
          <Pin className="w-3 h-3" />
          {note.isPinned ? (isArabic ? 'إلغاء' : 'Unpin') : (isArabic ? 'تثبيت' : 'Pin')}
        </button>
        <button
          onClick={onEdit}
          className="flex-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded text-blue-300 text-sm flex items-center justify-center gap-1"
        >
          <Edit className="w-3 h-3" />
          {isArabic ? 'تعديل' : 'Edit'}
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded text-red-300 text-sm"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </Card>
  )
}

// Note Modal Component
function NoteModal({ workspaceId, note, onClose, onSuccess, isArabic }: any) {
  const [formData, setFormData] = useState({
    title: note?.title || '',
    content: note?.content || '',
    color: note?.color || 'yellow',
    isPinned: note?.isPinned || false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = note 
        ? '/api/study-buddy/workspace/notes'
        : '/api/study-buddy/workspace/notes'

      const response = await fetch(url, {
        method: note ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(note && { id: note.id }),
          workspaceId,
          ...formData
        })
      })

      if (response.ok) {
        toast.success(isArabic ? 'تم الحفظ بنجاح' : 'Note saved successfully')
        onSuccess()
      } else {
        toast.error(isArabic ? 'فشل الحفظ' : 'Failed to save note')
      }
    } catch (error) {
      toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
    }
  }

  const colorOptions = [
    { value: 'yellow', label: isArabic ? 'أصفر' : 'Yellow', class: 'bg-yellow-500' },
    { value: 'blue', label: isArabic ? 'أزرق' : 'Blue', class: 'bg-blue-500' },
    { value: 'green', label: isArabic ? 'أخضر' : 'Green', class: 'bg-green-500' },
    { value: 'pink', label: isArabic ? 'وردي' : 'Pink', class: 'bg-pink-500' },
    { value: 'purple', label: isArabic ? 'بنفسجي' : 'Purple', class: 'bg-purple-500' },
    { value: 'orange', label: isArabic ? 'برتقالي' : 'Orange', class: 'bg-orange-500' },
  ]

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-gray-800/95 border-yellow-500/50 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">
          {note ? (isArabic ? 'تعديل الملاحظة' : 'Edit Note') : (isArabic ? 'إضافة ملاحظة' : 'Add Note')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-white font-semibold mb-2">
              {isArabic ? 'العنوان' : 'Title'}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
              placeholder={isArabic ? 'أدخل عنوان الملاحظة' : 'Enter note title'}
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-white font-semibold mb-2">
              {isArabic ? 'المحتوى' : 'Content'}
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none resize-none"
              rows={8}
              placeholder={isArabic ? 'اكتب ملاحظتك هنا...' : 'Write your note here...'}
              required
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-white font-semibold mb-3">
              {isArabic ? 'اللون' : 'Color'}
            </label>
            <div className="flex flex-wrap gap-3">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    formData.color === color.value
                      ? `${color.class} text-white scale-110 shadow-lg`
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {color.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pin Toggle */}
          <div className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-lg">
            <input
              type="checkbox"
              id="isPinned"
              checked={formData.isPinned}
              onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
              className="w-5 h-5 rounded"
            />
            <label htmlFor="isPinned" className="text-white font-medium cursor-pointer flex items-center gap-2">
              <Pin className="w-4 h-4 text-yellow-400" />
              {isArabic ? 'تثبيت الملاحظة' : 'Pin this note'}
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1">
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:opacity-90">
              {isArabic ? 'حفظ' : 'Save'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

function GoalsTab({ goals, workspaceId, onRefresh, isArabic }: any) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<WorkspaceGoal | null>(null)

  const handleDelete = async (goalId: string) => {
    if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذا الهدف؟' : 'Are you sure you want to delete this goal?')) return

    try {
      const response = await fetch(`/api/study-buddy/workspace/goals?id=${goalId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success(isArabic ? 'تم الحذف بنجاح' : 'Goal deleted successfully')
        onRefresh()
      } else {
        toast.error(isArabic ? 'فشل الحذف' : 'Failed to delete goal')
      }
    } catch (error) {
      toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
    }
  }

  const handleUpdateStatus = async (goalId: string, status: string) => {
    try {
      const response = await fetch('/api/study-buddy/workspace/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: goalId, status })
      })

      if (response.ok) {
        toast.success(isArabic ? 'تم التحديث' : 'Goal updated')
        onRefresh()
      }
    } catch (error) {
      toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
    }
  }

  // Group goals by status
  const goalsByStatus = {
    NOT_STARTED: goals.filter((g: WorkspaceGoal) => g.status === 'NOT_STARTED'),
    IN_PROGRESS: goals.filter((g: WorkspaceGoal) => g.status === 'IN_PROGRESS'),
    COMPLETED: goals.filter((g: WorkspaceGoal) => g.status === 'COMPLETED'),
  }

  const totalProgress = goals.length > 0 
    ? goals.reduce((sum: number, g: WorkspaceGoal) => sum + g.progress, 0) / goals.length
    : 0

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-900/40 to-green-800/40 border-green-500/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-300">{isArabic ? 'إجمالي الأهداف' : 'Total Goals'}</p>
              <p className="text-3xl font-bold text-white">{goals.length}</p>
            </div>
            <Target className="w-10 h-10 text-green-400" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 border-blue-500/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-300">{isArabic ? 'قيد التنفيذ' : 'In Progress'}</p>
              <p className="text-3xl font-bold text-white">{goalsByStatus.IN_PROGRESS.length}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-400" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/40 to-green-700/40 border-green-500/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-300">{isArabic ? 'مكتمل' : 'Completed'}</p>
              <p className="text-3xl font-bold text-white">{goalsByStatus.COMPLETED.length}</p>
            </div>
            <Check className="w-10 h-10 text-green-400" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border-purple-500/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-300">{isArabic ? 'التقدم العام' : 'Overall Progress'}</p>
              <p className="text-3xl font-bold text-white">{totalProgress.toFixed(0)}%</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-400" />
          </div>
        </Card>
      </div>

      {/* Add Goal Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isArabic ? 'إضافة هدف' : 'Add Goal'}
        </Button>
      </div>

      {/* Empty State */}
      {goals.length === 0 ? (
        <Card className="bg-gray-800/80 backdrop-blur-md border-gray-700/50 p-12 text-center">
          <Target className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            {isArabic ? 'لا توجد أهداف بعد' : 'No Goals Yet'}
          </h3>
          <p className="text-gray-400 mb-6">
            {isArabic 
              ? 'ابدأ بإضافة أهداف لتتبع تقدمك المشترك'
              : 'Start adding goals to track your shared progress'}
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* In Progress Goals */}
          {goalsByStatus.IN_PROGRESS.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                {isArabic ? 'قيد التنفيذ' : 'In Progress'}
                <Badge className="bg-blue-500/20 text-blue-300">{goalsByStatus.IN_PROGRESS.length}</Badge>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goalsByStatus.IN_PROGRESS.map((goal: WorkspaceGoal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={() => setEditingGoal(goal)}
                    onDelete={() => handleDelete(goal.id)}
                    onUpdateStatus={(status: string) => handleUpdateStatus(goal.id, status)}
                    isArabic={isArabic}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Not Started Goals */}
          {goalsByStatus.NOT_STARTED.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-gray-400" />
                {isArabic ? 'لم يبدأ' : 'Not Started'}
                <Badge className="bg-gray-500/20 text-gray-300">{goalsByStatus.NOT_STARTED.length}</Badge>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goalsByStatus.NOT_STARTED.map((goal: WorkspaceGoal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={() => setEditingGoal(goal)}
                    onDelete={() => handleDelete(goal.id)}
                    onUpdateStatus={(status: string) => handleUpdateStatus(goal.id, status)}
                    isArabic={isArabic}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Goals */}
          {goalsByStatus.COMPLETED.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                {isArabic ? 'مكتمل' : 'Completed'}
                <Badge className="bg-green-500/20 text-green-300">{goalsByStatus.COMPLETED.length}</Badge>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goalsByStatus.COMPLETED.map((goal: WorkspaceGoal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={() => setEditingGoal(goal)}
                    onDelete={() => handleDelete(goal.id)}
                    onUpdateStatus={(status: string) => handleUpdateStatus(goal.id, status)}
                    isArabic={isArabic}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingGoal) && (
        <GoalModal
          workspaceId={workspaceId}
          goal={editingGoal}
          onClose={() => {
            setShowCreateModal(false)
            setEditingGoal(null)
          }}
          onSuccess={() => {
            setShowCreateModal(false)
            setEditingGoal(null)
            onRefresh()
          }}
          isArabic={isArabic}
        />
      )}
    </div>
  )
}

// Goal Card Component
function GoalCard({ goal, onEdit, onDelete, onUpdateStatus, isArabic }: any) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return {
          color: 'bg-green-500/20 text-green-300 border-green-400/30',
          icon: <Check className="w-4 h-4" />
        }
      case 'IN_PROGRESS':
        return {
          color: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
          icon: <TrendingUp className="w-4 h-4" />
        }
      case 'NOT_STARTED':
        return {
          color: 'bg-gray-500/20 text-gray-300 border-gray-400/30',
          icon: <Target className="w-4 h-4" />
        }
      default:
        return {
          color: 'bg-gray-500/20 text-gray-300 border-gray-400/30',
          icon: <Target className="w-4 h-4" />
        }
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-400'
      case 'MEDIUM':
        return 'text-yellow-400'
      case 'LOW':
        return 'text-green-400'
      default:
        return 'text-gray-400'
    }
  }

  const statusConfig = getStatusConfig(goal.status)

  return (
    <Card className="bg-gray-800/80 backdrop-blur-md border-gray-700/50 p-5 hover:border-green-500/50 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-bold text-white text-lg">{goal.title}</h4>
            {goal.priority && (
              <Badge className={`${getPriorityColor(goal.priority)} bg-opacity-20 text-xs`}>
                {goal.priority}
              </Badge>
            )}
          </div>
          <Badge className={statusConfig.color}>
            {statusConfig.icon}
            <span className="ml-1">{goal.status.replace('_', ' ')}</span>
          </Badge>
        </div>
      </div>

      {/* Description */}
      {goal.description && (
        <p className="text-gray-300 text-sm mb-4 line-clamp-2">{goal.description}</p>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">{isArabic ? 'التقدم' : 'Progress'}</span>
          <span className="text-white font-semibold">{goal.progress}%</span>
        </div>
        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500 rounded-full"
            style={{ width: `${goal.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
        <span>{isArabic ? 'بواسطة' : 'By'} {goal.creator.name}</span>
        {goal.targetDate && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(goal.targetDate).toLocaleDateString(isArabic ? 'ar' : 'en', {
              month: 'short',
              day: 'numeric'
            })}
          </span>
        )}
      </div>

      {/* Quick Status Change */}
      <div className="flex gap-2 mb-3">
        {goal.status !== 'IN_PROGRESS' && (
          <button
            onClick={() => onUpdateStatus('IN_PROGRESS')}
            className="flex-1 px-2 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded text-blue-300 text-xs font-medium"
          >
            {isArabic ? 'ابدأ' : 'Start'}
          </button>
        )}
        {goal.status !== 'COMPLETED' && (
          <button
            onClick={() => onUpdateStatus('COMPLETED')}
            className="flex-1 px-2 py-1.5 bg-green-500/20 hover:bg-green-500/30 rounded text-green-300 text-xs font-medium"
          >
            {isArabic ? 'أكمل' : 'Complete'}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded text-blue-300 text-sm flex items-center justify-center gap-1"
        >
          <Edit className="w-3 h-3" />
          {isArabic ? 'تعديل' : 'Edit'}
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded text-red-300 text-sm"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </Card>
  )
}

// Goal Modal Component
function GoalModal({ workspaceId, goal, onClose, onSuccess, isArabic }: any) {
  const [formData, setFormData] = useState({
    title: goal?.title || '',
    description: goal?.description || '',
    status: goal?.status || 'NOT_STARTED',
    progress: goal?.progress || 0,
    priority: goal?.priority || 'MEDIUM',
    targetDate: goal?.targetDate || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = '/api/study-buddy/workspace/goals'
      const response = await fetch(url, {
        method: goal ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(goal && { id: goal.id }),
          workspaceId,
          ...formData
        })
      })

      if (response.ok) {
        toast.success(isArabic ? 'تم الحفظ بنجاح' : 'Goal saved successfully')
        onSuccess()
      } else {
        toast.error(isArabic ? 'فشل الحفظ' : 'Failed to save goal')
      }
    } catch (error) {
      toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-gray-800/95 border-green-500/50 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">
          {goal ? (isArabic ? 'تعديل الهدف' : 'Edit Goal') : (isArabic ? 'إضافة هدف' : 'Add Goal')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-white font-semibold mb-2">
              {isArabic ? 'العنوان' : 'Title'}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
              placeholder={isArabic ? 'أدخل عنوان الهدف' : 'Enter goal title'}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-white font-semibold mb-2">
              {isArabic ? 'الوصف' : 'Description'}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none resize-none"
              rows={4}
              placeholder={isArabic ? 'اكتب وصفًا للهدف...' : 'Describe your goal...'}
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">
                {isArabic ? 'الحالة' : 'Status'}
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
              >
                <option value="NOT_STARTED">{isArabic ? 'لم يبدأ' : 'Not Started'}</option>
                <option value="IN_PROGRESS">{isArabic ? 'قيد التنفيذ' : 'In Progress'}</option>
                <option value="COMPLETED">{isArabic ? 'مكتمل' : 'Completed'}</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                {isArabic ? 'الأولوية' : 'Priority'}
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
              >
                <option value="LOW">{isArabic ? 'منخفض' : 'Low'}</option>
                <option value="MEDIUM">{isArabic ? 'متوسط' : 'Medium'}</option>
                <option value="HIGH">{isArabic ? 'عالي' : 'High'}</option>
              </select>
            </div>
          </div>

          {/* Progress and Target Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">
                {isArabic ? 'التقدم' : 'Progress'} ({formData.progress}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                {isArabic ? 'تاريخ الهدف' : 'Target Date'}
              </label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1">
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90">
              {isArabic ? 'حفظ' : 'Save'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

function CoWatchTab({ sessions, workspaceId, onRefresh, isArabic }: any) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeSession, setActiveSession] = useState<CoWatchSession | null>(null)

  const handleCreateSession = async (videoUrl: string, videoTitle: string) => {
    try {
      const response = await fetch('/api/study-buddy/workspace/co-watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          videoUrl,
          videoTitle,
          currentTime: 0,
          isPlaying: false,
          status: 'ACTIVE'
        })
      })

      if (response.ok) {
        toast.success(isArabic ? 'تم إنشاء الجلسة' : 'Session created')
        onRefresh()
        setShowCreateModal(false)
      } else {
        toast.error(isArabic ? 'فشل الإنشاء' : 'Failed to create session')
      }
    } catch (error) {
      toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
    }
  }

  const handleEndSession = async (sessionId: string) => {
    if (!confirm(isArabic ? 'هل تريد إنهاء الجلسة؟' : 'End this session?')) return

    try {
      const response = await fetch(`/api/study-buddy/workspace/co-watch?id=${sessionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success(isArabic ? 'تم إنهاء الجلسة' : 'Session ended')
        onRefresh()
        if (activeSession?.id === sessionId) {
          setActiveSession(null)
        }
      }
    } catch (error) {
      toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
    }
  }

  const activeSessions = sessions.filter((s: CoWatchSession) => s.status === 'ACTIVE')
  const pastSessions = sessions.filter((s: CoWatchSession) => s.status === 'ENDED')

  return (
    <div className="space-y-6">
      {/* Active Session Player */}
      {activeSession && (
        <Card className="bg-gray-800/80 backdrop-blur-md border-pink-500/50 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <PlayCircle className="w-6 h-6 text-pink-400" />
              {activeSession.videoTitle}
            </h3>
            <Button
              variant="outline"
              onClick={() => setActiveSession(null)}
              className="text-gray-300"
            >
              {isArabic ? 'إغلاق' : 'Close'}
            </Button>
          </div>

          {/* Video Player */}
          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
            {activeSession.videoUrl.includes('youtube.com') || activeSession.videoUrl.includes('youtu.be') ? (
              <iframe
                src={`https://www.youtube.com/embed/${extractYouTubeId(activeSession.videoUrl)}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : activeSession.videoUrl.includes('vimeo.com') ? (
              <iframe
                src={`https://player.vimeo.com/video/${extractVimeoId(activeSession.videoUrl)}`}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={activeSession.videoUrl}
                controls
                className="w-full h-full"
              />
            )}
          </div>

          {/* Session Info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <Badge className="bg-pink-500/20 text-pink-300 border-pink-400/30">
                {activeSession.isPlaying ? (isArabic ? 'قيد التشغيل' : 'Playing') : (isArabic ? 'متوقف' : 'Paused')}
              </Badge>
              <span className="text-gray-400">
                {isArabic ? 'الوقت الحالي:' : 'Current Time:'} {formatTime(activeSession.currentTime)}
              </span>
            </div>
            <Button
              variant="outline"
              onClick={() => handleEndSession(activeSession.id)}
              className="text-red-400 hover:text-red-300"
            >
              {isArabic ? 'إنهاء الجلسة' : 'End Session'}
            </Button>
          </div>

          {/* Sync Notice */}
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300">
              💡 {isArabic 
                ? 'ملاحظة: التحكم في التشغيل والإيقاف المؤقت سيتم مزامنته تلقائيًا مع شريك الدراسة الخاص بك'
                : 'Note: Play/pause controls will be synced automatically with your study buddy'}
            </p>
          </div>
        </Card>
      )}

      {/* Create Session Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isArabic ? 'إنشاء جلسة' : 'Create Session'}
        </Button>
      </div>

      {/* Empty State */}
      {sessions.length === 0 ? (
        <Card className="bg-gray-800/80 backdrop-blur-md border-gray-700/50 p-12 text-center">
          <PlayCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            {isArabic ? 'لا توجد جلسات بعد' : 'No Sessions Yet'}
          </h3>
          <p className="text-gray-400 mb-6">
            {isArabic 
              ? 'ابدأ جلسة مشاهدة مشتركة لتعلم معًا'
              : 'Start a co-watch session to learn together'}
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Sessions */}
          {activeSessions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-pink-400" />
                {isArabic ? 'الجلسات النشطة' : 'Active Sessions'}
                <Badge className="bg-pink-500/20 text-pink-300">{activeSessions.length}</Badge>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeSessions.map((session: CoWatchSession) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onJoin={() => setActiveSession(session)}
                    onEnd={() => handleEndSession(session.id)}
                    isArabic={isArabic}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Sessions */}
          {pastSessions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Check className="w-5 h-5 text-gray-400" />
                {isArabic ? 'الجلسات السابقة' : 'Past Sessions'}
                <Badge className="bg-gray-500/20 text-gray-300">{pastSessions.length}</Badge>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastSessions.map((session: CoWatchSession) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onJoin={null}
                    onEnd={null}
                    isArabic={isArabic}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <CoWatchModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateSession}
          isArabic={isArabic}
        />
      )}
    </div>
  )
}

// Session Card Component
function SessionCard({ session, onJoin, onEnd, isArabic }: any) {
  const isActive = session.status === 'ACTIVE'

  return (
    <Card className={`bg-gray-800/80 backdrop-blur-md p-4 hover:scale-105 transition-transform duration-200 ${
      isActive ? 'border-pink-500/50' : 'border-gray-700/50'
    }`}>
      {/* Video Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-pink-900/40 to-purple-900/40 rounded-lg mb-3 flex items-center justify-center">
        <PlayCircle className={`w-12 h-12 ${isActive ? 'text-pink-400' : 'text-gray-500'}`} />
      </div>

      {/* Title */}
      <h4 className="font-bold text-white mb-2 line-clamp-2">{session.videoTitle}</h4>

      {/* Status Badge */}
      <Badge className={
        isActive 
          ? 'bg-pink-500/20 text-pink-300 border-pink-400/30 mb-3'
          : 'bg-gray-500/20 text-gray-300 border-gray-400/30 mb-3'
      }>
        {session.status}
      </Badge>

      {/* Info */}
      {isActive && (
        <div className="text-xs text-gray-400 mb-3">
          <p>{isArabic ? 'الوقت:' : 'Time:'} {formatTime(session.currentTime)}</p>
          <p>{session.isPlaying ? (isArabic ? '▶ قيد التشغيل' : '▶ Playing') : (isArabic ? '⏸ متوقف' : '⏸ Paused')}</p>
        </div>
      )}

      {/* Actions */}
      {isActive ? (
        <div className="flex gap-2">
          <Button
            onClick={onJoin}
            className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 text-sm py-2"
          >
            {isArabic ? 'انضم' : 'Join'}
          </Button>
          <Button
            onClick={onEnd}
            variant="outline"
            className="text-red-400 hover:text-red-300 text-sm py-2"
          >
            {isArabic ? 'إنهاء' : 'End'}
          </Button>
        </div>
      ) : (
        <p className="text-center text-gray-500 text-sm">
          {isArabic ? 'انتهت الجلسة' : 'Session ended'}
        </p>
      )}
    </Card>
  )
}

// Co-Watch Modal Component
function CoWatchModal({ onClose, onCreate, isArabic }: any) {
  const [videoUrl, setVideoUrl] = useState('')
  const [videoTitle, setVideoTitle] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate(videoUrl, videoTitle)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-gray-800/95 border-pink-500/50 p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-6">
          {isArabic ? 'إنشاء جلسة مشاهدة' : 'Create Co-Watch Session'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Video Title */}
          <div>
            <label className="block text-white font-semibold mb-2">
              {isArabic ? 'عنوان الفيديو' : 'Video Title'}
            </label>
            <input
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-pink-500 focus:outline-none"
              placeholder={isArabic ? 'مثال: درس الرياضيات 5' : 'e.g., Math Lesson 5'}
              required
            />
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-white font-semibold mb-2">
              {isArabic ? 'رابط الفيديو' : 'Video URL'}
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-pink-500 focus:outline-none"
              placeholder="https://youtube.com/watch?v=..."
              required
            />
            <p className="text-xs text-gray-400 mt-2">
              {isArabic 
                ? 'يدعم: YouTube, Vimeo, أو رابط فيديو مباشر'
                : 'Supports: YouTube, Vimeo, or direct video link'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1">
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90">
              {isArabic ? 'إنشاء' : 'Create'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

// Helper functions
function extractYouTubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)
  return match ? match[1] : ''
}

function extractVimeoId(url: string): string {
  const match = url.match(/vimeo\.com\/(\d+)/)
  return match ? match[1] : ''
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
