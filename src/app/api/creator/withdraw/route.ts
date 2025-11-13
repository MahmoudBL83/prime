import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MINIMUM_WITHDRAWAL = 100; // EGP
const PLATFORM_FEE_PERCENTAGE = 10; // 10% platform fee

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'CREATOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { amount, method, accountDetails } = await request.json();

        // Validation
        if (!amount || amount < MINIMUM_WITHDRAWAL) {
            return NextResponse.json(
                { error: `Minimum withdrawal amount is ${MINIMUM_WITHDRAWAL} EGP` },
                { status: 400 }
            );
        }

        if (!method) {
            return NextResponse.json(
                { error: 'Payment method is required' },
                { status: 400 }
            );
        }

        const validMethods = ['BANK_TRANSFER', 'PAYPAL', 'STRIPE', 'VODAFONE_CASH'];
        if (!validMethods.includes(method)) {
            return NextResponse.json(
                { error: 'Invalid payment method' },
                { status: 400 }
            );
        }

        // Get creator and check balance
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id },
            include: {
                earnings: true,
                payouts: true
            }
        });

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
        }

        // Calculate available balance
        const totalEarnings = creator.earnings.reduce((sum, e) => sum + e.amount, 0);
        const totalPayouts = creator.payouts
            .filter(p => p.status === 'COMPLETED' || p.status === 'PROCESSING' || p.status === 'PENDING')
            .reduce((sum, p) => sum + p.amount, 0);

        const availableBalance = totalEarnings - totalPayouts;

        if (amount > availableBalance) {
            return NextResponse.json(
                { error: 'Insufficient balance', availableBalance },
                { status: 400 }
            );
        }

        // Calculate platform fee
        const platformFee = (amount * PLATFORM_FEE_PERCENTAGE) / 100;
        const netAmount = amount - platformFee;

        // Create payout request
        const payout = await prisma.creatorPayout.create({
            data: {
                creatorId: creator.id,
                amount: netAmount,
                platformFee,
                status: 'PENDING',
                method,
                accountDetails: accountDetails || '',
                notes: `Withdrawal request for ${amount} EGP. Platform fee: ${platformFee} EGP. Net amount: ${netAmount} EGP.`
            }
        });

        return NextResponse.json({
            success: true,
            payout: {
                id: payout.id,
                amount: payout.amount,
                platformFee: payout.platformFee,
                netAmount: payout.amount,
                status: payout.status,
                method: payout.method,
                createdAt: payout.createdAt
            }
        });

    } catch (error) {
        console.error('Error creating withdrawal request:', error);
        return NextResponse.json(
            { error: 'Failed to create withdrawal request' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'CREATOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        });

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
        }

        return NextResponse.json({
            minimumWithdrawal: MINIMUM_WITHDRAWAL,
            platformFeePercentage: PLATFORM_FEE_PERCENTAGE,
            availableMethods: [
                { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                { value: 'VODAFONE_CASH', label: 'Vodafone Cash' },
                { value: 'PAYPAL', label: 'PayPal' },
                { value: 'STRIPE', label: 'Stripe' }
            ]
        });

    } catch (error) {
        console.error('Error fetching withdrawal info:', error);
        return NextResponse.json(
            { error: 'Failed to fetch withdrawal information' },
            { status: 500 }
        );
    }
}
