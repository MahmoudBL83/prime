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

        // Get discussion details (using VideoComment as discussion)
        const discussion = await prisma.videoComment.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                videoAsset: {
                    select: {
                        id: true,
                        title: true,
                        course: {
                            select: {
                                id: true,
                                title: true,
                                creatorId: true
                            }
                        }
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

        // Check if the video asset and course exist
        if (!discussion.videoAsset || !discussion.videoAsset.course) {
            return NextResponse.json(
                { error: 'Invalid discussion - missing video asset or course' },
                { status: 400 }
            )
        }

        const notifications = []

        // Notify discussion author (if not the one replying)
        if (type === 'reply' && discussion.userId !== (session.user as any).id) {
            notifications.push({
                userId: discussion.userId,
                type: 'DISCUSSION_REPLY' as any,
                title: 'New reply to your discussion',
                message: `${session.user.name} replied to your comment on "${discussion.videoAsset?.title || 'a video'}"`,
                link: `/courses/${discussion.videoAsset.course.id}/watch/${discussion.videoAssetId}#comment-${discussion.id}`,
                metadata: {
                    discussionId: discussion.id,
                    replyId,
                    courseId: discussion.videoAsset.course.id
                }
            })
        }

        // Notify course creator (if they're not the author or replier)
        if (type === 'reply' && 
            discussion.videoAsset.course.creatorId !== (session.user as any).id && 
            discussion.videoAsset.course.creatorId !== discussion.userId) {
            notifications.push({
                userId: discussion.videoAsset.course.creatorId,
                type: 'DISCUSSION_REPLY' as any,
                title: 'New discussion reply in your course',
                message: `${session.user.name} replied to a comment on "${discussion.videoAsset?.title || 'a video'}"`,
                link: `/courses/${discussion.videoAsset.course.id}/watch/${discussion.videoAssetId}#comment-${discussion.id}`,
                metadata: {
                    discussionId: discussion.id,
                    replyId,
                    courseId: discussion.videoAsset.course.id
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
                    if (user.id !== (session.user as any).id && discussion.videoAsset?.course) {
                        notifications.push({
                            userId: user.id,
                            type: 'DISCUSSION_MENTION' as any,
                            title: 'You were mentioned in a discussion',
                            message: `${session.user.name} mentioned you in a video comment`,
                            link: `/courses/${discussion.videoAsset.course.id}/watch/${discussion.videoAssetId}#comment-${discussion.id}`,
                            metadata: {
                                discussionId: discussion.id,
                                replyId,
                                courseId: discussion.videoAsset.course.id
                            }
                        })
                    }
                })
            }
        }

        // Best answer notification (using VideoComment for reply)
        if (type === 'best_answer' && replyId) {
            const reply = await prisma.videoComment.findUnique({
                where: { id: replyId },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            })

            if (reply && reply.userId !== (session.user as any).id) {
                notifications.push({
                    userId: reply.userId,
                    type: 'BEST_ANSWER' as any,
                    title: '🏆 Your answer was marked as best!',
                    message: `Your reply was marked as the best answer`,
                    link: `/courses/${discussion.videoAsset.course.id}/watch/${discussion.videoAssetId}#comment-${discussion.id}`,
                    metadata: {
                        discussionId: discussion.id,
                        replyId,
                        courseId: discussion.videoAsset.course.id
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
