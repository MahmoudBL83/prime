import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Discover potential study buddies (swipe queue)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get user's preferences from StudyPreferences
    const userPrefs = await prisma.studyPreferences.findUnique({
      where: { userId: session.user.id },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        interests: true,
        goals: true,
        skillLevel: true,
        studyBuddyPreferences: true,
      },
    });

    // Get users already swiped on (both LIKE and PASS)
    const existingSwipes = await prisma.swipeAction.findMany({
      where: { swiperId: session.user.id },
      select: { swipedId: true },
    });
    const swipedUserIds = existingSwipes.map(s => s.swipedId);

    // Get existing matches
    const existingMatches = await prisma.studyBuddyMatch.findMany({
      where: {
        OR: [
          { user1Id: session.user.id },
          { user2Id: session.user.id },
        ],
      },
      select: {
        user1Id: true,
        user2Id: true,
      },
    });
    const matchedUserIds = existingMatches.flatMap(m => 
      [m.user1Id, m.user2Id].filter(id => id !== session.user.id)
    );

    // Build filter for potential buddies
    const excludedIds = [...swipedUserIds, ...matchedUserIds, session.user.id];

    // Get potential buddies with basic filtering
    const potentialBuddies = await prisma.user.findMany({
      where: {
        id: { notIn: excludedIds },
        studyBuddyPreferences: { not: null }, // Must have preferences set
      },
      select: {
        id: true,
        name: true,
        profileImage: true,
        bio: true,
        interests: true,
        goals: true,
        skillLevel: true,
        studyBuddyPreferences: true,
      },
      take: limit * 2, // Get more to score and filter
    });

    // Calculate compatibility scores
    const scoredBuddies = potentialBuddies.map(buddy => {
      const score = calculateCompatibilityScore(
        user,
        userPrefs,
        buddy,
        JSON.parse(buddy.studyBuddyPreferences || '{}')
      );

      return {
        ...buddy,
        compatibilityScore: score,
        matchReasons: getMatchReasons(user, buddy),
      };
    });

    // Sort by score and take top N
    const topMatches = scoredBuddies
      .filter(b => b.compatibilityScore >= 40) // Minimum threshold
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, limit);

    return NextResponse.json({
      buddies: topMatches,
      hasMore: potentialBuddies.length === limit * 2,
    });

  } catch (error) {
    console.error('Error fetching study buddies:', error);
    return NextResponse.json({ error: 'Failed to fetch study buddies' }, { status: 500 });
  }
}

// Calculate compatibility score (0-100)
function calculateCompatibilityScore(
  user: any,
  userPrefs: any,
  buddy: any,
  buddyPrefs: any
): number {
  let score = 0;
  let weights = 0;

  // 1. Interests overlap (30%)
  if (user.interests && buddy.interests) {
    const userInterests = (user.interests as string).split(',').map(s => s.trim().toLowerCase());
    const buddyInterests = (buddy.interests as string).split(',').map(s => s.trim().toLowerCase());
    const overlap = userInterests.filter(i => buddyInterests.includes(i)).length;
    const total = new Set([...userInterests, ...buddyInterests]).size;
    score += (overlap / Math.max(total, 1)) * 30;
    weights += 30;
  }

  // 2. Goals alignment (25%)
  if (user.goals && buddy.goals) {
    const userGoals = (user.goals as string).toLowerCase();
    const buddyGoals = (buddy.goals as string).toLowerCase();
    const commonGoals = ['exam', 'career', 'project', 'skill', 'certificate'];
    const userGoalMatches = commonGoals.filter(g => userGoals.includes(g));
    const buddyGoalMatches = commonGoals.filter(g => buddyGoals.includes(g));
    const overlap = userGoalMatches.filter(g => buddyGoalMatches.includes(g)).length;
    score += (overlap / Math.max(userGoalMatches.length, buddyGoalMatches.length, 1)) * 25;
    weights += 25;
  }

  // 3. Skill level compatibility (15%)
  if (user.skillLevel && buddy.skillLevel) {
    const levels = ['beginner', 'intermediate', 'advanced'];
    const userLevel = levels.indexOf(user.skillLevel.toLowerCase());
    const buddyLevel = levels.indexOf(buddy.skillLevel.toLowerCase());
    const levelDiff = Math.abs(userLevel - buddyLevel);
    score += (1 - levelDiff / 2) * 15; // Closer levels = higher score
    weights += 15;
  }

  // 4. Study preferences match (20%)
  if (userPrefs && buddyPrefs) {
    let prefMatches = 0;
    let prefChecks = 0;

    // Communication style
    if (userPrefs.communicationStyle && buddyPrefs.communicationStyle) {
      if (userPrefs.communicationStyle === buddyPrefs.communicationStyle) prefMatches++;
      prefChecks++;
    }

    // Learning style
    if (userPrefs.learningStyle && buddyPrefs.learningStyle) {
      if (userPrefs.learningStyle === buddyPrefs.learningStyle) prefMatches++;
      prefChecks++;
    }

    // Session structure
    if (userPrefs.sessionStructure && buddyPrefs.sessionStructure) {
      if (userPrefs.sessionStructure === buddyPrefs.sessionStructure) prefMatches++;
      prefChecks++;
    }

    if (prefChecks > 0) {
      score += (prefMatches / prefChecks) * 20;
      weights += 20;
    }
  }

  // 5. Timezone compatibility (10%)
  if (userPrefs?.timezone && buddyPrefs?.timezone) {
    // Simple check: same timezone = 10, within 3 hours = 5, else 0
    if (userPrefs.timezone === buddyPrefs.timezone) {
      score += 10;
    }
    weights += 10;
  }

  // Normalize to 100
  return weights > 0 ? Math.round((score / weights) * 100) : 50;
}

// Get human-readable match reasons
function getMatchReasons(user: any, buddy: any): string[] {
  const reasons: string[] = [];

  if (user.interests && buddy.interests) {
    const userInterests = (user.interests as string).split(',').map(s => s.trim());
    const buddyInterests = (buddy.interests as string).split(',').map(s => s.trim());
    const overlap = userInterests.filter(i => buddyInterests.some(bi => 
      bi.toLowerCase() === i.toLowerCase()
    ));
    if (overlap.length > 0) {
      reasons.push(`Shared interest: ${overlap[0]}`);
    }
  }

  if (user.skillLevel === buddy.skillLevel) {
    reasons.push(`Same skill level: ${user.skillLevel}`);
  }

  if (user.goals && buddy.goals) {
    const userGoals = (user.goals as string).toLowerCase();
    const buddyGoals = (buddy.goals as string).toLowerCase();
    if (userGoals.includes('exam') && buddyGoals.includes('exam')) {
      reasons.push('Both preparing for exams');
    } else if (userGoals.includes('career') && buddyGoals.includes('career')) {
      reasons.push('Both focused on career growth');
    }
  }

  return reasons.slice(0, 3); // Top 3 reasons
}
