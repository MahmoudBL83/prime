import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const status = searchParams.get('status');
        const triggerType = searchParams.get('triggerType');
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '25');

        // Build filter
        const where: Record<string, unknown> = {};
        if (type && type !== 'all') {
            where.type = type.toUpperCase();
        }
        if (status && status !== 'all') {
            where.status = status.toUpperCase();
        }
        if (triggerType && triggerType !== 'all') {
            where.triggerType = triggerType.toUpperCase();
        }

        // Fetch templates with stats
        const [
            templates,
            total,
            activeCount,
            draftCount,
            archivedCount,
            analyticsTotals,
            analyticsByTemplate
        ] = await Promise.all([
            prisma.emailTemplate.findMany({
                where,
                take: pageSize,
                skip: (page - 1) * pageSize,
                orderBy: { updatedAt: 'desc' },
                include: {
                    creator: {
                        select: { id: true, name: true }
                    }
                }
            }),
            prisma.emailTemplate.count({ where }),
            prisma.emailTemplate.count({ where: { status: 'ACTIVE' } }),
            prisma.emailTemplate.count({ where: { status: 'DRAFT' } }),
            prisma.emailTemplate.count({ where: { status: 'ARCHIVED' } }),
            prisma.emailAnalytics.aggregate({
                _sum: { sent: true, opened: true, clicked: true, converted: true }
            }),
            prisma.emailAnalytics.groupBy({
                by: ['templateId'],
                _sum: { sent: true, opened: true, clicked: true, converted: true }
            })
        ]);

        const totalSent = analyticsTotals._sum.sent || 0;
        const totalOpened = analyticsTotals._sum.opened || 0;
        const totalClicked = analyticsTotals._sum.clicked || 0;
        const totalConverted = analyticsTotals._sum.converted || 0;

        const analyticsMap = analyticsByTemplate.reduce<Record<string, { sent: number; opened: number; clicked: number; converted: number }>>((acc, row) => {
            acc[row.templateId] = {
                sent: row._sum.sent || 0,
                opened: row._sum.opened || 0,
                clicked: row._sum.clicked || 0,
                converted: row._sum.converted || 0,
            };
            return acc;
        }, {});

        const avgOpenRate = totalSent > 0 ? ((totalOpened / totalSent) * 100) : 0;
        const avgClickRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100) : 0;

        // Format templates
        const formattedTemplates = templates.map(template => ({
            id: template.id,
            name: template.name,
            type: template.type.toLowerCase(),
            status: template.status.toLowerCase(),
            subject: {
                en: template.subjectEn,
                ar: template.subjectAr || ''
            },
            body: {
                en: template.bodyEn,
                ar: template.bodyAr || ''
            },
            variables: template.variables,
            triggerType: template.triggerType.toLowerCase(),
            eventTrigger: template.eventTrigger,
            schedule: template.schedule,
            analytics: analyticsMap[template.id] || { sent: 0, opened: 0, clicked: 0, converted: 0 },
            version: template.version,
            createdBy: template.creator ? {
                id: template.creator.id,
                name: template.creator.name
            } : null,
            createdAt: template.createdAt.toISOString(),
            lastUpdated: template.updatedAt.toISOString()
        }));

        return NextResponse.json({
            templates: formattedTemplates,
            stats: {
                totalTemplates: activeCount + draftCount + archivedCount,
                activeTemplates: activeCount,
                draftTemplates: draftCount,
                archivedTemplates: archivedCount,
                totalSent,
                totalOpened,
                totalClicked,
                totalConverted,
                avgOpenRate: Math.round(avgOpenRate * 10) / 10,
                avgClickRate: Math.round(avgClickRate * 10) / 10
            },
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    } catch (error) {
        console.error('Templates API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch templates' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action, templateId, ...data } = body;

        if (action === 'create') {
            const newTemplate = await prisma.emailTemplate.create({
                data: {
                    name: data.name,
                    type: data.type?.toUpperCase() || 'TRANSACTIONAL',
                    status: 'DRAFT',
                    subjectEn: data.subject?.en || '',
                    subjectAr: data.subject?.ar || '',
                    bodyEn: data.body?.en || '',
                    bodyAr: data.body?.ar || '',
                    variables: data.variables || [],
                    triggerType: data.triggerType?.toUpperCase() || 'MANUAL',
                    eventTrigger: data.eventTrigger,
                    schedule: data.schedule,
                    version: 1,
                    createdBy: session.user.id
                }
            });

            return NextResponse.json({ success: true, template: newTemplate });
        }

        if (action === 'update') {
            // Get current version
            const current = await prisma.emailTemplate.findUnique({
                where: { id: templateId }
            });

            const updated = await prisma.emailTemplate.update({
                where: { id: templateId },
                data: {
                    name: data.name,
                    type: data.type?.toUpperCase(),
                    subjectEn: data.subject?.en,
                    subjectAr: data.subject?.ar,
                    bodyEn: data.body?.en,
                    bodyAr: data.body?.ar,
                    variables: data.variables,
                    triggerType: data.triggerType?.toUpperCase(),
                    eventTrigger: data.eventTrigger,
                    schedule: data.schedule,
                    version: (current?.version || 0) + 1
                }
            });

            return NextResponse.json({ success: true, template: updated });
        }

        if (action === 'activate') {
            const updated = await prisma.emailTemplate.update({
                where: { id: templateId },
                data: {
                    status: 'ACTIVE'
                }
            });

            return NextResponse.json({ success: true, template: updated });
        }

        if (action === 'archive') {
            const updated = await prisma.emailTemplate.update({
                where: { id: templateId },
                data: {
                    status: 'ARCHIVED'
                }
            });

            return NextResponse.json({ success: true, template: updated });
        }

        if (action === 'duplicate') {
            const original = await prisma.emailTemplate.findUnique({
                where: { id: templateId }
            });

            if (!original) {
                return NextResponse.json({ error: 'Template not found' }, { status: 404 });
            }

            const duplicate = await prisma.emailTemplate.create({
                data: {
                    name: `${original.name} (Copy)`,
                    type: original.type,
                    status: 'DRAFT',
                    subjectEn: original.subjectEn,
                    subjectAr: original.subjectAr,
                    bodyEn: original.bodyEn,
                    bodyAr: original.bodyAr,
                    variables: original.variables,
                    triggerType: original.triggerType,
                    eventTrigger: original.eventTrigger,
                    schedule: original.schedule,
                    version: 1,
                    createdBy: session.user.id
                }
            });

            return NextResponse.json({ success: true, template: duplicate });
        }

        if (action === 'delete') {
            await prisma.emailTemplate.delete({
                where: { id: templateId }
            });

            return NextResponse.json({ success: true });
        }

        if (action === 'test-send') {
            // In production, this would send a test email
            // For now, just log it
            console.log('Test email would be sent to:', data.testEmail);
            
            return NextResponse.json({ 
                success: true, 
                message: `Test email would be sent to ${data.testEmail}` 
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Template operation error:', error);
        return NextResponse.json(
            { error: 'Failed to process template operation' },
            { status: 500 }
        );
    }
}
