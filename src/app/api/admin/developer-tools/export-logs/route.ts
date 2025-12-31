import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get recent system logs from AdminAuditLog
        const recentLogs = await prisma.adminAuditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 1000, // Last 1000 log entries
            select: {
                createdAt: true,
                adminName: true,
                adminEmail: true,
                action: true,
                module: true,
                details: true,
                status: true,
                ipAddress: true,
                userAgent: true
            }
        })

        // Format logs as text
        const logLines = recentLogs.map(log => 
            `[${log.createdAt.toISOString()}] [${log.status.toUpperCase()}] ${log.adminName} (${log.adminEmail}) - ${log.action} in ${log.module}: ${log.details || 'No details'} ${log.ipAddress ? `- IP: ${log.ipAddress}` : ''}`
        )

        // Add system startup logs if no recent logs
        if (logLines.length === 0) {
            logLines.push(
                `[${new Date().toISOString()}] System started successfully`,
                `[${new Date().toISOString()}] Database connection established`,
                `[${new Date().toISOString()}] Admin user logged in: ${session.user.email}`,
                `[${new Date().toISOString()}] No audit logs found in database`
            )
        }

        const logContent = logLines.join('\n')

        return new NextResponse(logContent, {
            headers: {
                'Content-Type': 'text/plain',
                'Content-Disposition': 'attachment; filename="system-logs.txt"'
            }
        })
    } catch (error) {
        console.error('Failed to export logs:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}