
/**
 * Online Status Service - Track user presence
 * Uses in-memory storage for real-time tracking
 * In production, this would use Redis for persistence across instances
 */

// In-memory store for online users with last activity timestamp
// Global variable to persist across module reloads in dev
declare global {
    var globalOnlineUsers: Map<string, { lastSeen: Date; status: 'online' | 'away' | 'busy' }> | undefined
}

const onlineUsers = global.globalOnlineUsers || new Map<string, { lastSeen: Date; status: 'online' | 'away' | 'busy' }>()

if (process.env.NODE_ENV !== 'production') {
    global.globalOnlineUsers = onlineUsers
}

// Cleanup stale entries every 5 minutes
const STALE_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

// Only start the interval if it hasn't been started (though in serverless this is tricky)
// We'll just do a cleanup on read/write occasionally or rely on this interval if the process stays alive
if (!global.setIntervalResult) {
    global.setIntervalResult = setInterval(() => {
        const now = new Date()
        for (const [userId, data] of onlineUsers.entries()) {
            if (now.getTime() - data.lastSeen.getTime() > STALE_THRESHOLD_MS) {
                onlineUsers.delete(userId)
            }
        }
    }, 60 * 1000) // Check every minute
}

declare global {
    var setIntervalResult: NodeJS.Timeout | undefined
}


// Exported helper function to check online status
export function isUserOnline(userId: string): boolean {
    const userData = onlineUsers.get(userId)
    if (!userData) return false

    const now = new Date()
    return now.getTime() - userData.lastSeen.getTime() < STALE_THRESHOLD_MS
}

// Exported helper to get multiple users' online status
export function getUsersOnlineStatus(userIds: string[]): Record<string, boolean> {
    const result: Record<string, boolean> = {}
    for (const userId of userIds) {
        result[userId] = isUserOnline(userId)
    }
    return result
}

// Helper to update user status
export function updateUserStatus(userId: string, status: 'online' | 'away' | 'busy' = 'online') {
    onlineUsers.set(userId, {
        lastSeen: new Date(),
        status: status
    })
    return {
        userId,
        status,
        lastSeen: onlineUsers.get(userId)?.lastSeen
    }
}

// Helper to remove user
export function removeUser(userId: string) {
    onlineUsers.delete(userId)
}

export function getLastSeen(userId: string) {
    return onlineUsers.get(userId)?.lastSeen || null
}
