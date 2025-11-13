import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { secretKey } = await req.json()

    if (!secretKey) {
      return NextResponse.json(
        { error: 'Secret key is required' },
        { status: 400 }
      )
    }

    // Test the connection
    const stripe = new Stripe(secretKey, {
      apiVersion: '2025-09-30.clover',
    })

    // Try to retrieve account details
    const account = await stripe.accounts.retrieve()

    return NextResponse.json({
      success: true,
      mode: secretKey.startsWith('sk_test_') ? 'test' : 'live',
      accountId: account.id,
      country: account.country,
      email: account.email,
    })
  } catch (error: any) {
    console.error('Stripe connection test failed:', error)
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to connect to Stripe',
        details: error.type || 'Unknown error'
      },
      { status: 400 }
    )
  }
}
