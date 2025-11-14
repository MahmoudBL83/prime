import { NextRequest, NextResponse } from 'next/server'

// Ultra-lightweight notifications endpoint with minimal imports
export async function GET(req: NextRequest) {
  try {
    // Check for auth token in headers (faster than full session check)
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract user ID from simple token (you'd implement proper verification)
    // For now, return mock data for fast response
    const mockNotifications = [
      {
        id: 'mock-1',
        type: 'SYSTEM',
        title: 'Welcome!',
        message: 'Welcome to the platform',
        data: null,
        isRead: false,
        createdAt: new Date().toISOString()
      }
    ]

    return NextResponse.json({
      notifications: mockNotifications,
      unreadCount: 1,
      hasMore: false,
    })

  } catch (error) {
    console.error('Fast notifications error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// Fallback to full endpoint for POST/PATCH operations
export { POST, PATCH } from '../notifications/route'
