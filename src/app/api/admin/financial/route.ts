import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const searchParams = req.nextUrl.searchParams
        const range = searchParams.get('range') || '30d'

        // Calculate date range
        const now = new Date()
        let startDate = new Date()
        switch (range) {
            case '7d':
                startDate.setDate(now.getDate() - 7)
                break
            case '30d':
                startDate.setDate(now.getDate() - 30)
                break
            case '90d':
                startDate.setDate(now.getDate() - 90)
                break
            case '1y':
                startDate.setFullYear(now.getFullYear() - 1)
                break
        }

        // Mock financial data (replace with real queries)
        const financialStats = {
            overview: {
                totalRevenue: 156789.50,
                monthlyRevenue: 45230.75,
                revenueGrowth: 12.5,
                totalPayouts: 89450.25,
                pendingPayouts: 15,
                activeSubscriptions: 2340,
                churnRate: 5.2,
                averageRevenuePerUser: 19.32
            },
            breakdown: {
                categoryA: 67890.50,
                categoryB: 45230.75,
                categoryC: 43668.25,
                subscriptions: 134560.00,
                addOns: 22229.50
            },
            recentTransactions: [
                {
                    id: '1',
                    type: 'subscription' as const,
                    amount: 29.99,
                    status: 'completed' as const,
                    user: 'John Doe',
                    date: new Date().toISOString()
                },
                {
                    id: '2',
                    type: 'payout' as const,
                    amount: 450.00,
                    status: 'pending' as const,
                    user: 'Creator Jane',
                    date: new Date().toISOString()
                },
                {
                    id: '3',
                    type: 'refund' as const,
                    amount: 29.99,
                    status: 'completed' as const,
                    user: 'Bob Smith',
                    date: new Date().toISOString()
                },
                {
                    id: '4',
                    type: 'subscription' as const,
                    amount: 49.99,
                    status: 'completed' as const,
                    user: 'Alice Johnson',
                    date: new Date().toISOString()
                },
                {
                    id: '5',
                    type: 'chargeback' as const,
                    amount: 29.99,
                    status: 'pending' as const,
                    user: 'Mike Wilson',
                    date: new Date().toISOString()
                }
            ],
            topCreatorEarnings: [
                {
                    id: '1',
                    name: 'Dr. Sarah Ahmed',
                    earnings: 8950.50,
                    category: 'A',
                    growth: 15.3
                },
                {
                    id: '2',
                    name: 'Prof. Mohamed Ali',
                    earnings: 7234.75,
                    category: 'B',
                    growth: 22.1
                },
                {
                    id: '3',
                    name: 'Eng. Fatma Hassan',
                    earnings: 6543.00,
                    category: 'C',
                    growth: -3.5
                },
                {
                    id: '4',
                    name: 'Dr. Ahmed Mahmoud',
                    earnings: 5890.25,
                    category: 'A',
                    growth: 8.7
                },
                {
                    id: '5',
                    name: 'Layla Ibrahim',
                    earnings: 4567.90,
                    category: 'C',
                    growth: 31.2
                }
            ]
        }

        return NextResponse.json(financialStats)
    } catch (error) {
        console.error('Error fetching financial stats:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
