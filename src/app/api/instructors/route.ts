import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Cache for instructors data - 10 minutes cache
const instructorsCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

export async function GET() {
    try {
        const cacheKey = 'verified-instructors'
        const cached = instructorsCache.get(cacheKey)
        
        // Return cached data if valid
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return NextResponse.json(cached.data)
        }

        // Optimized single query with selective fields and aggregates
        const instructors = await prisma.creator.findMany({
            where: {
                kycStatus: 'VERIFIED'
            },
            select: {
                id: true,
                kycStatus: true,
                expertise: true,
                hourlyRate: true,
                basicMonthlyPrice: true,
                basicYearlyPrice: true,
                premiumMonthlyPrice: true,
                premiumYearlyPrice: true,
                vipMonthlyPrice: true,
                vipYearlyPrice: true,
                totalSubscribers: true,
                availableForMeetings: true,
                languages: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        arabicName: true,
                        bio: true,
                        profileImage: true,
                        createdAt: true
                    }
                },
                channels: {
                    select: {
                        id: true,
                        name: true,
                        nameAr: true,
                        totalSubscribers: true
                    }
                },
                _count: {
                    select: {
                        courses: true,
                        followers: true,
                        meetings: {
                            where: {
                                status: 'COMPLETED'
                            }
                        }
                    }
                }
            },
            orderBy: {
                totalSubscribers: 'desc'
            }
        })

        // Get aggregated course data for all instructors in parallel
        const courseStats = await prisma.course.groupBy({
            by: ['creatorId'],
            where: {
                creatorId: { in: instructors.map(i => i.id) }
            },
            _sum: {
                totalEnrollments: true,
                rating: true
            },
            _count: {
                id: true
            }
        })

        // Create lookup map for performance
        const courseStatsMap = new Map(
            courseStats.map(stat => [
                stat.creatorId,
                {
                    totalEnrollments: stat._sum.totalEnrollments || 0,
                    totalRating: stat._sum.rating || 0,
                    courseCount: stat._count.id || 0
                }
            ])
        )

        // Transform data efficiently
        const instructorsWithStats = instructors.map((instructor) => {
            const stats = courseStatsMap.get(instructor.id) || {
                totalEnrollments: 0,
                totalRating: 0,
                courseCount: 0
            }

            const averageRating = stats.courseCount > 0 
                ? parseFloat((stats.totalRating / stats.courseCount).toFixed(1))
                : 5.0

            // Calculate years of experience efficiently
            const yearsOfExperience = Math.max(1, 
                Math.floor((Date.now() - new Date(instructor.user.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365))
            )

            return {
                id: instructor.id,
                userId: instructor.user.id,
                channels: instructor.channels,
                user: {
                    id: instructor.user.id,
                    name: instructor.user.name,
                    arabicName: instructor.user.arabicName || instructor.user.name,
                    bio: instructor.user.bio || '', // No fake bio
                    profileImage: instructor.user.profileImage
                },
                kycStatus: instructor.kycStatus,
                expertise: instructor.expertise || '', // No fake expertise
                hourlyRate: instructor.hourlyRate || 0,
                basicMonthlyPrice: instructor.basicMonthlyPrice,
                basicYearlyPrice: instructor.basicYearlyPrice,
                premiumMonthlyPrice: instructor.premiumMonthlyPrice,
                premiumYearlyPrice: instructor.premiumYearlyPrice,
                vipMonthlyPrice: instructor.vipMonthlyPrice,
                vipYearlyPrice: instructor.vipYearlyPrice,
                totalSubscribers: instructor.totalSubscribers || 0,
                availableForMeetings: instructor.availableForMeetings,
                languages: instructor.languages || '', // No fake languages
                stats: {
                    totalCourses: stats.courseCount,
                    totalStudents: stats.totalEnrollments,
                    averageRating,
                    totalFollowers: instructor._count.followers,
                    yearsOfExperience,
                    completedMeetings: instructor._count.meetings
                }
            }
        })

        const result = {
            success: true,
            instructors: instructorsWithStats,
            total: instructorsWithStats.length
        }

        // Cache the result
        instructorsCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        })

        // Clean old cache entries
        if (instructorsCache.size > 5) {
            const now = Date.now()
            for (const [key, value] of instructorsCache.entries()) {
                if (now - value.timestamp > CACHE_DURATION) {
                    instructorsCache.delete(key)
                }
            }
        }

        return NextResponse.json(result)

    } catch (error) {
        console.error('Error fetching instructors:', error)
        return NextResponse.json(
            { 
                success: false, 
                message: 'Failed to fetch instructors',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
