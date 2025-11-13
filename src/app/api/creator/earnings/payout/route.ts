import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/creator/earnings/payout
 * Request a payout withdrawal
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'CREATOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { amount, method, accountDetails } = body;

        // Validation
        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        if (!method || !['BANK_TRANSFER', 'PAYPAL', 'WALLET', 'VODAFONE_CASH', 'INSTAPAY'].includes(method)) {
            return NextResponse.json({ error: 'Invalid payout method' }, { status: 400 });
        }

        if (!accountDetails) {
            return NextResponse.json({ error: 'Account details required' }, { status: 400 });
        }

        // Get creator and check available balance
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        });

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
        }

        // Calculate available balance
        const totalEarningsAgg = await prisma.creatorEarnings.aggregate({
            where: { creatorId: creator.id },
            _sum: { amount: true }
        });
        const totalEarnings = totalEarningsAgg._sum.amount || 0;

        const payoutsAgg = await prisma.creatorPayout.aggregate({
            where: { 
                creatorId: creator.id, 
                status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] }
            },
            _sum: { amount: true }
        });
        const payoutsReserved = payoutsAgg._sum.amount || 0;

        const availableBalance = Math.max(0, totalEarnings - payoutsReserved);

        // Check minimum payout amount (50 EGP)
        const MIN_PAYOUT = 50;
        if (amount < MIN_PAYOUT) {
            return NextResponse.json({ 
                error: `Minimum payout amount is ${MIN_PAYOUT} EGP` 
            }, { status: 400 });
        }

        // Check if balance is sufficient
        if (amount > availableBalance) {
            return NextResponse.json({ 
                error: `Insufficient balance. Available: ${availableBalance.toFixed(2)} EGP` 
            }, { status: 400 });
        }

        // Calculate processing fee (2.9% + 2 EGP standard for payment processing)
        const processingFee = (amount * 0.029) + 2;
        const netAmount = amount - processingFee;

        // Create payout request
        const payout = await prisma.creatorPayout.create({
            data: {
                creatorId: creator.id,
                amount,
                currency: 'EGP',
                method,
                accountDetails,
                processingFee,
                netAmount,
                status: 'PENDING'
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Payout request submitted successfully',
            payout: {
                id: payout.id,
                amount: payout.amount,
                netAmount: payout.netAmount,
                processingFee: payout.processingFee,
                method: payout.method,
                status: payout.status,
                requestedAt: payout.requestedAt
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Error requesting payout:', error);
        return NextResponse.json(
            { error: 'Failed to process payout request' },
            { status: 500 }
        );
    }
}
