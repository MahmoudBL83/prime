import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

const CONFIG_KEYS = {
    SAFETY_KEYWORDS: 'safety_keywords',
    SAFETY_FILTERS: 'safety_filters',
    SAFETY_AGE_CONTROLS: 'safety_age_controls'
}

// Default values for safety settings
const defaultKeywords = [
    {
        id: '1',
        keyword: 'spam',
        action: 'auto_moderate',
        category: 'spam',
        severity: 'medium',
        caseSensitive: false,
        wholeWordOnly: true,
        enabled: true,
        matchCount: 0,
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        keyword: 'harassment',
        action: 'flag',
        category: 'harassment',
        severity: 'high',
        caseSensitive: false,
        wholeWordOnly: false,
        enabled: true,
        matchCount: 0,
        createdAt: new Date().toISOString()
    }
]

const defaultFilters = [
    {
        id: '1',
        name: 'Excessive Links Filter',
        description: 'Blocks messages with more than 3 links',
        enabled: true,
        filterType: 'link',
        action: 'block',
        threshold: 3,
        matchCount: 0
    },
    {
        id: '2',
        name: 'Spam Detection',
        description: 'AI-powered spam message detection',
        enabled: true,
        filterType: 'spam',
        action: 'flag_for_review',
        matchCount: 0
    }
]

const defaultAgeControls = [
    {
        id: '1',
        feature: 'Private Messaging',
        minAge: 18,
        enabled: true,
        description: 'Requires users to be 18+ to send private messages',
        enforcementLevel: 'verified_only'
    },
    {
        id: '2',
        feature: 'Creator Applications',
        minAge: 18,
        enabled: true,
        description: 'Must be 18+ to apply as a content creator',
        enforcementLevel: 'verified_only'
    }
]

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser || currentUser.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') || 'all'

        // Get settings from database
        const configs = await prisma.systemConfig.findMany({
            where: {
                key: {
                    in: Object.values(CONFIG_KEYS)
                }
            }
        })

        const configMap = new Map(configs.map(c => [c.key, c.value]))

        const keywords = configMap.has(CONFIG_KEYS.SAFETY_KEYWORDS)
            ? JSON.parse(configMap.get(CONFIG_KEYS.SAFETY_KEYWORDS)!)
            : defaultKeywords

        const filters = configMap.has(CONFIG_KEYS.SAFETY_FILTERS)
            ? JSON.parse(configMap.get(CONFIG_KEYS.SAFETY_FILTERS)!)
            : defaultFilters

        const ageControls = configMap.has(CONFIG_KEYS.SAFETY_AGE_CONTROLS)
            ? JSON.parse(configMap.get(CONFIG_KEYS.SAFETY_AGE_CONTROLS)!)
            : defaultAgeControls

        if (type === 'keywords') {
            return NextResponse.json({ keywords })
        } else if (type === 'filters') {
            return NextResponse.json({ filters })
        } else if (type === 'age-controls') {
            return NextResponse.json({ ageControls })
        }

        return NextResponse.json({ keywords, filters, ageControls })

    } catch (error) {
        console.error('Safety settings API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser || currentUser.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        const { type, data } = await request.json()

        if (!type || !data) {
            return NextResponse.json(
                { error: 'Type and data required' },
                { status: 400 }
            )
        }

        let configKey: string
        switch (type) {
            case 'keywords':
                configKey = CONFIG_KEYS.SAFETY_KEYWORDS
                break
            case 'filters':
                configKey = CONFIG_KEYS.SAFETY_FILTERS
                break
            case 'age-controls':
                configKey = CONFIG_KEYS.SAFETY_AGE_CONTROLS
                break
            default:
                return NextResponse.json(
                    { error: 'Invalid type' },
                    { status: 400 }
                )
        }

        await prisma.systemConfig.upsert({
            where: { key: configKey },
            update: { value: JSON.stringify(data) },
            create: { key: configKey, value: JSON.stringify(data) }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Safety settings update error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser || currentUser.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        const { type, item } = await request.json()

        if (!type || !item) {
            return NextResponse.json(
                { error: 'Type and item required' },
                { status: 400 }
            )
        }

        let configKey: string
        let defaultData: any[]
        switch (type) {
            case 'keywords':
                configKey = CONFIG_KEYS.SAFETY_KEYWORDS
                defaultData = defaultKeywords
                break
            case 'filters':
                configKey = CONFIG_KEYS.SAFETY_FILTERS
                defaultData = defaultFilters
                break
            case 'age-controls':
                configKey = CONFIG_KEYS.SAFETY_AGE_CONTROLS
                defaultData = defaultAgeControls
                break
            default:
                return NextResponse.json(
                    { error: 'Invalid type' },
                    { status: 400 }
                )
        }

        // Get existing data
        const config = await prisma.systemConfig.findUnique({
            where: { key: configKey }
        })

        const existingData = config ? JSON.parse(config.value) : defaultData

        // Add new item with generated ID
        const newItem = {
            ...item,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            matchCount: 0
        }
        existingData.push(newItem)

        // Save updated data
        await prisma.systemConfig.upsert({
            where: { key: configKey },
            update: { value: JSON.stringify(existingData) },
            create: { key: configKey, value: JSON.stringify(existingData) }
        })

        return NextResponse.json({ success: true, item: newItem })

    } catch (error) {
        console.error('Safety settings add error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser || currentUser.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type')
        const id = searchParams.get('id')

        if (!type || !id) {
            return NextResponse.json(
                { error: 'Type and ID required' },
                { status: 400 }
            )
        }

        let configKey: string
        let defaultData: any[]
        switch (type) {
            case 'keywords':
                configKey = CONFIG_KEYS.SAFETY_KEYWORDS
                defaultData = defaultKeywords
                break
            case 'filters':
                configKey = CONFIG_KEYS.SAFETY_FILTERS
                defaultData = defaultFilters
                break
            case 'age-controls':
                configKey = CONFIG_KEYS.SAFETY_AGE_CONTROLS
                defaultData = defaultAgeControls
                break
            default:
                return NextResponse.json(
                    { error: 'Invalid type' },
                    { status: 400 }
                )
        }

        // Get existing data
        const config = await prisma.systemConfig.findUnique({
            where: { key: configKey }
        })

        const existingData = config ? JSON.parse(config.value) : defaultData

        // Remove item
        const updatedData = existingData.filter((item: any) => item.id !== id)

        // Save updated data
        await prisma.systemConfig.upsert({
            where: { key: configKey },
            update: { value: JSON.stringify(updatedData) },
            create: { key: configKey, value: JSON.stringify(updatedData) }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Safety settings delete error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
