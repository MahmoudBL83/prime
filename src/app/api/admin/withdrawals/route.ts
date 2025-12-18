import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all withdrawal requests (admin only)
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const searchParams = req.nextUrl.searchParams
        const status = searchParams.get('status') || 'all'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')

        const where: any = {}
        if (status !== 'all') {
            where.status = status.toUpperCase()
        }

        const [withdrawals, total] = await Promise.all([
            prisma.withdrawal.findMany({
                where,
                include: {
                    instructor: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    arabicName: true,
                                    email: true,
                                    profileImage: true
                                }
                            }
                        }
                    }
                },
                orderBy: { requestedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.withdrawal.count({ where })
        ])

        // Get stats
        const stats = await prisma.withdrawal.groupBy({
            by: ['status'],
            _sum: { amount: true },
            _count: true
        })

        return NextResponse.json({
            withdrawals: withdrawals.map(w => ({
                id: w.id,
                amount: w.amount,
                method: w.method,
                accountDetails: w.accountDetails,
                status: w.status,
                requestedAt: w.requestedAt.toISOString(),
                processedAt: w.processedAt?.toISOString(),
                completedAt: w.completedAt?.toISOString(),
                notes: w.notes,
                transactionId: w.transactionId,
                creator: {
                    id: w.instructor.id,
                    userId: w.instructor.user.id,
                    name: w.instructor.user.name,
                    arabicName: w.instructor.user.arabicName,
                    email: w.instructor.user.email,
                    profileImage: w.instructor.user.profileImage
                }
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            stats: {
                pending: stats.find(s => s.status === 'PENDING') || { _count: 0, _sum: { amount: 0 } },
                processing: stats.find(s => s.status === 'PROCESSING') || { _count: 0, _sum: { amount: 0 } },
                completed: stats.find(s => s.status === 'COMPLETED') || { _count: 0, _sum: { amount: 0 } },
                rejected: stats.find(s => s.status === 'REJECTED') || { _count: 0, _sum: { amount: 0 } }
            }
        })
    } catch (error) {
        console.error('Error fetching withdrawals:', error)
        return NextResponse.json({ error: 'Failed to fetch withdrawals' }, { status: 500 })
    }
}

// POST - Process a withdrawal (approve/reject)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { withdrawalId, action, notes, transactionId } = body

        if (!withdrawalId || !action) {
            return NextResponse.json({ 
                error: 'Withdrawal ID and action are required' 
            }, { status: 400 })
        }

        const withdrawal = await prisma.withdrawal.findUnique({
            where: { id: withdrawalId },
            include: {
                instructor: {
                    include: { user: true }
                }
            }
        })

        if (!withdrawal) {
            return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 })
        }

        let updatedWithdrawal

        switch (action) {
            case 'approve':
                // Move to processing
                updatedWithdrawal = await prisma.withdrawal.update({
                    where: { id: withdrawalId },
                    data: {
                        status: 'PROCESSING',
                        processedAt: new Date(),
                        notes: notes || 'Approved by admin'
                    }
                })

                // Notify creator
                await prisma.notification.create({
                    data: {
                        userId: withdrawal.instructor.user.id,
                        type: 'SYSTEM',
                        title: 'Withdrawal Approved',
                        message: `Your withdrawal request of €${withdrawal.amount} has been approved and is being processed.`,
                        data: { withdrawalId }
                    }
                })
                break

            case 'complete':
                // Mark as completed
                updatedWithdrawal = await prisma.withdrawal.update({
                    where: { id: withdrawalId },
                    data: {
                        status: 'COMPLETED',
                        completedAt: new Date(),
                        transactionId: transactionId || null,
                        notes: notes || 'Payment completed'
                    }
                })

                // Notify creator
                await prisma.notification.create({
                    data: {
                        userId: withdrawal.instructor.user.id,
                        type: 'SYSTEM',
                        title: 'Withdrawal Completed',
                        message: `Your withdrawal of €${withdrawal.amount} has been completed. ${transactionId ? `Transaction ID: ${transactionId}` : ''}`,
                        data: { withdrawalId, transactionId }
                    }
                })
                break

            case 'reject':
                // Reject the withdrawal
                updatedWithdrawal = await prisma.withdrawal.update({
                    where: { id: withdrawalId },
                    data: {
                        status: 'REJECTED',
                        processedAt: new Date(),
                        notes: notes || 'Rejected by admin'
                    }
                })

                // Notify creator
                await prisma.notification.create({
                    data: {
                        userId: withdrawal.instructor.user.id,
                        type: 'SYSTEM',
                        title: 'Withdrawal Rejected',
                        message: `Your withdrawal request of €${withdrawal.amount} has been rejected. ${notes ? `Reason: ${notes}` : ''}`,
                        data: { withdrawalId, reason: notes }
                    }
                })
                break

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        // Log admin action
        await prisma.adminAuditLog.create({
            data: {
                adminId: session.user.id,
                adminName: session.user.name || 'Admin',
                adminEmail: session.user.email || '',
                action: `WITHDRAWAL_${action.toUpperCase()}`,
                module: 'WITHDRAWALS',
                details: `Withdrawal ID: ${withdrawalId}, Amount: €${withdrawal.amount}, Method: ${withdrawal.method}`,
                ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
                metadata: {
                    amount: withdrawal.amount,
                    method: withdrawal.method,
                    creatorId: withdrawal.instructorId,
                    notes
                }
            }
        })

        return NextResponse.json({
            success: true,
            withdrawal: updatedWithdrawal,
            message: `Withdrawal ${action}ed successfully`
        })
    } catch (error) {
        console.error('Error processing withdrawal:', error)
        return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 })
    }
}
