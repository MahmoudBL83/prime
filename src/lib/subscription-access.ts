import { prisma } from '@/lib/prisma'

/**
 * Check if a user has access to a specific course based on their subscriptions
 */
export async function checkCourseAccess(
    userId: string,
    courseId: string
): Promise<{
    hasAccess: boolean
    reason?: string
    subscriptionType?: string
}> {
    try {
        // Get the course with its content category
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                contentCategory: true,
                creatorId: true,
                status: true
            }
        })

        if (!course) {
            return { hasAccess: false, reason: 'Course not found' }
        }

        if (course.status !== 'PUBLISHED') {
            return { hasAccess: false, reason: 'Course not published' }
        }

        // Get user's active subscriptions
        const activeSubscriptions = await prisma.subscription.findMany({
            where: {
                userId,
                status: {
                    in: ['ACTIVE', 'CANCELLED'] // Cancelled but still valid until end date
                },
                endDate: {
                    gte: new Date()
                }
            },
            include: {
                channel: {
                    select: {
                        creatorId: true
                    }
                }
            }
        })

        if (activeSubscriptions.length === 0) {
            return { 
                hasAccess: false, 
                reason: 'No active subscription. Subscribe to get access!' 
            }
        }

        // Check access based on course category
        switch (course.contentCategory) {
            case 'CATEGORY_A':
                // Category A courses require CATEGORY_A, BUNDLE_AB, or BUNDLE_ABC subscription
                const hasAccessToA = activeSubscriptions.some(sub =>
                    sub.type === 'CATEGORY_A' || 
                    sub.type === 'BUNDLE_AB' || 
                    sub.type === 'BUNDLE_ABC'
                )
                if (hasAccessToA) {
                    return { hasAccess: true, subscriptionType: 'All-Access Library' }
                }
                break

            case 'CATEGORY_B':
                // Category B courses require CATEGORY_B, BUNDLE_AB, or BUNDLE_ABC subscription
                const hasAccessToB = activeSubscriptions.some(sub =>
                    sub.type === 'CATEGORY_B' || 
                    sub.type === 'BUNDLE_AB' || 
                    sub.type === 'BUNDLE_ABC'
                )
                if (hasAccessToB) {
                    return { hasAccess: true, subscriptionType: 'Signature Courses' }
                }
                break

            case 'CATEGORY_C':
                // Category C courses require subscription to the specific creator's channel or BUNDLE_ABC
                const hasAccessToC = activeSubscriptions.some(sub =>
                    sub.type === 'BUNDLE_ABC' ||
                    (sub.type === 'CATEGORY_C' && sub.channel?.creatorId === course.creatorId)
                )
                if (hasAccessToC) {
                    return { hasAccess: true, subscriptionType: 'Creator Channel' }
                }
                break
        }

        return { 
            hasAccess: false, 
            reason: getCategoryAccessMessage(course.contentCategory)
        }

    } catch (error) {
        console.error('Error checking course access:', error)
        return { hasAccess: false, reason: 'Error checking access' }
    }
}

/**
 * Get all courses a user has access to based on their subscriptions
 */
export async function getUserAccessibleCourses(userId: string) {
    try {
        // Get user's active subscriptions
        const activeSubscriptions = await prisma.subscription.findMany({
            where: {
                userId,
                status: {
                    in: ['ACTIVE', 'CANCELLED']
                },
                endDate: {
                    gte: new Date()
                }
            },
            include: {
                channel: {
                    select: {
                        creatorId: true
                    }
                }
            }
        })

        if (activeSubscriptions.length === 0) {
            return []
        }

        // Build query conditions based on subscription types
        const categoryConditions: any[] = []

        // Check for Category A access
        if (activeSubscriptions.some(s => 
            s.type === 'CATEGORY_A' || s.type === 'BUNDLE_AB' || s.type === 'BUNDLE_ABC'
        )) {
            categoryConditions.push({ contentCategory: 'CATEGORY_A' })
        }

        // Check for Category B access
        if (activeSubscriptions.some(s => 
            s.type === 'CATEGORY_B' || s.type === 'BUNDLE_AB' || s.type === 'BUNDLE_ABC'
        )) {
            categoryConditions.push({ contentCategory: 'CATEGORY_B' })
        }

        // Check for Category C access (specific creators)
        const categoryCCreatorIds = activeSubscriptions
            .filter(s => s.type === 'CATEGORY_C' && s.channel?.creatorId)
            .map(s => s.channel!.creatorId)

        if (categoryCCreatorIds.length > 0) {
            categoryConditions.push({
                AND: [
                    { contentCategory: 'CATEGORY_C' },
                    { creatorId: { in: categoryCCreatorIds } }
                ]
            })
        }

        // If user has BUNDLE_ABC, they get everything
        const hasBundleABC = activeSubscriptions.some(s => s.type === 'BUNDLE_ABC')
        
        if (hasBundleABC) {
            // Get all published courses
            return await prisma.course.findMany({
                where: {
                    status: 'PUBLISHED'
                },
                include: {
                    creator: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    arabicName: true,
                                    profileImage: true
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            enrollments: true,
                            lessons: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })
        }

        if (categoryConditions.length === 0) {
            return []
        }

        // Get courses matching any of the category conditions
        return await prisma.course.findMany({
            where: {
                status: 'PUBLISHED',
                OR: categoryConditions
            },
            include: {
                creator: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                arabicName: true,
                                profileImage: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        enrollments: true,
                        lessons: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

    } catch (error) {
        console.error('Error getting accessible courses:', error)
        return []
    }
}

/**
 * Auto-enroll user when they access a course they have subscription access to
 */
export async function autoEnrollInCourse(userId: string, courseId: string) {
    try {
        // Check if they have access first
        const access = await checkCourseAccess(userId, courseId)
        
        if (!access.hasAccess) {
            return { success: false, reason: access.reason }
        }

        // Create or update enrollment
        const enrollment = await prisma.enrollment.upsert({
            where: {
                userId_courseId: {
                    userId,
                    courseId
                }
            },
            create: {
                userId,
                courseId,
                progress: 0,
                lastAccessedAt: new Date()
            },
            update: {
                lastAccessedAt: new Date()
            }
        })

        return { success: true, enrollment }

    } catch (error) {
        console.error('Error auto-enrolling:', error)
        return { success: false, reason: 'Failed to enroll' }
    }
}

/**
 * Get message for why user doesn't have access to a category
 */
function getCategoryAccessMessage(category: string): string {
    switch (category) {
        case 'CATEGORY_A':
            return 'Subscribe to All-Access Library to unlock this course and 500+ more!'
        case 'CATEGORY_B':
            return 'Subscribe to Signature Courses to access this premium curated content!'
        case 'CATEGORY_C':
            return 'Subscribe to this creator\'s channel to access their exclusive content!'
        default:
            return 'Subscription required to access this course'
    }
}
