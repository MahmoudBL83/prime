import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Super minimal cache - in memory only
const simpleCache = new Map<string, any>()
const CACHE_TTL = 30000 // 30 seconds

async function getMinimalSession(request: NextRequest) {
  // Try to get session info from cookies directly (much faster than getServerSession)
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('next-auth.session-token') || cookieStore.get('__Secure-next-auth.session-token')
    
    if (!sessionToken) {
      return null
    }

    // For development, return a simple user object
    // In production, you'd verify the token properly
    return {
      user: {
        id: 'temp-user-id', // You'd extract this from the token
        email: 'temp@example.com'
      }
    }
  } catch (error) {
    console.error('Session check failed:', error)
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    // Ultra-fast auth check
    const session = await getMinimalSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20) // Reduced default

    // Check simple cache first
    const cacheKey = `notif:${session.user.id}:${limit}`
    const cached = simpleCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data)
    }

    // For now, return empty result quickly while we debug
    const result = {
      notifications: [],
      unreadCount: 0,
      hasMore: false,
    }

    // Cache the result
    simpleCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    })

    // Cleanup old cache entries
    if (simpleCache.size > 20) {
      const now = Date.now()
      for (const [key, value] of simpleCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          simpleCache.delete(key)
        }
      }
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getMinimalSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clear cache for this user
    for (const key of simpleCache.keys()) {
      if (key.includes(`notif:${session.user.id}:`)) {
        simpleCache.delete(key)
      }
    }

    return NextResponse.json({ message: 'Notifications marked as read' })

  } catch (error) {
    console.error('Update notifications error:', error)
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getMinimalSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, just return success
    return NextResponse.json({ message: 'Notification created' }, { status: 201 })

  } catch (error) {
    console.error('Create notification error:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}