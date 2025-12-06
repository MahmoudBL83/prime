import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // Verify admin authentication
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Get current user from database
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser || currentUser.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        // Get user details
        const user = await prisma.user.findUnique({
            where: { id: id },
            include: {
                _count: {
                    select: {
                        enrollments: true,
                        subscriptions: true,
                    }
                },
                creator: {
                    include: {
                        _count: {
                            select: {
                                courses: true,
                            }
                        }
                    }
                },
                enrollments: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        course: {
                            select: {
                                title: true,
                                titleAr: true,
                            }
                        }
                    }
                }
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ user })

    } catch (error) {
        console.error('Admin user details API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // Verify admin authentication
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Get current user from database
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser || currentUser.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { action, ...updateData } = body

        // Prevent admin from changing their own role or deleting themselves
        if (id === currentUser.id) {
            if (action === 'delete' || (updateData.role && updateData.role !== UserRole.ADMIN)) {
                return NextResponse.json(
                    { error: 'Cannot modify your own admin account' },
                    { status: 400 }
                )
            }
        }

        let updatedUser

        switch (action) {
            case 'updateRole':
                if (!updateData.role || !Object.values(UserRole).includes(updateData.role)) {
                    return NextResponse.json(
                        { error: 'Invalid role specified' },
                        { status: 400 }
                    )
                }

                updatedUser = await prisma.user.update({
                    where: { id: id },
                    data: { role: updateData.role }
                })
                break

            case 'updateProfile':
                updatedUser = await prisma.user.update({
                    where: { id: id },
                    data: {
                        name: updateData.name,
                        arabicName: updateData.arabicName,
                        phone: updateData.phone,
                        bio: updateData.bio,
                    }
                })
                break

            case 'verifyEmail':
                updatedUser = await prisma.user.update({
                    where: { id: id },
                    data: { emailVerified: new Date() }
                })
                break

            case 'unverifyEmail':
                updatedUser = await prisma.user.update({
                    where: { id: id },
                    data: { emailVerified: null }
                })
                break

            case 'completeOnboarding':
                updatedUser = await prisma.user.update({
                    where: { id: id },
                    data: { onboardingCompleted: true } as any
                })
                break

            default:
                return NextResponse.json(
                    { error: 'Invalid action specified' },
                    { status: 400 }
                )
        }

        return NextResponse.json({
            user: updatedUser,
            message: 'User updated successfully'
        })

    } catch (error) {
        console.error('Admin user update API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // Verify admin authentication
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Get current user from database
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser || currentUser.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        // Prevent admin from deleting themselves
        if (id === currentUser.id) {
            return NextResponse.json(
                { error: 'Cannot delete your own admin account' },
                { status: 400 }
            )
        }

        // Check if user exists
        const userToDelete = await prisma.user.findUnique({
            where: { id: id },
            include: {
                creator: true
            }
        })

        if (!userToDelete) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Delete related records in the correct order to avoid foreign key constraint errors
        // Use a transaction with extended timeout for complex user deletion
        await prisma.$transaction(async (tx) => {
            // Delete payment transactions first (they reference subscriptions)
            await tx.paymentTransaction.deleteMany({
                where: { userId: id }
            })

            // Delete subscriptions
            await tx.subscription.deleteMany({
                where: { userId: id }
            })

            // Delete channel subscriptions
            await tx.channelSubscription.deleteMany({
                where: { userId: id }
            })

            // Delete mentor subscriptions (as student)
            await tx.mentorSubscription.deleteMany({
                where: { studentId: id }
            })

            // Delete enrollments
            await tx.enrollment.deleteMany({
                where: { userId: id }
            })

            // Delete user reviews
            await tx.review.deleteMany({
                where: { userId: id }
            })

            // Delete lesson progress
            await tx.lessonProgress.deleteMany({
                where: { userId: id }
            })

            // Delete video notes
            await tx.videoNote.deleteMany({
                where: { userId: id }
            })

            // Delete video bookmarks
            await tx.videoBookmark.deleteMany({
                where: { userId: id }
            })

            // Delete quiz attempts and answers
            const quizAttempts = await tx.quizAttempt.findMany({
                where: { userId: id }
            })
            for (const attempt of quizAttempts) {
                await tx.quizAnswer.deleteMany({
                    where: { attemptId: attempt.id }
                })
            }
            await tx.quizAttempt.deleteMany({
                where: { userId: id }
            })

            // Delete assignment submissions
            await tx.assignmentSubmission.deleteMany({
                where: { userId: id }
            })

            // Delete notifications
            await tx.notification.deleteMany({
                where: { userId: id }
            })

            // Delete messages (sent by user)
            await tx.message.deleteMany({
                where: { senderId: id }
            })

            // Delete conversation participants
            await tx.conversationParticipant.deleteMany({
                where: { userId: id }
            })

            // Delete post likes, comments, bookmarks
            await tx.postLike.deleteMany({
                where: { userId: id }
            })
            await tx.postComment.deleteMany({
                where: { userId: id }
            })
            await tx.postBookmark.deleteMany({
                where: { userId: id }
            })

            // Delete poll votes
            await tx.pollVote.deleteMany({
                where: { userId: id }
            })

            // Delete group memberships
            await tx.groupMember.deleteMany({
                where: { userId: id }
            })

            // Delete channel group memberships
            await tx.channelGroupMember.deleteMany({
                where: { userId: id }
            })

            // Delete session attendees
            await tx.sessionAttendee.deleteMany({
                where: { userId: id }
            })

            // Delete scholarship applications
            await tx.scholarshipApplication.deleteMany({
                where: { applicantId: id }
            })

            // Delete study preferences
            await tx.studyPreferences.deleteMany({
                where: { userId: id }
            })

            // Delete swipe actions (both directions)
            await tx.swipeAction.deleteMany({
                where: { OR: [{ swiperId: id }, { swipedId: id }] }
            })

            // Delete support tickets and messages
            const tickets = await tx.supportTicket.findMany({
                where: { userId: id }
            })
            for (const ticket of tickets) {
                await tx.supportTicketMessage.deleteMany({
                    where: { ticketId: ticket.id }
                })
            }
            await tx.supportTicket.deleteMany({
                where: { userId: id }
            })

            // Delete achievements
            await tx.achievement.deleteMany({
                where: { userId: id }
            })

            // Delete user XP
            await tx.userXP.deleteMany({
                where: { userId: id }
            })

            // Delete XP transactions
            await tx.xPTransaction.deleteMany({
                where: { userId: id }
            })

            // Delete user badges
            await tx.userBadge.deleteMany({
                where: { userId: id }
            })

            // Delete project submissions
            await tx.projectSubmission.deleteMany({
                where: { userId: id }
            })

            // Delete peer reviews
            await tx.peerReview.deleteMany({
                where: { reviewerId: id }
            })

            // Delete certificates
            await tx.certificate.deleteMany({
                where: { userId: id }
            })

            // Delete video progress
            await tx.videoProgress.deleteMany({
                where: { userId: id }
            })

            // Delete user blocks (both directions)
            await tx.userBlock.deleteMany({
                where: { OR: [{ blockerId: id }, { blockedId: id }] }
            })

            // Delete reports
            await tx.report.deleteMany({
                where: { reporterId: id }
            })

            // Delete instructor follows
            await tx.instructorFollow.deleteMany({
                where: { userId: id }
            })

            // Delete meetings
            await tx.meeting.deleteMany({
                where: { studentId: id }
            })

            // If user is a creator, delete their creator profile and related data
            if (userToDelete.creator) {
                const creatorId = userToDelete.creator.id

                // Delete mentor subscriptions (as mentor)
                await tx.mentorSubscription.deleteMany({
                    where: { mentorId: creatorId }
                })

                // Delete creator earnings
                await tx.creatorEarnings.deleteMany({
                    where: { creatorId: creatorId }
                })

                // Delete creator payouts
                await tx.creatorPayout.deleteMany({
                    where: { creatorId: creatorId }
                })

                // Delete creator analytics
                await tx.creatorAnalytics.deleteMany({
                    where: { creatorId: creatorId }
                })

                // Delete content strikes
                await tx.contentStrike.deleteMany({
                    where: { creatorId: creatorId }
                })

                // Delete creator channel and related content
                const channel = await tx.creatorChannel.findUnique({
                    where: { creatorId: creatorId }
                })

                if (channel) {
                    // Delete membership tiers
                    await tx.membershipTier.deleteMany({
                        where: { channelId: channel.id }
                    })

                    // Delete channel subscriptions for this channel
                    await tx.channelSubscription.deleteMany({
                        where: { channelId: channel.id }
                    })

                    // Delete subscriptions for this channel
                    await tx.subscription.deleteMany({
                        where: { channelId: channel.id }
                    })

                    // Delete channel posts and related
                    const posts = await tx.channelPost.findMany({
                        where: { channelId: channel.id }
                    })
                    for (const post of posts) {
                        await tx.postLike.deleteMany({
                            where: { postId: post.id }
                        })
                        await tx.postComment.deleteMany({
                            where: { postId: post.id }
                        })
                        await tx.postBookmark.deleteMany({
                            where: { postId: post.id }
                        })
                    }
                    await tx.channelPost.deleteMany({
                        where: { channelId: channel.id }
                    })

                    // Delete live sessions
                    const liveSessions = await tx.liveSession.findMany({
                        where: { channelId: channel.id }
                    })
                    for (const session of liveSessions) {
                        await tx.sessionAttendee.deleteMany({
                            where: { sessionId: session.id }
                        })
                    }
                    await tx.liveSession.deleteMany({
                        where: { channelId: channel.id }
                    })

                    // Delete community resources
                    await tx.communityResource.deleteMany({
                        where: { channelId: channel.id }
                    })

                    // Delete member groups
                    const memberGroups = await tx.memberGroup.findMany({
                        where: { channelId: channel.id }
                    })
                    for (const group of memberGroups) {
                        await tx.channelGroupMember.deleteMany({
                            where: { groupId: group.id }
                        })
                        await tx.groupModerator.deleteMany({
                            where: { groupId: group.id }
                        })
                        await tx.groupPost.deleteMany({
                            where: { groupId: group.id }
                        })
                    }
                    await tx.memberGroup.deleteMany({
                        where: { channelId: channel.id }
                    })

                    // Delete member messages
                    await tx.memberMessage.deleteMany({
                        where: { channelId: channel.id }
                    })

                    // Delete member polls
                    const polls = await tx.memberPoll.findMany({
                        where: { channelId: channel.id }
                    })
                    for (const poll of polls) {
                        await tx.pollVote.deleteMany({
                            where: { pollId: poll.id }
                        })
                    }
                    await tx.memberPoll.deleteMany({
                        where: { channelId: channel.id }
                    })

                    await tx.creatorChannel.delete({
                        where: { id: channel.id }
                    })
                }

                // Delete courses and their related data
                const courses = await tx.course.findMany({
                    where: { creatorId: creatorId }
                })

                for (const course of courses) {
                    // Delete course enrollments
                    await tx.enrollment.deleteMany({
                        where: { courseId: course.id }
                    })

                    // Delete course reviews (admin quality reviews)
                    await tx.courseReview.deleteMany({
                        where: { courseId: course.id }
                    })

                    // Delete user reviews
                    await tx.review.deleteMany({
                        where: { courseId: course.id }
                    })

                    // Delete course interactions
                    await tx.courseInteraction.deleteMany({
                        where: { courseId: course.id }
                    })

                    // Delete lessons and their related data
                    const lessons = await tx.lesson.findMany({
                        where: { courseId: course.id }
                    })

                    for (const lesson of lessons) {
                        await tx.lessonProgress.deleteMany({
                            where: { lessonId: lesson.id }
                        })
                        await tx.videoNote.deleteMany({
                            where: { lessonId: lesson.id }
                        })
                        await tx.videoBookmark.deleteMany({
                            where: { lessonId: lesson.id }
                        })
                    }

                    await tx.lesson.deleteMany({
                        where: { courseId: course.id }
                    })

                    // Delete quizzes and their attempts
                    const quizzes = await tx.quiz.findMany({
                        where: { courseId: course.id }
                    })

                    for (const quiz of quizzes) {
                        const attempts = await tx.quizAttempt.findMany({
                            where: { quizId: quiz.id }
                        })
                        for (const attempt of attempts) {
                            await tx.quizAnswer.deleteMany({
                                where: { attemptId: attempt.id }
                            })
                        }
                        await tx.quizAttempt.deleteMany({
                            where: { quizId: quiz.id }
                        })
                        await tx.question.deleteMany({
                            where: { quizId: quiz.id }
                        })
                    }

                    await tx.quiz.deleteMany({
                        where: { courseId: course.id }
                    })

                    // Delete assignments and submissions
                    const assignments = await tx.assignment.findMany({
                        where: { courseId: course.id }
                    })

                    for (const assignment of assignments) {
                        await tx.assignmentSubmission.deleteMany({
                            where: { assignmentId: assignment.id }
                        })
                    }

                    await tx.assignment.deleteMany({
                        where: { courseId: course.id }
                    })

                    // Delete certificates for this course
                    await tx.certificate.deleteMany({
                        where: { courseId: course.id }
                    })
                }

                // Delete all courses
                await tx.course.deleteMany({
                    where: { creatorId: creatorId }
                })

                // Delete instructor availability
                await tx.instructorAvailability.deleteMany({
                    where: { creatorId: creatorId }
                })

                // Delete video call sessions
                await tx.videoCallSession.deleteMany({
                    where: { hostId: id }
                })

                // Delete creator profile
                await tx.creator.delete({
                    where: { id: creatorId }
                })
            }

            // Delete account and sessions
            await tx.session.deleteMany({
                where: { userId: id }
            })

            // Finally delete the user
            await tx.user.delete({
                where: { id: id }
            })
        }, {
            maxWait: 60000, // 60 seconds max wait for transaction to start
            timeout: 120000, // 120 seconds timeout for the transaction
        })

        return NextResponse.json({
            message: 'User deleted successfully'
        })

    } catch (error) {
        console.error('Admin user delete API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
