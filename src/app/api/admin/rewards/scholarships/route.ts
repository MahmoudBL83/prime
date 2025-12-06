import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user || session.user.role !== 'ADMIN') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const now = new Date()

		const [campaigns, statusCounts, activeCampaigns, budgetTotals, budgetUsedTotals] = await Promise.all([
			prisma.scholarshipCampaign.findMany({
				orderBy: { createdAt: 'desc' },
				include: {
					_count: { select: { applications: true } },
					creator: { select: { id: true, name: true, email: true } },
					applications: {
						take: 10,
						orderBy: { appliedAt: 'desc' },
						select: {
							id: true,
							status: true,
							appliedAt: true,
							score: true,
							income: true,
							applicant: { select: { id: true, name: true, email: true } }
						}
					}
				}
			}),
			prisma.scholarshipApplication.groupBy({
				by: ['status'],
				_count: true
			}),
			prisma.scholarshipCampaign.count({
				where: {
					status: 'ACTIVE',
					startDate: { lte: now },
					endDate: { gte: now }
				}
			}),
			prisma.scholarshipCampaign.aggregate({ _sum: { totalBudget: true } }),
			prisma.scholarshipCampaign.aggregate({ _sum: { budgetUsed: true } })
		])

		const statusMap: Record<string, number> = {
			PENDING: 0,
			UNDER_REVIEW: 0,
			APPROVED: 0,
			REJECTED: 0,
			DISBURSED: 0
		}
		statusCounts.forEach((row) => {
			statusMap[row.status] = row._count
		})

		const transformed = campaigns.map((campaign) => ({
			id: campaign.id,
			name: campaign.name,
			description: campaign.description,
			status: campaign.status,
			eligibilityType: campaign.eligibilityType,
			totalBudget: campaign.totalBudget,
			budgetUsed: campaign.budgetUsed,
			maxRecipients: campaign.maxRecipients,
			recipientsCount: campaign.recipientsCount,
			creditAmount: campaign.creditAmount,
			validityDays: campaign.validityDays,
			startDate: campaign.startDate,
			endDate: campaign.endDate,
			criteria: campaign.criteria,
			requirements: campaign.requirements,
			createdAt: campaign.createdAt,
			updatedAt: campaign.updatedAt,
			createdBy: campaign.createdBy,
			creator: campaign.creator,
			totalApplications: campaign._count.applications,
			recentApplications: campaign.applications
		}))

		return NextResponse.json({
			campaigns: transformed,
			metrics: {
				totalCampaigns: campaigns.length,
				activeCampaigns,
				applications: statusMap,
				budget: {
					total: budgetTotals._sum.totalBudget || 0,
					used: budgetUsedTotals._sum.budgetUsed || 0
				}
			}
		})
	} catch (error) {
		console.error('Error fetching scholarships:', error)
		return NextResponse.json({ error: 'Failed to fetch scholarships' }, { status: 500 })
	}
}

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user || session.user.role !== 'ADMIN') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await req.json()
		const {
			name,
			description,
			eligibilityType,
			totalBudget,
			maxRecipients,
			creditAmount,
			validityDays,
			startDate,
			endDate,
			criteria,
			requirements
		} = body

		if (!name || !description || !eligibilityType) {
			return NextResponse.json({ error: 'name, description, and eligibilityType are required' }, { status: 400 })
		}

		const campaign = await prisma.scholarshipCampaign.create({
			data: {
				name,
				description,
				eligibilityType,
				totalBudget: totalBudget ? parseFloat(totalBudget) : 0,
				budgetUsed: 0,
				maxRecipients: maxRecipients ? parseInt(maxRecipients, 10) : 0,
				creditAmount: creditAmount ? parseFloat(creditAmount) : 0,
				validityDays: validityDays ? parseInt(validityDays, 10) : 0,
				startDate: startDate ? new Date(startDate) : new Date(),
				endDate: endDate ? new Date(endDate) : new Date(startDate || new Date()),
				criteria: criteria ?? null,
				requirements: requirements ?? [],
				createdBy: session.user.id
			}
		})

		return NextResponse.json({ campaign }, { status: 201 })
	} catch (error) {
		console.error('Error creating scholarship campaign:', error)
		return NextResponse.json({ error: 'Failed to create scholarship campaign' }, { status: 500 })
	}
}

