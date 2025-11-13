import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { saveNote, deleteNote } from '@/services/studyWorkspaceService'

// POST /api/study-buddy/workspace/notes - Create or update note
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { workspaceId, id, title, content, color, isPinned, tags } = body

    if (!workspaceId || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const note = await saveNote(workspaceId, session.user.id, {
      id,
      title,
      content,
      color,
      isPinned,
      tags
    })

    return NextResponse.json({ note })
  } catch (error: any) {
    console.error('Note save error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save note' },
      { status: 500 }
    )
  }
}

// DELETE /api/study-buddy/workspace/notes?id=xxx - Delete note
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const noteId = searchParams.get('id')

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      )
    }

    await deleteNote(noteId, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Note delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete note' },
      { status: 500 }
    )
  }
}
