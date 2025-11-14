import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get total points from all leaderboard entries
    const leaderboardEntries = await prisma.leaderboardEntry.findMany({
      where: {
        userId,
      },
      select: {
        totalScore: true,
      },
    });

    const totalPoints = leaderboardEntries.reduce(
      (sum, entry) => sum + (entry.totalScore || 0),
      0
    );

    // Get total achievements
    const achievements = await prisma.achievement.findMany({
      where: {
        userId,
      },
    });

    const totalAchievements = achievements.length;

    // Get rewards won
    const rewardsWon = await prisma.rewardWinner.findMany({
      where: {
        userId,
      },
    });

    const totalRewards = rewardsWon.length;

    // Get current rank (across all courses)
    // Find user's position in global leaderboard
    const allEntries = await prisma.leaderboardEntry.findMany({
      orderBy: {
        totalScore: 'desc',
      },
      select: {
        userId: true,
        totalScore: true,
      },
    });

    // Group by user and sum scores
    const userScores = new Map<string, number>();
    allEntries.forEach((entry) => {
      const current = userScores.get(entry.userId) || 0;
      userScores.set(entry.userId, current + (entry.totalScore || 0));
    });

    // Sort by total score
    const sortedUsers = Array.from(userScores.entries())
      .sort((a, b) => b[1] - a[1]);

    // Find user's rank
    const currentRank = sortedUsers.findIndex(([id]) => id === userId) + 1;

    return NextResponse.json({
      totalPoints,
      totalAchievements,
      totalRewards,
      currentRank: currentRank || null,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}
