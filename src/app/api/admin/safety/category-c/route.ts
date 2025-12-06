import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type ChannelAction = 'warning' | 'escalate' | 'restrict' | 'suspend'
type Violation = {
	type?: string
	count?: number
	lastOccurrence?: string | Date
	severity?: string
}

export async function GET() {
	try {
		const session = await getServerSession(authOptions)
		if (!session || session.user.role !== 'ADMIN') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const flagged = await prisma.flaggedChannel.findMany({
			orderBy: { flaggedAt: 'desc' },
			include: {
				channel: {
					select: {
						id: true,
						name: true,
						totalSubscribers: true,
						updatedAt: true,
						_count: { select: { posts: true } }
					}
				},
				creator: {
					select: {
						id: true,
						user: { select: { name: true } }
					}
				},
				reviewer: { select: { id: true, name: true } }
			}
		})

		const channels = flagged.map((item) => {
			const violations: Violation[] = Array.isArray(item.violations)
				? (item.violations as unknown as Violation[])
				: []
			const metrics = (item.metrics as Record<string, unknown>) || {}

			const lastViolationDate = violations[0]?.lastOccurrence
			const lastActivity = lastViolationDate
				? new Date(lastViolationDate).toISOString()
				: item.channel.updatedAt.toISOString()

			const normalizedViolations = violations.map((v) => ({
				type: (v.type || 'policy_violation').toString().toLowerCase(),
				count: Number(v.count || 0),
				lastOccurrence: v.lastOccurrence
					? new Date(v.lastOccurrence).toISOString()
					: item.flaggedAt.toISOString(),
				severity: (v.severity || 'moderate').toString().toLowerCase()
			}))

			const qualityScore = Number((metrics as any).avgQualityScore ?? (metrics as any).qualityScore ?? 0)
			const completionRate = Number((metrics as any).completionRate ?? 0)
			const refundRate = Number((metrics as any).refundRate ?? 0)
			const negativeReviews = Number((metrics as any).negativeReviews ?? 0)
			const spamReports = Number((metrics as any).spamReports ?? 0)

			return {
				id: item.id,
				channelId: item.channelId,
				creatorId: item.creatorId,
				creatorName: item.creator.user?.name || 'Unknown',
				channelName: item.channel.name,
				status: item.status.toLowerCase(),
				riskLevel: item.riskLevel.toLowerCase(),
				flaggedDate: item.flaggedAt.toISOString(),
				lastActivity,
				violations: normalizedViolations,
				metrics: {
					avgQualityScore: qualityScore,
					completionRate,
					refundRate,
					negativeReviews,
					spamReports
				},
				automatedFlags: item.automatedFlags || [],
				manualReviews: item.manualReviews,
				warningsIssued: item.warningsIssued,
				contentCount: item.channel._count.posts,
				subscriberCount: item.channel.totalSubscribers,
				reviewer: item.reviewer?.name || null
			}
		})

		const stats = channels.reduce(
			(acc, c) => {
				acc.totalFlagged += 1
				if (c.riskLevel === 'critical') acc.critical += 1
				if (c.status === 'escalated') acc.escalated += 1
				acc.warningsIssued += c.warningsIssued || 0
				acc.totalViolations += c.violations.reduce((sum, v) => sum + (v.count || 0), 0)
				acc.totalQuality += c.metrics.avgQualityScore
				return acc
			},
			{
				totalFlagged: 0,
				critical: 0,
				escalated: 0,
				warningsIssued: 0,
				totalViolations: 0,
				totalQuality: 0
			}
		)

		const avgQualityScore = channels.length > 0 ? Math.round((stats.totalQuality / channels.length) * 10) / 10 : 0

		return NextResponse.json({
			channels,
			stats: {
				totalFlagged: stats.totalFlagged,
				critical: stats.critical,
				escalated: stats.escalated,
				warningsIssued: stats.warningsIssued,
				totalViolations: stats.totalViolations,
				avgQualityScore
			}
		})
	} catch (error) {
		console.error('Category C fetch error:', error)
		return NextResponse.json({ error: 'Failed to fetch flagged channels' }, { status: 500 })
	}
}

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session || session.user.role !== 'ADMIN') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await req.json()
		const { channelId, action, notes } = body as { channelId?: string; action?: ChannelAction; notes?: string }

		if (!channelId || !action) {
			return NextResponse.json({ error: 'channelId and action are required' }, { status: 400 })
		}

		const statusMap: Record<ChannelAction, { status: string; incrementWarning?: boolean }> = {
			warning: { status: 'WARNING_ISSUED', incrementWarning: true },
			escalate: { status: 'ESCALATED' },
			restrict: { status: 'ESCALATED' },
			suspend: { status: 'SUSPENDED' }
		}

		const channelIdValue = channelId as string

		const target = await prisma.flaggedChannel.findFirst({ where: { channelId: channelIdValue } })
		if (!target) {
			return NextResponse.json({ error: 'Flagged channel not found' }, { status: 404 })
		}

		const update = await prisma.flaggedChannel.update({
			where: { id: target.id },
			data: {
				status: statusMap[action].status as any,
				warningsIssued: statusMap[action].incrementWarning ? target.warningsIssued + 1 : target.warningsIssued,
				manualReviews: target.manualReviews + 1,
				actionNotes: notes || target.actionNotes,
				lastReviewedAt: new Date(),
				reviewedBy: session.user.id
			}
		})

		await prisma.adminAuditLog.create({
			data: {
				adminId: session.user.id,
				adminName: session.user.name || 'Admin',
				adminEmail: session.user.email || '',
				action: `CATEGORY_C_${action.toUpperCase()}`,
				module: 'Safety',
				details: `Channel ${channelId} status -> ${statusMap[action].status}${notes ? ` | Notes: ${notes}` : ''}`,
				status: 'SUCCESS'
			}
		})

		return NextResponse.json({ success: true, channel: update })
	} catch (error) {
		console.error('Category C action error:', error)
		return NextResponse.json({ error: 'Failed to update flagged channel' }, { status: 500 })
	}
}

