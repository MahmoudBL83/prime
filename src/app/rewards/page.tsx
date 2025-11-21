'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  Trophy,
  Gift,
  Star,
  TrendingUp,
  Award,
  Clock,
  Users,
  Target,
  Loader2,
  ChevronRight,
  Medal,
  Crown,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Reward {
  id: string;
  title: string;
  description: string;
  type: string;
  value?: number;
  currency?: string;
  maxWinners?: number;
  startDate?: string;
  endDate?: string;
  imageUrl?: string;
  courseTitle?: string;
  currentWinners: number;
  requirements: any;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userImage?: string;
  totalScore: number;
  quizScore: number;
  projectScore: number;
  participationScore: number;
  isCurrentUser?: boolean;
}

interface UserStats {
  totalPoints: number;
  totalAchievements: number;
  totalRewards: number;
  currentRank?: number;
}

export default function RewardsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalPoints: 0,
    totalAchievements: 0,
    totalRewards: 0,
  });
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  useEffect(() => {
    if (session?.user) {
      loadData();
    }
  }, [session, selectedCourse]);

  const loadData = async () => {
    try {
      const [rewardsRes, leaderboardRes, statsRes] = await Promise.all([
        fetch('/api/rewards'),
        fetch(`/api/leaderboard${selectedCourse !== 'all' ? `?courseId=${selectedCourse}` : ''}`),
        fetch('/api/rewards/my-stats'),
      ]);

      if (rewardsRes.ok) {
        const data = await rewardsRes.json();
        setRewards(data.rewards || []);
      }

      if (leaderboardRes.ok) {
        const data = await leaderboardRes.json();
        setLeaderboard(data.leaderboard || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setUserStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case 'SCHOLARSHIP':
        return <Trophy className="w-5 h-5" />;
      case 'PRIZE':
        return <Gift className="w-5 h-5" />;
      case 'CERTIFICATE':
        return <Award className="w-5 h-5" />;
      case 'BADGE':
        return <Medal className="w-5 h-5" />;
      default:
        return <Star className="w-5 h-5" />;
    }
  };

  const getRewardTypeColor = (type: string) => {
    switch (type) {
      case 'SCHOLARSHIP':
        return 'bg-yellow-100 text-yellow-700';
      case 'PRIZE':
        return 'bg-purple-100 text-purple-700';
      case 'CERTIFICATE':
        return 'bg-blue-100 text-blue-700';
      case 'BADGE':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600';
    if (rank === 2) return 'text-muted-foreground';
    if (rank === 3) return 'text-amber-600';
    return 'text-muted-foreground';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-muted-foreground" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return null;
  };

  const activeRewards = rewards.filter(r => {
    const now = new Date();
    const endDate = r.endDate ? new Date(r.endDate) : null;
    return !endDate || endDate > now;
  });

  const pastRewards = rewards.filter(r => {
    const now = new Date();
    const endDate = r.endDate ? new Date(r.endDate) : null;
    return endDate && endDate <= now;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-foreground">
        <div className="absolute inset-0 bg-background/10"></div>
        <div className="relative container max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-10 h-10" />
                <h1 className="text-4xl font-bold">Rewards & Scholarships</h1>
              </div>
              <p className="text-purple-100 text-lg">
                Compete, achieve, and win amazing prizes!
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white/10 backdrop-blur-md border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Total Points</p>
                    <p className="text-3xl font-bold">{userStats.totalPoints.toLocaleString()}</p>
                  </div>
                  <Zap className="w-10 h-10 text-yellow-300" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Achievements</p>
                    <p className="text-3xl font-bold">{userStats.totalAchievements}</p>
                  </div>
                  <Award className="w-10 h-10 text-blue-300" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Rewards Won</p>
                    <p className="text-3xl font-bold">{userStats.totalRewards}</p>
                  </div>
                  <Gift className="w-10 h-10 text-green-300" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Current Rank</p>
                    <p className="text-3xl font-bold">
                      {userStats.currentRank ? `#${userStats.currentRank}` : '-'}
                    </p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-pink-300" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rewards List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Available Rewards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-6">
                    <TabsTrigger value="active">Active ({activeRewards.length})</TabsTrigger>
                    <TabsTrigger value="past">Past ({pastRewards.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="active">
                    {activeRewards.length === 0 ? (
                      <div className="text-center py-12">
                        <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No active rewards at the moment</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activeRewards.map((reward) => (
                          <Card key={reward.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                {reward.imageUrl ? (
                                  <img
                                    src={reward.imageUrl}
                                    alt={reward.title}
                                    className="w-20 h-20 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                                    {getRewardTypeIcon(reward.type)}
                                  </div>
                                )}

                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <Badge className={getRewardTypeColor(reward.type)}>
                                        {reward.type}
                                      </Badge>
                                      <h3 className="text-lg font-bold text-foreground mt-2">
                                        {reward.title}
                                      </h3>
                                      {reward.value && (
                                        <p className="text-2xl font-bold text-purple-600">
                                          {reward.value} {reward.currency}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <p className="text-sm text-muted-foreground mb-3">
                                    {reward.description}
                                  </p>

                                  {reward.courseTitle && (
                                    <div className="flex items-center gap-2 mb-2">
                                      <Target className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-sm text-muted-foreground">
                                        Course: {reward.courseTitle}
                                      </span>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      {reward.maxWinners && (
                                        <div className="flex items-center gap-1">
                                          <Users className="w-4 h-4" />
                                          <span>{reward.currentWinners}/{reward.maxWinners} winners</span>
                                        </div>
                                      )}
                                      {reward.endDate && (
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-4 h-4" />
                                          <span>Ends {new Date(reward.endDate).toLocaleDateString()}</span>
                                        </div>
                                      )}
                                    </div>

                                    <Button
                                      size="sm"
                                      onClick={() => router.push(`/rewards/${reward.id}`)}
                                    >
                                      View Details
                                      <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="past">
                    {pastRewards.length === 0 ? (
                      <div className="text-center py-12">
                        <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No past rewards</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pastRewards.map((reward) => (
                          <Card key={reward.id} className="opacity-60">
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                                  {getRewardTypeIcon(reward.type)}
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-bold text-foreground mb-2">
                                    {reward.title}
                                  </h3>
                                  <Badge variant="secondary">Ended</Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.slice(0, 10).map((entry) => (
                    <div
                      key={entry.userId}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        entry.isCurrentUser ? 'bg-purple-50 border border-purple-200' : 'bg-background'
                      }`}
                    >
                      <div className="flex items-center justify-center w-8">
                        {entry.rank <= 3 ? (
                          getRankIcon(entry.rank)
                        ) : (
                          <span className={`font-bold ${getRankColor(entry.rank)}`}>
                            {entry.rank}
                          </span>
                        )}
                      </div>

                      {entry.userImage ? (
                        <img
                          src={entry.userImage}
                          alt={entry.userName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                          <span className="text-foreground font-semibold">
                            {entry.userName.charAt(0)}
                          </span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${
                          entry.isCurrentUser ? 'text-purple-700' : 'text-foreground'
                        }`}>
                          {entry.userName}
                          {entry.isCurrentUser && ' (You)'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.totalScore.toLocaleString()} pts
                        </p>
                      </div>

                      {entry.rank === 1 && (
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Prevent static generation for pages that use session data
export const dynamic = 'force-dynamic'
export const runtime = 'edge'
