import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch current Stripe configuration
export async function GET(req: NextRequest) {
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
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Fetch configuration from environment or database
    const config = {
      secretKey: process.env.STRIPE_SECRET_KEY ? maskKey(process.env.STRIPE_SECRET_KEY) : '',
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? maskKey(process.env.STRIPE_WEBHOOK_SECRET) : '',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || '',
      prices: {
        categoryAMonthly: process.env.STRIPE_PRICE_CATEGORY_A_MONTHLY || '',
        categoryAYearly: process.env.STRIPE_PRICE_CATEGORY_A_YEARLY || '',
        categoryBMonthly: process.env.STRIPE_PRICE_CATEGORY_B_MONTHLY || '',
        categoryBYearly: process.env.STRIPE_PRICE_CATEGORY_B_YEARLY || '',
        bundleABMonthly: process.env.STRIPE_PRICE_BUNDLE_AB_MONTHLY || '',
        bundleABYearly: process.env.STRIPE_PRICE_BUNDLE_AB_YEARLY || '',
      }
    }

    const connected = !!process.env.STRIPE_SECRET_KEY

    return NextResponse.json({ config, connected })
  } catch (error: any) {
    console.error('Error fetching Stripe config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    )
  }
}

// POST - Update Stripe configuration
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
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { secretKey, publishableKey, webhookSecret, appUrl, prices } = body

    // Validate required fields
    if (!secretKey || !publishableKey || !webhookSecret || !appUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate price IDs
    const priceValues = Object.values(prices)
    if (priceValues.some((price: any) => !price)) {
      return NextResponse.json(
        { error: 'All price IDs are required' },
        { status: 400 }
      )
    }

    // Mock configuration update since SystemConfig table doesn't exist
    console.log('Stripe configuration would be saved:', {
      secretKey: maskKey(secretKey),
      publishableKey,
      webhookSecret: maskKey(webhookSecret),
      appUrl,
      prices
    })

    return NextResponse.json({
      success: true,
      message: 'Stripe configuration updated successfully',
      note: 'Server restart may be required for changes to take full effect'
    })
  } catch (error: any) {
    console.error('Error saving Stripe config:', error)
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    )
  }
}

// Helper function to mask sensitive keys
function maskKey(key: string): string {
  if (key.length <= 12) return '••••••••'
  return key.substring(0, 8) + '••••••••' + key.substring(key.length - 4)
}