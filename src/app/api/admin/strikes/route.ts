import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { StrikeSeverity, AppealStatus } from '@prisma/client';
import { sendEmail } from '@/lib/email';

const RESOLVED_APPEAL_STATUSES: AppealStatus[] = [
  AppealStatus.UPHELD,
  AppealStatus.REDUCED,
  AppealStatus.REINSTATED,
  AppealStatus.REJECTED,
];

/**
 * Send strike notification email to creator
 */
async function sendStrikeNotificationEmail(
  creatorEmail: string,
  creatorName: string,
  strike: {
    severity: string;
    reason: string;
    contentType: string;
  },
  suspended: boolean
) {
  const severityColors: Record<string, string> = {
    WARNING: '#F59E0B',
    MINOR: '#3B82F6',
    MAJOR: '#EF4444',
    CRITICAL: '#7C2D12'
  };
  
  const color = severityColors[strike.severity] || '#6B7280';
  
  await sendEmail({
    to: creatorEmail,
    subject: suspended 
      ? `⚠️ Account Suspended - Policy Violation`
      : `⚠️ Content Strike Issued - ${strike.severity}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${color}; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">
            ${suspended ? '🚫 Account Suspended' : '⚠️ Content Strike'}
          </h1>
        </div>
        <div style="padding: 30px; background: #ffffff;">
          <p>Hi ${creatorName},</p>
          
          ${suspended ? `
            <div style="background: #FEE2E2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #DC2626; font-weight: bold;">Your account has been suspended</p>
              <p style="margin: 10px 0 0 0; font-size: 14px;">Due to policy violations, your creator account has been temporarily suspended. Your courses and content are no longer visible to users.</p>
            </div>
          ` : ''}
          
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0;">Strike Details</h3>
            <p style="margin: 5px 0;"><strong>Severity:</strong> <span style="color: ${color}; font-weight: bold;">${strike.severity}</span></p>
            <p style="margin: 5px 0;"><strong>Content Type:</strong> ${strike.contentType}</p>
            <p style="margin: 5px 0;"><strong>Reason:</strong> ${strike.reason}</p>
          </div>
          
          <h3>What This Means</h3>
          <ul>
            <li>This strike has been recorded on your account</li>
            <li>Multiple strikes may result in account suspension</li>
            ${suspended ? '<li>Your content is currently hidden from users</li>' : ''}
            <li>You may appeal this decision within 14 days</li>
          </ul>
          
          <h3>How to Appeal</h3>
          <p>If you believe this strike was issued in error, you can submit an appeal through your Creator Dashboard:</p>
          <ol>
            <li>Go to Creator Dashboard → Settings → Strikes</li>
            <li>Find this strike and click "Appeal"</li>
            <li>Provide a detailed explanation</li>
          </ol>
          
          <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>Need help?</strong> Contact our creator support team for assistance.</p>
          </div>
          
          <p style="color: #6B7280; font-size: 14px;">
            Please review our Community Guidelines to ensure your content complies with our policies.
          </p>
        </div>
      </div>
    `
  });
}

/**
 * Send appeal result notification email
 */
async function sendAppealResultEmail(
  creatorEmail: string,
  creatorName: string,
  strike: {
    severity: string;
    reason: string;
  },
  approved: boolean,
  reinstated: boolean
) {
  await sendEmail({
    to: creatorEmail,
    subject: approved 
      ? '✅ Appeal Approved - Strike Removed'
      : '❌ Appeal Rejected - Strike Upheld',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${approved ? '#10B981' : '#EF4444'}; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">
            ${approved ? '✅ Appeal Approved' : '❌ Appeal Rejected'}
          </h1>
        </div>
        <div style="padding: 30px; background: #ffffff;">
          <p>Hi ${creatorName},</p>
          
          <p>We have reviewed your appeal regarding the ${strike.severity} strike on your account.</p>
          
          ${approved ? `
            <div style="background: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #047857; font-weight: bold;">Good news! Your appeal has been approved.</p>
              <p style="margin: 10px 0 0 0;">The strike has been removed from your account and will not count against you.</p>
              ${reinstated ? '<p style="margin: 10px 0 0 0;"><strong>Your account has been reinstated.</strong> You can now access all creator features.</p>' : ''}
            </div>
          ` : `
            <div style="background: #FEE2E2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #DC2626; font-weight: bold;">Your appeal has been rejected.</p>
              <p style="margin: 10px 0 0 0;">After careful review, we have determined that the strike was issued correctly and will remain on your account.</p>
            </div>
          `}
          
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0;">Original Strike</h3>
            <p style="margin: 5px 0;"><strong>Severity:</strong> ${strike.severity}</p>
            <p style="margin: 5px 0;"><strong>Reason:</strong> ${strike.reason}</p>
          </div>
          
          ${!approved ? `
            <p>If you have additional evidence or information, you may contact our support team for further review.</p>
          ` : ''}
          
          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            Thank you for your patience during this process.
          </p>
        </div>
      </div>
    `
  });
}

/**
 * Suspend a creator's account
 * Note: Uses kycStatus to track suspension since Creator model doesn't have dedicated status field
 * A suspended creator will have kycStatus = 'REJECTED' as a workaround
 * Ideally, should add 'status' field to Creator model
 */
async function suspendCreatorAccount(creatorId: string, reason: string) {
  // Get current creator info with their channels
  const creator = await prisma.creator.findUnique({
    where: { id: creatorId },
    include: { channels: true }
  })
  
  if (!creator) return;
  
  // Update creator - mark as suspended by prefixing expertise with marker
  await prisma.creator.update({
    where: { id: creatorId },
    data: {
      kycStatus: 'REJECTED', // Use REJECTED as suspension indicator
      expertise: `SUSPENDED:${reason}|${creator.expertise || ''}` // Prefix expertise with suspension marker
    }
  });
  
  // Unpublish all their courses
  await prisma.course.updateMany({
    where: { 
      creatorId: creatorId,
      status: 'PUBLISHED'
    },
    data: {
      status: 'DRAFT'
    }
  });
  
  // Cancel upcoming live sessions (through their channels)
  if (creator.channels.length > 0) {
    const channelIds = creator.channels.map(ch => ch.id)
    await prisma.liveSession.updateMany({
      where: {
        channelId: { in: channelIds },
        scheduledAt: { gte: new Date() },
        status: 'SCHEDULED'
      },
      data: { 
        status: 'CANCELLED' 
      }
    });
  }
  
  console.log(`Creator ${creatorId} suspended: ${reason}`);
}

/**
 * Reinstate a suspended creator account
 */
async function reinstateCreatorAccount(creatorId: string) {
  const creator = await prisma.creator.findUnique({
    where: { id: creatorId }
  });
  
  if (!creator || !creator.expertise?.startsWith('SUSPENDED:')) {
    return false;
  }
  
  // Extract original expertise
  const expertiseParts = creator.expertise.split('|');
  const originalExpertise = expertiseParts.slice(1).join('|') || null;
  
  // Update creator status back to active
  await prisma.creator.update({
    where: { id: creatorId },
    data: {
      kycStatus: 'VERIFIED', // Reinstate to verified status
      expertise: originalExpertise
    }
  });
  
  console.log(`Creator ${creatorId} reinstated`);
  return true;
}

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
      where.appealStatus = { in: RESOLVED_APPEAL_STATUSES };
    } else if (resolved === 'false') {
      where.OR = [
        { appealStatus: null },
        { appealStatus: AppealStatus.PENDING },
        { appealStatus: AppealStatus.UNDER_REVIEW },
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
          notIn: RESOLVED_APPEAL_STATUSES, // Not resolved
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
      // Suspend the creator account
      await suspendCreatorAccount(validatedData.creatorId, suspensionReason);
    }

    // Send notification email to creator
    try {
      await sendStrikeNotificationEmail(
        creator.user.email,
        creator.user.name || 'Creator',
        {
          severity: validatedData.severity,
          reason: validatedData.reason,
          contentType: validatedData.contentType
        },
        shouldSuspend
      );
    } catch (emailError) {
      console.error('Failed to send strike notification email:', emailError);
      // Don't fail the request if email fails
    }

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
          ? AppealStatus.REINSTATED
          : AppealStatus.UPHELD,
        // Note: Schema doesn't have resolutionNotes field
        // Would need to add to schema or store in separate table
      },
    });

    // Get creator info for email
    const creator = await prisma.creator.findUnique({
      where: { id: strike.creatorId },
      include: { user: true }
    });

    // Check if we should reinstate a suspended account
    let reinstated = false;
    if (validatedData.action === 'APPROVE' && creator) {
      // Check if this was the strike that caused suspension
      // If the creator is suspended and this was a CRITICAL or 3rd MAJOR strike
      if (strike.severity === 'CRITICAL' || strike.severity === 'MAJOR') {
        reinstated = await reinstateCreatorAccount(strike.creatorId);
      }
    }

    // Send appeal result notification
    if (creator?.user?.email) {
      try {
        await sendAppealResultEmail(
          creator.user.email,
          creator.user.name || 'Creator',
          {
            severity: strike.severity,
            reason: strike.reason
          },
          validatedData.action === 'APPROVE',
          reinstated
        );
      } catch (emailError) {
        console.error('Failed to send appeal result email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Appeal ${validatedData.action.toLowerCase()}d${reinstated ? ' - Account reinstated' : ''}`,
      strike: updated,
      reinstated,
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
