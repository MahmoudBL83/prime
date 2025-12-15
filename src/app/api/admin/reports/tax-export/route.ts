import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Tax Reporting Export API
 * Generate tax reports for creators and platform
 * GET /api/admin/reports/tax-export
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
        const quarter = searchParams.get('quarter') // Q1, Q2, Q3, Q4, or null for full year
        const format = searchParams.get('format') || 'json' // json, csv
        const creatorId = searchParams.get('creatorId') // Single creator or all

        // Calculate date range
        let startDate: Date
        let endDate: Date

        if (quarter) {
            const quarterNum = parseInt(quarter.replace('Q', ''))
            startDate = new Date(year, (quarterNum - 1) * 3, 1)
            endDate = new Date(year, quarterNum * 3, 0, 23, 59, 59)
        } else {
            startDate = new Date(year, 0, 1)
            endDate = new Date(year, 11, 31, 23, 59, 59)
        }

        // Build query for earnings
        const whereClause: any = {
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        }

        if (creatorId) {
            whereClause.creatorId = creatorId
        }

        // Get earnings data
        const earnings = await prisma.creatorEarnings.findMany({
            where: whereClause,
            include: {
                creator: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        })

        // Get payout data
        const payouts = await prisma.creatorPayout.findMany({
            where: {
                ...whereClause,
                status: 'COMPLETED'
            },
            include: {
                creator: {
                    include: {
                        user: {
                            select: { name: true, email: true }
                        }
                    }
                }
            }
        })

        // Aggregate by creator
        const creatorSummaries: Record<string, {
            creatorId: string
            creatorName: string
            creatorEmail: string
            nationalId?: string
            bankAccount?: string
            totalEarnings: number
            platformFees: number
            netPayouts: number
            transactionCount: number
            payoutCount: number
        }> = {}

        for (const earning of earnings) {
            const cid = earning.creatorId
            if (!creatorSummaries[cid]) {
                creatorSummaries[cid] = {
                    creatorId: cid,
                    creatorName: earning.creator.user.name,
                    creatorEmail: earning.creator.user.email,
                    nationalId: earning.creator.nationalId || undefined,
                    bankAccount: earning.creator.bankAccountIBAN || undefined,
                    totalEarnings: 0,
                    platformFees: 0,
                    netPayouts: 0,
                    transactionCount: 0,
                    payoutCount: 0
                }
            }
            creatorSummaries[cid].totalEarnings += earning.amount
            creatorSummaries[cid].platformFees += earning.platformFee || 0
            creatorSummaries[cid].transactionCount += 1
        }

        for (const payout of payouts) {
            const cid = payout.creatorId
            if (creatorSummaries[cid]) {
                creatorSummaries[cid].netPayouts += payout.amount
                creatorSummaries[cid].payoutCount += 1
            }
        }

        const summaryList = Object.values(creatorSummaries)

        // Calculate totals
        const totals = {
            totalGrossEarnings: summaryList.reduce((sum, c) => sum + c.totalEarnings, 0),
            totalPlatformFees: summaryList.reduce((sum, c) => sum + c.platformFees, 0),
            totalNetPayouts: summaryList.reduce((sum, c) => sum + c.netPayouts, 0),
            creatorCount: summaryList.length,
            transactionCount: summaryList.reduce((sum, c) => sum + c.transactionCount, 0)
        }

        // Format response
        if (format === 'csv') {
            const csvHeaders = [
                'Creator ID',
                'Creator Name',
                'Email',
                'National ID',
                'Bank Account',
                'Total Earnings (EGP)',
                'Platform Fees (EGP)',
                'Net Payouts (EGP)',
                'Transaction Count',
                'Payout Count'
            ].join(',')

            const csvRows = summaryList.map(c => [
                c.creatorId,
                `"${c.creatorName}"`,
                c.creatorEmail,
                c.nationalId || '',
                c.bankAccount || '',
                c.totalEarnings.toFixed(2),
                c.platformFees.toFixed(2),
                c.netPayouts.toFixed(2),
                c.transactionCount,
                c.payoutCount
            ].join(','))

            const csv = [csvHeaders, ...csvRows].join('\n')

            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="tax-report-${year}${quarter ? `-${quarter}` : ''}.csv"`
                }
            })
        }

        // JSON response
        return NextResponse.json({
            report: {
                period: {
                    year,
                    quarter: quarter || 'Full Year',
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                },
                generatedAt: new Date().toISOString(),
                generatedBy: session.user.email
            },
            totals,
            creators: summaryList,
            metadata: {
                currency: 'EGP',
                platformName: 'Prime EdTech',
                taxYear: year
            }
        })
    } catch (error) {
        console.error('Tax export error:', error)
        return NextResponse.json(
            { error: 'Failed to generate tax report' },
            { status: 500 }
        )
    }
}

// POST: Generate and store tax report
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { year, quarter, notes } = body

        // In production, generate report and store in database/file storage
        // For now, log the generation request

        await prisma.adminAuditLog.create({
            data: {
                adminId: session.user.id,
                action: 'GENERATE_TAX_REPORT',
                module: 'Reports',
                details: `Generated tax report for ${year}${quarter ? ` ${quarter}` : ''}. Notes: ${notes || 'None'}`,
                status: 'SUCCESS'
            }
        })

        return NextResponse.json({
            message: 'Tax report generated successfully',
            downloadUrl: `/api/admin/reports/tax-export?year=${year}${quarter ? `&quarter=${quarter}` : ''}&format=csv`
        })
    } catch (error) {
        console.error('Tax report generation error:', error)
        return NextResponse.json(
            { error: 'Failed to generate tax report' },
            { status: 500 }
        )
    }
}
