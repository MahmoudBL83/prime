import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bookMeetingSchema = z.object({
    scheduledAt: z.string().refine((val) => {
        console.log('Validating scheduledAt:', val);
        if (!val || typeof val !== 'string') {
            console.log('scheduledAt is not a string:', typeof val);
            return false;
        }
        const date = new Date(val);
        const isValid = !isNaN(date.getTime());
        const isFuture = date > new Date();
        console.log('Date validation:', { val, isValid, isFuture, parsed: date.toISOString() });
        return isValid && isFuture;
    }, {
        message: "scheduledAt must be a valid future datetime string"
    }),
    duration: z.number().int().min(15).max(180), // 15 minutes to 3 hours
    meetingType: z.enum(['CONSULTATION', 'COURSE_HELP', 'CAREER_ADVICE', 'CODE_REVIEW', 'MOCK_INTERVIEW', 'MENTORSHIP']),
    title: z.string().min(1).max(100), // Changed from 5 to 1 to allow shorter titles
    description: z.string().optional().default(''),
})

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: creatorId } = await params;
        const body = await req.json()
        
        console.log('Meeting booking request:', {
            creatorId,
            body,
            userId: session.user.id
        });
        
        const validation = bookMeetingSchema.safeParse(body)

        if (!validation.success) {
            console.error('Validation failed details:', JSON.stringify(validation.error.issues, null, 2));
            return NextResponse.json(
                { 
                    error: 'Invalid request data', 
                    details: validation.error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                        received: err.code === 'invalid_type' && 'received' in err ? err.received : undefined
                    }))
                },
                { status: 400 }
            )
        }

        const { scheduledAt, duration, meetingType, title, description } = validation.data

        // Check if the creator exists and is available for meetings
        const creator = await prisma.creator.findUnique({
            where: { id: creatorId },
            include: {
                availability: true,
                user: {
                    select: {
                        name: true,
                        arabicName: true,
                        email: true
                    }
                }
            }
        })

        if (!creator) {
            console.error('Creator not found:', creatorId);
            return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
        }

        if (!creator.availableForMeetings) {
            console.error('Creator not available for meetings:', creatorId);
            return NextResponse.json({ error: 'Instructor is not available for meetings' }, { status: 400 })
        }

        // ⭐ CHECK ACTIVE SUBSCRIPTION (OnlyFans Model)
        const subscription = await prisma.mentorSubscription.findFirst({
            where: {
                studentId: session.user.id,
                creatorId: creatorId,
                status: 'ACTIVE',
                endDate: {
                    gte: new Date(), // Not expired
                },
            },
        });

        if (!subscription) {
            console.error('No active subscription found for user:', session.user.id, 'with creator:', creatorId);
            return NextResponse.json(
                { 
                    error: 'Active subscription required',
                    message: 'You need an active subscription to book meetings with this mentor',
                    subscribeUrl: `/mentors/${creatorId}`,
                },
                { status: 403 }
            );
        }

        // Check meeting limits based on subscription tier
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const meetingsThisMonth = await prisma.meeting.count({
            where: {
                studentId: session.user.id,
                creatorId: creatorId,
                status: {
                    in: ['SCHEDULED', 'COMPLETED'],
                },
                scheduledAt: {
                    gte: firstDayOfMonth,
                    lte: lastDayOfMonth,
                },
            },
        });

        // Enforce meeting limits
        if (subscription.monthlyMeetings !== null && meetingsThisMonth >= subscription.monthlyMeetings) {
            console.error(
                `Meeting limit reached for user ${session.user.id}:`,
                `${meetingsThisMonth}/${subscription.monthlyMeetings} meetings used this month`
            );
            return NextResponse.json(
                {
                    error: 'Meeting limit reached',
                    message: `You have used all ${subscription.monthlyMeetings} meetings for this month. Upgrade to Premium or VIP for more meetings.`,
                    currentUsage: meetingsThisMonth,
                    limit: subscription.monthlyMeetings,
                    upgradeUrl: `/mentors/${creatorId}`,
                },
                { status: 403 }
            );
        }

        // Enforce meeting duration limits
        if (duration > (subscription.meetingDuration || 30)) {
            console.error(
                `Meeting duration exceeds limit for user ${session.user.id}:`,
                `Requested ${duration} min, max allowed: ${subscription.meetingDuration} min`
            );
            return NextResponse.json(
                {
                    error: 'Meeting duration exceeds limit',
                    message: `Your ${subscription.tier} plan allows meetings up to ${subscription.meetingDuration} minutes. Please reduce the duration or upgrade your plan.`,
                    requestedDuration: duration,
                    maxDuration: subscription.meetingDuration,
                    upgradeUrl: `/mentors/${creatorId}`,
                },
                { status: 403 }
            );
        }

        console.log(
            `✅ Subscription verified for user ${session.user.id}:`,
            `Tier: ${subscription.tier}, Meetings: ${meetingsThisMonth}/${subscription.monthlyMeetings || '∞'}`
        );

        // Get meeting type configuration (make it optional)
        let meetingTypes = [];
        try {
            if (creator.meetingTypes) {
                meetingTypes = JSON.parse(creator.meetingTypes as string);
            }
        } catch (error) {
            console.warn('Failed to parse meeting types for creator:', creatorId, error);
            // Continue with empty array, will allow any meeting type
        }

        // If no specific meeting types configured, allow all
        if (meetingTypes.length > 0) {
            const meetingTypeConfig = meetingTypes.find((mt: any) => mt.type === meetingType);
            if (!meetingTypeConfig) {
                console.error('Meeting type not available:', meetingType, 'Available:', meetingTypes);
                return NextResponse.json({ 
                    error: `Meeting type '${meetingType}' is not available for this instructor`,
                    availableTypes: meetingTypes.map((mt: any) => mt.type)
                }, { status: 400 })
            }
        }

        // Calculate price based on duration and hourly rate
        const hourlyRate = creator.hourlyRate || 50
        const price = (duration / 60) * hourlyRate

        console.log('Meeting pricing:', { duration, hourlyRate, price });

        // Check for scheduling conflicts
        const scheduledDate = new Date(scheduledAt)
        const endTime = new Date(scheduledDate.getTime() + duration * 60 * 1000)

        console.log('Checking conflicts for time slot:', {
            scheduledDate: scheduledDate.toISOString(),
            endTime: endTime.toISOString(),
            duration
        });

        const conflictingMeeting = await prisma.meeting.findFirst({
            where: {
                creatorId: creatorId,
                status: {
                    in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS']
                },
                OR: [
                    {
                        AND: [
                            { scheduledAt: { lte: scheduledDate } },
                            { scheduledAt: { 
                                gte: new Date(scheduledDate.getTime() - (duration * 60 * 1000)) 
                            }}
                        ]
                    },
                    {
                        AND: [
                            { scheduledAt: { gte: scheduledDate } },
                            { scheduledAt: { lt: endTime } }
                        ]
                    }
                ]
            }
        })

        if (conflictingMeeting) {
            console.error('Scheduling conflict found:', conflictingMeeting);
            return NextResponse.json({ 
                error: 'This time slot is already booked. Please choose a different time.' 
            }, { status: 400 })
        }

        console.log('No conflicts found, creating meeting...');

        // Create the meeting
        const meeting = await prisma.meeting.create({
            data: {
                studentId: session.user.id,
                creatorId: creatorId,
                title,
                description,
                scheduledAt: scheduledDate,
                duration,
                meetingType,
                price,
                status: 'SCHEDULED',
                paymentStatus: 'PENDING'
            },
            include: {
                creator: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                arabicName: true,
                                email: true
                            }
                        }
                    }
                },
                student: {
                    select: {
                        name: true,
                        arabicName: true,
                        email: true
                    }
                }
            }
        })

        console.log('Meeting created successfully:', meeting.id);

        // Create notifications for both parties
        try {
            // Notification for the creator/instructor
            await prisma.notification.create({
                data: {
                    userId: creator.userId,
                    type: 'SYSTEM',
                    title: 'حجز جلسة جديدة',
                    message: `تم حجز جلسة جديدة معك من قبل ${session.user.name || session.user.email}`,
                    data: { 
                        meetingId: meeting.id,
                        studentName: session.user.name || session.user.email,
                        scheduledAt: meeting.scheduledAt.toISOString(),
                        meetingType: meeting.meetingType
                    }
                }
            })

            // Notification for the student/learner
            await prisma.notification.create({
                data: {
                    userId: session.user.id,
                    type: 'SYSTEM',
                    title: 'تم تأكيد حجز الجلسة',
                    message: `تم حجز جلستك بنجاح مع ${creator.user.arabicName || creator.user.name}`,
                    data: { 
                        meetingId: meeting.id,
                        instructorName: creator.user.arabicName || creator.user.name,
                        scheduledAt: meeting.scheduledAt.toISOString(),
                        meetingType: meeting.meetingType
                    }
                }
            })

            console.log('Meeting notifications created successfully');
        } catch (notificationError) {
            console.error('Failed to create meeting notifications:', notificationError);
            // Don't fail the meeting creation if notifications fail
        }

        return NextResponse.json({ 
            success: true,
            meeting,
            message: 'Meeting booked successfully' 
        })
    } catch (error) {
        console.error('Book meeting error:', error)
        return NextResponse.json(
            { error: 'Failed to book meeting' },
            { status: 500 }
        )
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: creatorId } = await params;

        // Get instructor's availability and meeting types
        const creator = await prisma.creator.findUnique({
            where: { id: creatorId },
            select: {
                id: true,
                hourlyRate: true,
                availableForMeetings: true,
                meetingTypes: true,
                timezone: true,
                availability: true,
                user: {
                    select: {
                        name: true,
                        arabicName: true
                    }
                }
            }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
        }

        // Get upcoming booked slots to exclude from availability
        const bookedSlots = await prisma.meeting.findMany({
            where: {
                creatorId: creatorId,
                status: {
                    in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS']
                },
                scheduledAt: {
                    gte: new Date()
                }
            },
            select: {
                scheduledAt: true,
                duration: true
            }
        })

        return NextResponse.json({
            instructor: creator,
            bookedSlots
        })
    } catch (error) {
        console.error('Get meeting info error:', error)
        return NextResponse.json(
            { error: 'Failed to get meeting information' },
            { status: 500 }
        )
    }
}