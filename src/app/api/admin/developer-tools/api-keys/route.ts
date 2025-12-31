import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { randomBytes } from 'crypto'

interface ApiKey {
    id: string
    name: string
    description: string
    key: string
    createdAt: string
    lastUsed?: string
    permissions: string[]
    status: 'active' | 'inactive'
}

// In a real implementation, you'd have an ApiKey model in Prisma
// For now, we'll simulate with in-memory storage (in production, use database)
let apiKeys: ApiKey[] = [
    {
        id: '1',
        name: 'Stripe Webhook',
        description: 'API key for Stripe webhook integration',
        key: 'sk_test_' + randomBytes(32).toString('hex'),
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        permissions: ['webhooks', 'payments'],
        status: 'active'
    },
    {
        id: '2',
        name: 'Analytics Service',
        description: 'API key for external analytics integration',
        key: 'ak_' + randomBytes(32).toString('hex'),
        createdAt: new Date().toISOString(),
        permissions: ['analytics', 'read'],
        status: 'active'
    }
]

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // In a real implementation, fetch from database
        return NextResponse.json(apiKeys)
    } catch (error) {
        console.error('Failed to fetch API keys:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { name, description, permissions } = await req.json()

        if (!name || !description) {
            return NextResponse.json({ error: 'Name and description are required' }, { status: 400 })
        }

        // Generate a secure API key
        const key = 'ak_' + randomBytes(32).toString('hex')

        const newKey: ApiKey = {
            id: Date.now().toString(),
            name,
            description,
            key,
            createdAt: new Date().toISOString(),
            permissions: permissions || ['read'],
            status: 'active'
        }

        // In a real implementation, save to database
        apiKeys.push(newKey)

        return NextResponse.json(newKey, { status: 201 })
    } catch (error) {
        console.error('Failed to create API key:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(req.url)
        const keyId = url.pathname.split('/').pop()

        if (!keyId) {
            return NextResponse.json({ error: 'API key ID is required' }, { status: 400 })
        }

        // In a real implementation, delete from database
        const index = apiKeys.findIndex(key => key.id === keyId)
        if (index === -1) {
            return NextResponse.json({ error: 'API key not found' }, { status: 404 })
        }

        apiKeys.splice(index, 1)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete API key:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}