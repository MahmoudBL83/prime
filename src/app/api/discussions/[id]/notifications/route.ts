/**
 * Discussion Notifications API
 * POST /api/discussions/[id]/notifications
 * 
 * Send notifications when someone replies to a discussion or mentions a user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { type, replyId, content } = body // type: 'reply' | 'mention' | 'best_answer'

        // Get discussion details
        const discussion = await prisma.courseDiscussion.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                course: {
                    select: {
                        id: true,
                        title: true,
                        creatorId: true
                    }
                }
            }
        })

        if (!discussion) {
            return NextResponse.json(
                { error: 'Discussion not found' },
                { status: 404 }
            )
        }

        const notifications = []

        // Notify discussion author (if not the one replying)
        if (type === 'reply' && discussion.authorId !== session.user.id) {
            notifications.push({
                userId: discussion.authorId,
                type: 'DISCUSSION_REPLY' as any,
                title: 'New reply to your discussion',
                message: `${session.user.name} replied to "${discussion.title}"`,
                link: `/courses/${discussion.courseId}/discussions/${discussion.id}`,
                metadata: {
                    discussionId: discussion.id,
                    replyId,
                    courseId: discussion.courseId
                }
            })
        }

        // Notify course creator (if they're not the author or replier)
        if (type === 'reply' && 
            discussion.course.creatorId !== session.user.id && 
            discussion.course.creatorId !== discussion.authorId) {
            notifications.push({
                userId: discussion.course.creatorId,
                type: 'DISCUSSION_REPLY' as any,
                title: 'New discussion reply in your course',
                message: `${session.user.name} replied to "${discussion.title}"`,
                link: `/courses/${discussion.courseId}/discussions/${discussion.id}`,
                metadata: {
                    discussionId: discussion.id,
                    replyId,
                    courseId: discussion.courseId
                }
            })
        }

        // Extract mentions from content (@username)
        if (content) {
            const mentionRegex = /@(\w+)/g
            const mentions = content.match(mentionRegex)
            
            if (mentions) {
                const usernames = mentions.map((m: string) => m.substring(1))
                const mentionedUsers = await prisma.user.findMany({
                    where: {
                        name: {
                            in: usernames
                        }
                    },
                    select: {
                        id: true,
                        name: true
                    }
                })

                mentionedUsers.forEach(user => {
                    if (user.id !== session.user.id) {
                        notifications.push({
                            userId: user.id,
                            type: 'DISCUSSION_MENTION' as any,
                            title: 'You were mentioned in a discussion',
                            message: `${session.user.name} mentioned you in "${discussion.title}"`,
                            link: `/courses/${discussion.courseId}/discussions/${discussion.id}`,
                            metadata: {
                                discussionId: discussion.id,
                                replyId,
                                courseId: discussion.courseId
                            }
                        })
                    }
                })
            }
        }

        // Best answer notification
        if (type === 'best_answer' && replyId) {
            const reply = await prisma.discussionReply.findUnique({
                where: { id: replyId },
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            })

            if (reply && reply.authorId !== session.user.id) {
                notifications.push({
                    userId: reply.authorId,
                    type: 'BEST_ANSWER' as any,
                    title: '🏆 Your answer was marked as best!',
                    message: `Your answer to "${discussion.title}" was marked as the best answer`,
                    link: `/courses/${discussion.courseId}/discussions/${discussion.id}`,
                    metadata: {
                        discussionId: discussion.id,
                        replyId,
                        courseId: discussion.courseId
                    }
                })
            }
        }

        // Create all notifications
        if (notifications.length > 0) {
            await prisma.notification.createMany({
                data: notifications
            })
        }

        return NextResponse.json({
            success: true,
            notificationsSent: notifications.length
        })

    } catch (error) {
        console.error('Notification error:', error)
        return NextResponse.json(
            { error: 'Failed to send notifications' },
            { status: 500 }
        )
    }
}
