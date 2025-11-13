/**
 * Study Buddy Swipe Matching Service
 * Handles swipe actions, match creation, and candidate recommendations
 */

import { prisma } from '@/lib/prisma';

export interface SwipeCandidate {
  id: string;
  name: string;
  arabicName?: string;
  profileImage?: string;
  bio?: string;
  interests?: string[];
  goals?: string[];
  skillLevel?: string;
  enrolledCourses: {
    id: string;
    title: string;
    titleAr?: string;
  }[];
  studyPreferences?: {
    timezone?: string;
    communicationStyle?: string;
    learningStyle?: string;
    preferredStudyTimes?: string;
  };
  compatibilityScore: number;
}

/**
 * Calculate compatibility score between two users
 */
function calculateCompatibilityScore(
  currentUser: any,
  candidate: any
): number {
  let score = 0;

  // Shared courses (+30 points per shared course, max 60)
  const currentUserCourseIds = currentUser.enrollments?.map((e: any) => e.courseId) || [];
  const candidateCourseIds = candidate.enrollments?.map((e: any) => e.courseId) || [];
  const sharedCourses = currentUserCourseIds.filter((id: string) => 
    candidateCourseIds.includes(id)
  );
  score += Math.min(sharedCourses.length * 30, 60);

  // Shared interests (+10 points per shared interest, max 30)
  if (currentUser.interests && candidate.interests) {
    const currentInterests = JSON.parse(currentUser.interests);
    const candidateInterests = JSON.parse(candidate.interests);
    const sharedInterests = currentInterests.filter((i: string) => 
      candidateInterests.includes(i)
    );
    score += Math.min(sharedInterests.length * 10, 30);
  }

  // Shared goals (+10 points per shared goal, max 20)
  if (currentUser.goals && candidate.goals) {
    const currentGoals = JSON.parse(currentUser.goals);
    const candidateGoals = JSON.parse(candidate.goals);
    const sharedGoals = currentGoals.filter((g: string) => 
      candidateGoals.includes(g)
    );
    score += Math.min(sharedGoals.length * 10, 20);
  }

  // Similar skill level (+15 points)
  if (currentUser.skillLevel === candidate.skillLevel) {
    score += 15;
  }

  // Study preferences compatibility
  if (currentUser.studyPreferences && candidate.studyPreferences) {
    const currentPrefs = currentUser.studyPreferences;
    const candidatePrefs = candidate.studyPreferences;

    // Same timezone (+10 points)
    if (currentPrefs.timezone === candidatePrefs.timezone) {
      score += 10;
    }

    // Compatible communication style (+10 points)
    if (currentPrefs.communicationStyle === candidatePrefs.communicationStyle ||
        currentPrefs.communicationStyle === 'mixed' ||
        candidatePrefs.communicationStyle === 'mixed') {
      score += 10;
    }

    // Compatible learning style (+5 points)
    if (currentPrefs.learningStyle === candidatePrefs.learningStyle) {
      score += 5;
    }
  }

  return score;
}

/**
 * Get swipe candidates for a user
 */
export async function getSwipeCandidates(userId: string, limit: number = 20) {
  // Get current user with preferences and enrollments
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      enrollments: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              titleAr: true
            }
          }
        }
      },
      studyPreferences: true
    }
  });

  if (!currentUser) {
    throw new Error('User not found');
  }

  // Get users who have already been swiped on
  const swipedUserIds = await prisma.swipeAction.findMany({
    where: { swiperId: userId },
    select: { swipedId: true }
  });

  const excludedIds = swipedUserIds.map(s => s.swipedId);
  excludedIds.push(userId); // Exclude self

  // Get existing matches to exclude
  const existingMatches = await prisma.studyBuddyMatch.findMany({
    where: {
      OR: [
        { user1Id: userId },
        { user2Id: userId }
      ],
      status: 'ACTIVE'
    }
  });

  existingMatches.forEach(match => {
    if (match.user1Id === userId) {
      excludedIds.push(match.user2Id);
    } else {
      excludedIds.push(match.user1Id);
    }
  });

  // Fetch potential candidates
  const candidates = await prisma.user.findMany({
    where: {
      id: { notIn: excludedIds },
      role: 'LEARNER', // Only match with learners
      enrollments: {
        some: {} // Must have at least one enrollment
      }
    },
    include: {
      enrollments: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              titleAr: true
            }
          }
        },
        take: 5 // Limit to 5 courses per user
      },
      studyPreferences: true
    },
    take: limit * 2 // Get more to allow for filtering
  });

  // Calculate compatibility scores and format candidates
  const scoredCandidates: SwipeCandidate[] = candidates.map(candidate => {
    const compatibilityScore = calculateCompatibilityScore(currentUser, candidate);

    return {
      id: candidate.id,
      name: candidate.name,
      arabicName: candidate.arabicName || undefined,
      profileImage: candidate.profileImage || undefined,
      bio: candidate.bio || undefined,
      interests: candidate.interests ? JSON.parse(candidate.interests) : [],
      goals: candidate.goals ? JSON.parse(candidate.goals) : [],
      skillLevel: candidate.skillLevel || undefined,
      enrolledCourses: candidate.enrollments.map(e => ({
        id: e.course.id,
        title: e.course.title,
        titleAr: e.course.titleAr || undefined
      })),
      studyPreferences: candidate.studyPreferences ? {
        timezone: candidate.studyPreferences.timezone || undefined,
        communicationStyle: candidate.studyPreferences.communicationStyle || undefined,
        learningStyle: candidate.studyPreferences.learningStyle || undefined,
        preferredStudyTimes: candidate.studyPreferences.preferredStudyTimes || undefined
      } : undefined,
      compatibilityScore
    };
  });

  // Sort by compatibility score (highest first) and take top candidates
  scoredCandidates.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  return scoredCandidates.slice(0, limit);
}

/**
 * Record a swipe action (LIKE or PASS)
 */
export async function recordSwipe(
  swiperId: string,
  swipedId: string,
  action: 'LIKE' | 'PASS'
) {
  // Check if already swiped
  const existing = await prisma.swipeAction.findUnique({
    where: {
      swiperId_swipedId: {
        swiperId,
        swipedId
      }
    }
  });

  if (existing) {
    throw new Error('Already swiped on this user');
  }

  // Create swipe action
  const swipeAction = await prisma.swipeAction.create({
    data: {
      swiperId,
      swipedId,
      action
    }
  });

  // Check for mutual like (match)
  if (action === 'LIKE') {
    const reciprocalSwipe = await prisma.swipeAction.findUnique({
      where: {
        swiperId_swipedId: {
          swiperId: swipedId,
          swipedId: swiperId
        }
      }
    });

    if (reciprocalSwipe && reciprocalSwipe.action === 'LIKE') {
      // Create match!
      const match = await createMatch(swiperId, swipedId);
      
      // Update both swipe actions with match timestamp
      await prisma.swipeAction.updateMany({
        where: {
          OR: [
            { swiperId, swipedId },
            { swiperId: swipedId, swipedId: swiperId }
          ]
        },
        data: {
          matchedAt: new Date()
        }
      });

      return {
        swipeAction,
        matched: true,
        match
      };
    }
  }

  return {
    swipeAction,
    matched: false
  };
}

/**
 * Create a study buddy match
 */
async function createMatch(user1Id: string, user2Id: string) {
  // Get both users to calculate shared subjects and goals
  const [user1, user2] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user1Id },
      include: {
        enrollments: {
          include: {
            course: {
              select: { title: true, titleAr: true }
            }
          }
        }
      }
    }),
    prisma.user.findUnique({
      where: { id: user2Id },
      include: {
        enrollments: {
          include: {
            course: {
              select: { title: true, titleAr: true }
            }
          }
        }
      }
    })
  ]);

  if (!user1 || !user2) {
    throw new Error('User not found');
  }

  // Calculate shared subjects
  const user1Courses = user1.enrollments.map(e => e.course.title);
  const user2Courses = user2.enrollments.map(e => e.course.title);
  const sharedSubjects = user1Courses.filter(c => user2Courses.includes(c));

  // Calculate shared goals
  let sharedGoals: string[] = [];
  if (user1.goals && user2.goals) {
    const goals1 = JSON.parse(user1.goals);
    const goals2 = JSON.parse(user2.goals);
    sharedGoals = goals1.filter((g: string) => goals2.includes(g));
  }

  // Create match
  const match = await prisma.studyBuddyMatch.create({
    data: {
      user1Id,
      user2Id,
      status: 'ACTIVE',
      sharedSubjects: JSON.stringify(sharedSubjects),
      sharedGoals: JSON.stringify(sharedGoals)
    },
    include: {
      user1: {
        select: {
          id: true,
          name: true,
          arabicName: true,
          profileImage: true
        }
      },
      user2: {
        select: {
          id: true,
          name: true,
          arabicName: true,
          profileImage: true
        }
      }
    }
  });

  // TODO: Send notification to both users
  // TODO: Create chat room for the match

  return match;
}

/**
 * Get swipe statistics for a user
 */
export async function getSwipeStats(userId: string) {
  const [given, received, matches] = await Promise.all([
    prisma.swipeAction.count({
      where: { swiperId: userId }
    }),
    prisma.swipeAction.count({
      where: { swipedId: userId }
    }),
    prisma.swipeAction.count({
      where: {
        swiperId: userId,
        matchedAt: { not: null }
      }
    })
  ]);

  const likes = await prisma.swipeAction.count({
    where: { swiperId: userId, action: 'LIKE' }
  });

  const passes = await prisma.swipeAction.count({
    where: { swiperId: userId, action: 'PASS' }
  });

  const receivedLikes = await prisma.swipeAction.count({
    where: { swipedId: userId, action: 'LIKE' }
  });

  return {
    swipesGiven: given,
    swipesReceived: received,
    likes,
    passes,
    receivedLikes,
    matches,
    matchRate: given > 0 ? (matches / given) * 100 : 0
  };
}
