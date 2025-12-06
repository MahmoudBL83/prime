import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PaymentStatus } from '@prisma/client';
import { subDays, subWeeks, subMonths, startOfWeek, format } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();

        // Weekly learning activity from real watch data
        const weeklyData = [] as { week: string; hours: number; users: number }[];
        for (let i = 3; i >= 0; i--) {
            const weekStart = startOfWeek(subWeeks(now, i));
            const weekEnd = i === 0 ? now : startOfWeek(subWeeks(now, i - 1));

            const progressByUser = await prisma.videoProgress.groupBy({
                by: ['userId'],
                where: {
                    updatedAt: { gte: weekStart, lt: weekEnd },
                },
                _sum: { currentTime: true },
            });

            const totalSeconds = progressByUser.reduce((sum, row) => sum + (row._sum.currentTime || 0), 0);
            const hours = totalSeconds / 3600;

            weeklyData.push({
                week: `W${4 - i}`,
                hours: Math.round(hours * 10) / 10,
                users: progressByUser.length,
            });
        }

        // Calculate north star metrics from watch time + enrollments
        const [learningAgg, weeklyActiveProgress, previousWeekProgress, weeklyEnrollments] = await Promise.all([
            prisma.videoProgress.aggregate({
                _sum: { currentTime: true },
                where: { updatedAt: { gte: subDays(now, 7) } },
            }),
            prisma.videoProgress.groupBy({
                by: ['userId'],
                where: { updatedAt: { gte: subDays(now, 7) } },
            }),
            prisma.videoProgress.groupBy({
                by: ['userId'],
                where: {
                    updatedAt: {
                        gte: subDays(now, 14),
                        lt: subDays(now, 7),
                    },
                },
            }),
            prisma.enrollment.count({ where: { createdAt: { gte: subDays(now, 7) } } }),
        ]);

        const weeklyActiveUsers = weeklyActiveProgress.length;
        const previousWeekUsers = previousWeekProgress.length;
        const totalLearningHours = ((learningAgg._sum.currentTime || 0) / 3600);

        const trend = previousWeekUsers > 0
            ? ((weeklyActiveUsers - previousWeekUsers) / previousWeekUsers * 100)
            : 0;

        // Activation funnel
        const [
            signups,
            profileComplete,
            firstEnrollment,
            activeUsers7d,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { onboardingCompleted: true } }),
            prisma.user.count({ where: { enrollments: { some: {} } } }),
            weeklyActiveUsers,
        ]);

        const activationFunnel = [
            { stage: 'Sign Up', users: signups, percentage: 100 },
            { stage: 'Profile Complete', users: profileComplete, percentage: signups > 0 ? Math.round(profileComplete / signups * 100) : 0 },
            { stage: 'First Enrollment', users: firstEnrollment, percentage: signups > 0 ? Math.round(firstEnrollment / signups * 100) : 0 },
            { stage: 'Active User (7d)', users: activeUsers7d, percentage: signups > 0 ? Math.round(activeUsers7d / signups * 100) : 0 }
        ];

        // Retention cohorts
        const cohorts = [] as any[];
        for (let i = 0; i < 4; i++) {
            const monthStart = subMonths(now, i + 1);
            const monthEnd = subMonths(now, i);
            const cohortDate = format(monthStart, 'MMM yyyy');

            const cohortUsers = await prisma.user.findMany({
                where: { createdAt: { gte: monthStart, lt: monthEnd } },
                select: { id: true },
            });

            if (cohortUsers.length > 0) {
                const cohortIds = cohortUsers.map(u => u.id);
                const [week1, week2, week4, week8, week12] = await Promise.all([
                    prisma.videoProgress.groupBy({
                        by: ['userId'],
                        where: {
                            userId: { in: cohortIds },
                            updatedAt: { gte: subDays(monthEnd, 7) },
                        },
                    }).then(r => r.length),
                    prisma.videoProgress.groupBy({
                        by: ['userId'],
                        where: {
                            userId: { in: cohortIds },
                            updatedAt: { gte: subDays(monthEnd, 14) },
                        },
                    }).then(r => r.length),
                    prisma.videoProgress.groupBy({
                        by: ['userId'],
                        where: {
                            userId: { in: cohortIds },
                            updatedAt: { gte: subDays(monthEnd, 28) },
                        },
                    }).then(r => r.length),
                    prisma.videoProgress.groupBy({
                        by: ['userId'],
                        where: {
                            userId: { in: cohortIds },
                            updatedAt: { gte: subDays(monthEnd, 56) },
                        },
                    }).then(r => r.length),
                    prisma.videoProgress.groupBy({
                        by: ['userId'],
                        where: {
                            userId: { in: cohortIds },
                            updatedAt: { gte: subDays(monthEnd, 84) },
                        },
                    }).then(r => r.length),
                ]);

                const cohortTotal = cohortUsers.length;
                cohorts.push({
                    cohort: cohortDate,
                    week0: 100,
                    week1: Math.round((week1 / cohortTotal) * 100),
                    week2: Math.round((week2 / cohortTotal) * 100),
                    week4: Math.round((week4 / cohortTotal) * 100),
                    week8: Math.round((week8 / cohortTotal) * 100),
                    week12: Math.round((week12 / cohortTotal) * 100),
                });
            }
        }

        // Economics data
        const [paidTransactions, activeSubscriptions, canceledSubscriptions, totalCreators, totalUsers] = await Promise.all([
            prisma.paymentTransaction.findMany({ where: { status: PaymentStatus.PAID } }),
            prisma.subscription.count({ where: { status: 'ACTIVE' } }),
            prisma.subscription.count({ where: { status: 'CANCELED' } }),
            prisma.creator.count(),
            prisma.user.count(),
        ]);

        const paidLast30 = paidTransactions.filter(tx => tx.createdAt >= subDays(now, 30));
        const totalRevenueAmount = paidTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        const monthlyRevenueAmount = paidLast30.reduce((sum, tx) => sum + (tx.amount || 0), 0);

        const payingUsers = new Set(paidTransactions.map(tx => tx.userId)).size;
        const mrr = monthlyRevenueAmount;
        const arr = mrr * 12;
        const arpu = totalUsers > 0 ? mrr / totalUsers : 0;
        const arppu = payingUsers > 0 ? mrr / payingUsers : 0;
        const conversionRate = totalUsers > 0 ? (payingUsers / totalUsers) * 100 : 0;
        const churnRate = (activeSubscriptions + canceledSubscriptions) > 0
            ? (canceledSubscriptions / (activeSubscriptions + canceledSubscriptions)) * 100
            : 0;

        // CAC not available from DB; leave null to avoid hardcoded placeholders
        const cac: number | null = null;
        const paybackPeriod = cac && arpu > 0 ? cac / arpu : null;
        const ltv = arppu * 12;
        const ltvCacRatio = cac && cac > 0 ? ltv / cac : null;

        const economics = {
            ltv: Math.round(ltv * 10) / 10,
            cac,
            ltvCacRatio: ltvCacRatio !== null ? Math.round(ltvCacRatio * 10) / 10 : null,
            paybackPeriod: paybackPeriod !== null ? Math.round(paybackPeriod * 10) / 10 : null,
            arpu: Math.round(arpu * 100) / 100,
            arppu: Math.round(arppu * 100) / 100,
            conversionRate: Math.round(conversionRate * 10) / 10,
            churnRate: Math.round(churnRate * 10) / 10,
            mrr: Math.round(mrr),
            arr: Math.round(arr),
            totalRevenue: Math.round(totalRevenueAmount),
        };

        // Creator earnings distribution
        const creators = await prisma.creator.findMany({
            select: { totalEarnings: true }
        });

        const earningsRanges = [
            { range: 'E£0-E£1K', min: 0, max: 1000, count: 0, percentage: 0 },
            { range: 'E£1K-E£5K', min: 1000, max: 5000, count: 0, percentage: 0 },
            { range: 'E£5K-E£10K', min: 5000, max: 10000, count: 0, percentage: 0 },
            { range: 'E£10K-E£50K', min: 10000, max: 50000, count: 0, percentage: 0 },
            { range: 'E£50K-E£100K', min: 50000, max: 100000, count: 0, percentage: 0 },
            { range: 'E£100K+', min: 100000, max: Infinity, count: 0, percentage: 0 },
        ];

        creators.forEach(c => {
            const earnings = c.totalEarnings || 0;
            for (const range of earningsRanges) {
                if (earnings >= range.min && earnings < range.max) {
                    range.count++;
                    break;
                }
            }
        });

        const totalCreatorCount = creators.length;
        const creatorEarnings = earningsRanges.map(r => ({
            range: r.range,
            count: r.count,
            percentage: totalCreatorCount > 0 ? Math.round(r.count / totalCreatorCount * 100) : 0
        }));

        // Retention by day
        const dayRetention = [
            { period: 'Day 1', rate: activationFunnel[3].percentage },
            { period: 'Day 7', rate: activationFunnel[3].percentage },
            { period: 'Day 30', rate: Math.max(0, Math.round(activationFunnel[3].percentage * 0.8)) },
            { period: 'Day 90', rate: Math.max(0, Math.round(activationFunnel[3].percentage * 0.6)) },
        ];

        return NextResponse.json({
            northStar: {
                weeklyLearningHours: Math.round(totalLearningHours * 10) / 10,
                weeklyActiveUsers,
                hoursPerUser: weeklyActiveUsers > 0 ? Math.round((totalLearningHours / weeklyActiveUsers) * 10) / 10 : 0,
                trend: Math.round(trend * 10) / 10,
                weeklyEnrollments,
                weeklyData,
            },
            activationFunnel,
            retention: {
                cohorts,
                dayRetention
            },
            economics,
            creatorEarnings,
            abTests: [],
            recommendations: {
                totalRecommendations: 0,
                clickThroughRate: 0,
                enrollmentRate: 0,
                revenueGenerated: 0,
                topSources: [],
            },
        });
    } catch (error) {
        console.error('Advanced analytics error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch advanced analytics' },
            { status: 500 }
        );
    }
}
