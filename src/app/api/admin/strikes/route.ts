import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { StrikeSeverity, AppealStatus } from '@prisma/client';

// Strike creation schema
const strikeSchema = z.object({
  creatorId: z.string(),
  contentType: z.enum(['COURSE', 'POST', 'LIVE_SESSION']),
  contentId: z.string(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  severity: z.enum(['WARNING', 'MINOR', 'MAJOR', 'CRITICAL']),
  expiresAt: z.string().optional(), // ISO date string
});

// Appeal resolution schema
const appealSchema = z.object({
  strikeId: z.string(),
  action: z.enum(['APPROVE', 'REJECT']),
  resolutionNotes: z.string().optional(),
});

// GET: List creator strikes
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const creatorId = searchParams.get('creatorId');
    const severity = searchParams.get('severity');
    const resolved = searchParams.get('resolved');
    const isAdmin = session.user.role === 'ADMIN';

    // Build filter
    const where: any = {};

    if (creatorId) {
      // If not admin, can only view own strikes
      if (!isAdmin && creatorId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      // Get creator ID from user ID
      const creator = await prisma.creator.findUnique({
        where: { userId: creatorId },
      });
      
      if (creator) {
        where.creatorId = creator.id;
      }
    }

    if (severity) {
      where.severity = severity as StrikeSeverity;
    }

    if (resolved === 'true') {
      where.appealStatus = AppealStatus.APPROVED;
    } else if (resolved === 'false') {
      where.OR = [
        { appealStatus: null },
        { appealStatus: AppealStatus.PENDING },
        { appealStatus: AppealStatus.REJECTED },
      ];
    }

    // Get strikes with creator info
    const strikes = await prisma.contentStrike.findMany({
      where,
      orderBy: {
        issuedAt: 'desc',
      },
    });

    // Get creator info for each strike
    const strikesWithCreators = await Promise.all(
      strikes.map(async (strike) => {
        const creator = await prisma.creator.findUnique({
          where: { id: strike.creatorId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return {
          ...strike,
          creator,
        };
      })
    );

    return NextResponse.json({
      strikes: strikesWithCreators,
    });

  } catch (error) {
    console.error('Error fetching strikes:', error);
    return NextResponse.json({ error: 'Failed to fetch strikes' }, { status: 500 });
  }
}

// POST: Issue strike
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = strikeSchema.parse(body);

    // Get creator
    const creator = await prisma.creator.findUnique({
      where: { id: validatedData.creatorId },
      include: {
        user: true,
      },
    });

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Create strike
    const strike = await prisma.contentStrike.create({
      data: {
        creatorId: validatedData.creatorId,
        contentType: validatedData.contentType,
        contentId: validatedData.contentId,
        reason: validatedData.reason,
        severity: validatedData.severity as StrikeSeverity,
        issuedBy: session.user.id,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
      },
    });

    // Check if account suspension needed
    // Count active strikes (MAJOR and CRITICAL)
    const activeStrikes = await prisma.contentStrike.findMany({
      where: {
        creatorId: validatedData.creatorId,
        severity: {
          in: ['MAJOR', 'CRITICAL'],
        },
        appealStatus: {
          not: AppealStatus.APPROVED, // Not resolved
        },
        OR: [
          { expiresAt: null }, // Never expires
          { expiresAt: { gte: new Date() } }, // Not expired
        ],
      },
    });

    let shouldSuspend = false;
    let suspensionReason = '';

    // CRITICAL strike = immediate suspension
    if (validatedData.severity === 'CRITICAL') {
      shouldSuspend = true;
      suspensionReason = 'Critical policy violation';
    }
    // 3rd MAJOR strike = suspension
    else if (validatedData.severity === 'MAJOR') {
      const majorStrikes = activeStrikes.filter(s => s.severity === 'MAJOR');
      if (majorStrikes.length >= 3) {
        shouldSuspend = true;
        suspensionReason = 'Multiple major policy violations';
      }
    }

    if (shouldSuspend) {
      // Update creator account status
      // Note: This would require adding a 'status' field to Creator model
      // For now, we'll just log it
      console.log(`SUSPEND CREATOR: ${validatedData.creatorId} - ${suspensionReason}`);
      
      // TODO: Implement actual suspension logic
      // - Set creator.status = 'SUSPENDED'
      // - Unpublish all their courses
      // - Cancel upcoming live sessions
      // - Notify creator
    }

    // TODO: Send notification email to creator
    // await sendStrikeNotification(creator.user.email, strike);

    return NextResponse.json({
      success: true,
      message: 'Strike issued successfully',
      strike,
      suspended: shouldSuspend,
      suspensionReason: shouldSuspend ? suspensionReason : null,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.issues 
      }, { status: 400 });
    }

    console.error('Error issuing strike:', error);
    return NextResponse.json({ 
      error: 'Failed to issue strike' 
    }, { status: 500 });
  }
}

// PUT: Resolve appeal
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = appealSchema.parse(body);

    // Get strike
    const strike = await prisma.contentStrike.findUnique({
      where: { id: validatedData.strikeId },
    });

    if (!strike) {
      return NextResponse.json({ error: 'Strike not found' }, { status: 404 });
    }

    // Can only resolve appeals that are pending
    if (strike.appealStatus !== AppealStatus.PENDING) {
      return NextResponse.json({ 
        error: 'Strike has no pending appeal' 
      }, { status: 400 });
    }

    // Update strike
    const updated = await prisma.contentStrike.update({
      where: { id: validatedData.strikeId },
      data: {
        appealStatus: validatedData.action === 'APPROVE' 
          ? AppealStatus.APPROVED 
          : AppealStatus.REJECTED,
        // Note: Schema doesn't have resolutionNotes field
        // Would need to add to schema or store in separate table
      },
    });

    // TODO: Send appeal result notification
    // await sendAppealResultNotification(strike.creatorId, updated);

    return NextResponse.json({
      success: true,
      message: `Appeal ${validatedData.action.toLowerCase()}d`,
      strike: updated,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.issues 
      }, { status: 400 });
    }

    console.error('Error resolving appeal:', error);
    return NextResponse.json({ 
      error: 'Failed to resolve appeal' 
    }, { status: 500 });
  }
}
