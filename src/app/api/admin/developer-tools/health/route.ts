import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { Server, Database, Cpu, HardDrive, Wifi } from 'lucide-react'

interface HealthMetric {
    name: string
    status: 'healthy' | 'warning' | 'critical'
    value: string
    unit: string
    description: string
    icon: any
}

interface SystemHealth {
    overall: 'healthy' | 'warning' | 'critical'
    services: HealthMetric[]
    lastUpdated: string
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Simulate health metrics (in production, you'd monitor actual system resources)
        const services: HealthMetric[] = [
            {
                name: 'CPU Usage',
                status: 'healthy',
                value: '23',
                unit: '%',
                description: 'Current CPU utilization',
                icon: Cpu
            },
            {
                name: 'Memory',
                status: 'warning',
                value: '7.2',
                unit: 'GB',
                description: 'RAM usage out of 16GB',
                icon: Server
            },
            {
                name: 'Database',
                status: 'healthy',
                value: '99.9',
                unit: '%',
                description: 'Database uptime',
                icon: Database
            },
            {
                name: 'Storage',
                status: 'healthy',
                value: '45',
                unit: '%',
                description: 'Disk usage',
                icon: HardDrive
            },
            {
                name: 'Network',
                status: 'healthy',
                value: '24',
                unit: 'ms',
                description: 'Average response time',
                icon: Wifi
            },
            {
                name: 'API Rate',
                status: 'healthy',
                value: '1.2k',
                unit: '/min',
                description: 'Requests per minute',
                icon: Server
            },
            {
                name: 'Error Rate',
                status: 'healthy',
                value: '0.01',
                unit: '%',
                description: 'API error percentage',
                icon: Server
            },
            {
                name: 'Active Users',
                status: 'healthy',
                value: '1,247',
                unit: '',
                description: 'Currently online users',
                icon: Server
            }
        ]

        // Determine overall status
        const criticalCount = services.filter(s => s.status === 'critical').length
        const warningCount = services.filter(s => s.status === 'warning').length

        let overall: 'healthy' | 'warning' | 'critical' = 'healthy'
        if (criticalCount > 0) {
            overall = 'critical'
        } else if (warningCount > 0) {
            overall = 'warning'
        }

        const health: SystemHealth = {
            overall,
            services,
            lastUpdated: new Date().toISOString()
        }

        return NextResponse.json(health)
    } catch (error) {
        console.error('Failed to fetch health data:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}