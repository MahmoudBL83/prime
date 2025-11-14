// Lightweight notification response service
export const getEmptyNotificationResponse = () => ({
  notifications: [],
  unreadCount: 0,
  hasMore: false,
  timestamp: Date.now()
})

export const getCachedNotifications = (userId: string) => {
  // In a real app, this would check Redis or memory cache
  // For now, return empty response quickly
  return getEmptyNotificationResponse()
}

export const NOTIFICATION_CACHE_DURATION = 30000 // 30 seconds
