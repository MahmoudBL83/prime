import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { uploadResource, deleteResource } from '@/services/studyWorkspaceService'

// POST /api/study-buddy/workspace/resources - Upload resource
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { workspaceId, title, description, type, url, fileSize, mimeType, tags } = body

    if (!workspaceId || !title || !type || !url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const resource = await uploadResource(workspaceId, session.user.id, {
      title,
      description,
      type,
      url,
      fileSize,
      mimeType,
      tags
    })

    return NextResponse.json({ resource })
  } catch (error: any) {
    console.error('Resource upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload resource' },
      { status: 500 }
    )
  }
}

// DELETE /api/study-buddy/workspace/resources?id=xxx - Delete resource
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const resourceId = searchParams.get('id')

    if (!resourceId) {
      return NextResponse.json(
        { error: 'Resource ID is required' },
        { status: 400 }
      )
    }

    await deleteResource(resourceId, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Resource delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete resource' },
      { status: 500 }
    )
  }
}
