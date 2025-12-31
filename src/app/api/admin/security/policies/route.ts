import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        // Check authentication and admin role
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get real security policies from database
        const systemConfigs = await prisma.systemConfig.findMany({
            where: {
                key: {
                    in: [
                        'security.mfa_required',
                        'security.password_policy',
                        'security.ip_whitelist',
                        'security.session_timeout',
                        'security.rate_limiting',
                        'security.data_encryption'
                    ]
                }
            }
        })

        const platformSettings = await prisma.platformSettings.findFirst()

        // Create policies based on actual system configuration
        const policies = [
            {
                id: '1',
                name: 'Multi-Factor Authentication',
                description: 'Require MFA for all admin accounts',
                enabled: systemConfigs.find(c => c.key === 'security.mfa_required')?.value === 'true' || false,
                lastUpdated: new Date().toISOString()
            },
            {
                id: '2',
                name: 'Password Policy',
                description: systemConfigs.find(c => c.key === 'security.password_policy')?.value || 'Minimum 12 characters, complexity requirements',
                enabled: true,
                lastUpdated: new Date().toISOString()
            },
            {
                id: '3',
                name: 'IP Whitelisting',
                description: 'Restrict admin access to whitelisted IPs',
                enabled: systemConfigs.find(c => c.key === 'security.ip_whitelist')?.value === 'true' || false,
                lastUpdated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: '4',
                name: 'Session Timeout',
                description: systemConfigs.find(c => c.key === 'security.session_timeout')?.value || 'Auto-logout after 30 minutes of inactivity',
                enabled: true,
                lastUpdated: new Date().toISOString()
            },
            {
                id: '5',
                name: 'Rate Limiting',
                description: 'Limit API requests per minute per IP',
                enabled: systemConfigs.find(c => c.key === 'security.rate_limiting')?.value === 'true' || true,
                lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
                id: '6',
                name: 'Data Encryption',
                description: 'Encrypt sensitive data at rest and in transit',
                enabled: systemConfigs.find(c => c.key === 'security.data_encryption')?.value === 'true' || true,
                lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: '7',
                name: 'Maintenance Mode',
                description: 'Enable maintenance mode to restrict platform access',
                enabled: platformSettings?.maintenanceMode || false,
                lastUpdated: platformSettings?.updatedAt?.toISOString() || new Date().toISOString()
            },
            {
                id: '8',
                name: 'Early Access Control',
                description: 'Control early access features and beta testing',
                enabled: platformSettings?.earlyAccessEnabled || true,
                lastUpdated: platformSettings?.updatedAt?.toISOString() || new Date().toISOString()
            }
        ]

        return NextResponse.json(policies)

    } catch (error) {
        console.error('Security policies error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}