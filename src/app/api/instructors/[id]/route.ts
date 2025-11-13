import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Fetch instructor with comprehensive data
        const instructor = await prisma.creator.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        arabicName: true,
                        email: true,
                        bio: true,
                        profileImage: true,
                        interests: true,
                        goals: true,
                        createdAt: true
                    }
                },
                courses: {
                    where: {
                        status: 'PUBLISHED'
                    },
                    select: {
                        id: true,
                        title: true,
                        titleAr: true,
                        description: true,
                        thumbnail: true,
                        price: true,
                        rating: true,
                        totalEnrollments: true,
                        duration: true,
                        category: true,
                        skillLevel: true,
                        createdAt: true
                    },
                    orderBy: {
                        totalEnrollments: 'desc'
                    }
                },
                channels: {
                    select: {
                        id: true,
                        name: true,
                        nameAr: true,
                        description: true,
                        descriptionAr: true,
                        coverImage: true,
                        tiers: true,
                        _count: {
                            select: {
                                posts: true,
                                subscriptions: true
                            }
                        }
                    },
                    take: 1
                },
                _count: {
                    select: {
                        followers: true,
                        courses: {
                            where: {
                                status: 'PUBLISHED'
                            }
                        },
                        meetings: {
                            where: {
                                status: 'COMPLETED'
                            }
                        }
                    }
                }
            }
        })

        if (!instructor) {
            return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
        }

        // Fetch channel tiers separately
        let channelWithTiers = null
        if (instructor.channels && instructor.channels.length > 0) {
            const channel = instructor.channels[0]
            const tiers = typeof channel.tiers === 'string' ? JSON.parse(channel.tiers as string) : channel.tiers

            channelWithTiers = {
                id: channel.id,
                name: channel.name,
                nameAr: channel.nameAr,
                description: channel.description,
                descriptionAr: channel.descriptionAr,
                coverImage: channel.coverImage,
                totalSubscribers: channel._count.subscriptions,
                totalPosts: channel._count.posts,
                tiers: Array.isArray(tiers) ? tiers : []
            }
        }

        // Parse JSON fields safely - check if already parsed
        const meetingTypes = typeof instructor.meetingTypes === 'string' ? 
            JSON.parse(instructor.meetingTypes) : (instructor.meetingTypes || [])
        const certifications = typeof instructor.certifications === 'string' ? 
            JSON.parse(instructor.certifications) : (instructor.certifications || [])
        const socialLinks = typeof instructor.socialLinks === 'string' ? 
            JSON.parse(instructor.socialLinks) : (instructor.socialLinks || {})

        // Calculate total students across all courses
        const totalStudents = instructor.courses.reduce(
            (sum: number, course: any) => sum + course.totalEnrollments, 0
        )

        // Calculate average course rating
        const averageRating = instructor.courses.length > 0 ? 
            instructor.courses.reduce((sum: number, course: any) => sum + course.rating, 0) / instructor.courses.length 
            : 0

        // Get recent reviews for this instructor
        const recentReviews = await prisma.review.findMany({
            where: {
                course: {
                    creatorId: instructor.id
                }
            },
            include: {
                user: {
                    select: {
                        name: true,
                        arabicName: true,
                        profileImage: true
                    }
                },
                course: {
                    select: {
                        title: true,
                        titleAr: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5
        })

        // Format the response
        const formattedInstructor = {
            id: instructor.id,
            user: instructor.user,
            kycStatus: instructor.kycStatus,
            expertise: instructor.expertise,
            teachingGoals: instructor.teachingGoals,
            totalEarnings: instructor.totalEarnings,
            totalSubscribers: instructor.totalSubscribers,
            hourlyRate: instructor.hourlyRate,
            availableForMeetings: instructor.availableForMeetings,
            timezone: instructor.timezone,
            languages: instructor.languages,
            meetingTypes,
            certifications,
            socialLinks,
            createdAt: instructor.createdAt,
            updatedAt: instructor.updatedAt,
            
            // Statistics
            stats: {
                totalFollowers: instructor._count.followers,
                totalCourses: instructor._count.courses,
                totalStudents,
                completedMeetings: instructor._count.meetings,
                averageRating: Math.round(averageRating * 10) / 10,
                yearsOfExperience: new Date().getFullYear() - new Date(instructor.createdAt).getFullYear()
            },

            // Course portfolio
            courses: instructor.courses.map((course: any) => ({
                ...course,
                formattedDuration: `${Math.floor(course.duration / 60)}h ${course.duration % 60}m`
            })),

            // Recent testimonials
            recentReviews,

            // Creator Channel
            channel: channelWithTiers
        }

        return NextResponse.json({ instructor: formattedInstructor })
    } catch (error) {
        console.error('Instructor profile fetch error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch instructor profile' },
            { status: 500 }
        )
    }
}