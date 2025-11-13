import { prisma } from '@/lib/prisma'

export type NotificationType = 
  | 'MESSAGE' 
  | 'MENTION' 
  | 'GROUP_INVITE' 
  | 'GROUP_JOIN' 
  | 'REACTION'
  | 'SYSTEM'
  | 'STUDY_BUDDY_REQUEST'
  | 'STUDY_BUDDY_MATCH'
  | 'STUDY_SESSION_SCHEDULED'
  | 'STUDY_SESSION_REMINDER'
  | 'VIDEO_CALL_INCOMING'
  | 'VIDEO_CALL_SCHEDULED'

export interface CreateNotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
}

export class NotificationService {
  // Create a single notification
  static async create(data: CreateNotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data ? JSON.stringify(data.data) : null,
        },
      })

      return notification
    } catch (error) {
      console.error('Failed to create notification:', error)
      throw error
    }
  }

  // Create multiple notifications
  static async createMany(notifications: CreateNotificationData[]) {
    try {
      const formattedNotifications = notifications.map(notification => ({
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data ? JSON.stringify(notification.data) : null,
      }))

      await prisma.notification.createMany({
        data: formattedNotifications,
      })

      return true
    } catch (error) {
      console.error('Failed to create notifications:', error)
      throw error
    }
  }

  // Study Buddy specific notifications
  static async notifyStudyBuddyMatch(userId: string, otherUserName: string, matchId: string) {
    return this.create({
      userId,
      type: 'STUDY_BUDDY_MATCH',
      title: 'New Study Buddy Match! 🎉',
      message: `You have a new study buddy match with ${otherUserName}. Start chatting and schedule your first session!`,
      data: {
        matchId,
        actionType: 'match',
        actionUrl: '/study-buddy?tab=matches'
      }
    })
  }

  static async notifyStudySessionScheduled(userId: string, sessionTitle: string, otherUserName: string, scheduledAt: Date, sessionId: string) {
    return this.create({
      userId,
      type: 'STUDY_SESSION_SCHEDULED',
      title: 'Study Session Scheduled 📅',
      message: `${otherUserName} scheduled a study session: "${sessionTitle}" on ${scheduledAt.toLocaleDateString()}`,
      data: {
        sessionId,
        actionType: 'session',
        actionUrl: '/study-buddy?tab=sessions'
      }
    })
  }

  static async notifyStudySessionReminder(userId: string, sessionTitle: string, otherUserName: string, minutesUntil: number, sessionId: string) {
    const timeText = minutesUntil === 60 ? '1 hour' : `${minutesUntil} minutes`
    return this.create({
      userId,
      type: 'STUDY_SESSION_REMINDER',
      title: 'Study Session Reminder ⏰',
      message: `Your study session "${sessionTitle}" with ${otherUserName} starts in ${timeText}`,
      data: {
        sessionId,
        actionType: 'session',
        actionUrl: '/study-buddy?tab=sessions'
      }
    })
  }

  static async notifyStudySessionCancelled(userId: string, sessionTitle: string, otherUserName: string, sessionId: string) {
    return this.create({
      userId,
      type: 'STUDY_SESSION_CANCELLED',
      title: 'Study Session Cancelled ❌',
      message: `${otherUserName} cancelled the study session: "${sessionTitle}"`,
      data: {
        sessionId,
        actionType: 'session',
        actionUrl: '/study-buddy?tab=sessions'
      }
    })
  }

  static async notifyNewMessage(userId: string, senderName: string, conversationTitle: string, conversationId: string) {
    return this.create({
      userId,
      type: 'MESSAGE',
      title: 'New Message 💬',
      message: `${senderName} sent you a message in ${conversationTitle}`,
      data: {
        conversationId,
        actionType: 'message',
        actionUrl: `/messages?conversation=${conversationId}`
      }
    })
  }

  // Mark notifications as read
  static async markAsRead(userId: string, notificationIds?: string[]) {
    try {
      const whereClause = notificationIds 
        ? { id: { in: notificationIds }, userId }
        : { userId, isRead: false }

      await prisma.notification.updateMany({
        where: whereClause,
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      return true
    } catch (error) {
      console.error('Failed to mark notifications as read:', error)
      throw error
    }
  }

  // Get unread count for a user
  static async getUnreadCount(userId: string) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      })

      return count
    } catch (error) {
      console.error('Failed to get unread count:', error)
      throw error
    }
  }

  // Clean up old notifications (older than 30 days)
  static async cleanup() {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          },
          isRead: true
        }
      })

      return true
    } catch (error) {
      console.error('Failed to cleanup notifications:', error)
      throw error
    }
  }
}