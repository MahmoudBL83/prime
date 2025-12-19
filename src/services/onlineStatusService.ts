/**
 * Online Status Service
 * Tracks user presence using in-memory storage
 * In production, this would use Redis for persistence across instances
 */

// In-memory store for online users with last activity timestamp
const onlineUsers = new Map<string, { lastSeen: Date; status: 'online' | 'away' | 'busy' }>()

// Stale threshold - users are considered offline after this period
const STALE_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

// Cleanup stale entries periodically
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = new Date()
        for (const [userId, data] of onlineUsers.entries()) {
            if (now.getTime() - data.lastSeen.getTime() > STALE_THRESHOLD_MS) {
                onlineUsers.delete(userId)
            }
        }
    }, 60 * 1000) // Check every minute
}

/**
 * Check if a specific user is online
 */
export function isUserOnline(userId: string): boolean {
    const userData = onlineUsers.get(userId)
    if (!userData) return false

    const now = new Date()
    return now.getTime() - userData.lastSeen.getTime() < STALE_THRESHOLD_MS
}

/**
 * Get online status for multiple users
 */
export function getUsersOnlineStatus(userIds: string[]): Record<string, boolean> {
    const result: Record<string, boolean> = {}
    for (const userId of userIds) {
        result[userId] = isUserOnline(userId)
    }
    return result
}

/**
 * Get last seen time for a user
 */
export function getUserLastSeen(userId: string): Date | null {
    const userData = onlineUsers.get(userId)
    return userData?.lastSeen || null
}

/**
 * Set user as online with heartbeat
 */
export function setUserOnline(userId: string, status: 'online' | 'away' | 'busy' = 'online'): void {
    onlineUsers.set(userId, {
        lastSeen: new Date(),
        status
    })
}

/**
 * Set user as offline
 */
export function setUserOffline(userId: string): void {
    onlineUsers.delete(userId)
}

/**
 * Get user status details
 */
export function getUserStatus(userId: string): { isOnline: boolean; lastSeen: Date | null; status: string | null } {
    const userData = onlineUsers.get(userId)
    if (!userData) {
        return { isOnline: false, lastSeen: null, status: null }
    }

    const now = new Date()
    const isOnline = now.getTime() - userData.lastSeen.getTime() < STALE_THRESHOLD_MS

    return {
        isOnline,
        lastSeen: userData.lastSeen,
        status: userData.status
    }
}

/**
 * Get count of online users
 */
export function getOnlineUserCount(): number {
    let count = 0
    const now = new Date()
    for (const [, data] of onlineUsers.entries()) {
        if (now.getTime() - data.lastSeen.getTime() < STALE_THRESHOLD_MS) {
            count++
        }
    }
    return count
}
