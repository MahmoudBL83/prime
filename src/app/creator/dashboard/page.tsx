/**
 * Modern Creator Dashboard - Complete Rebuild
 * Advanced analytics, course management, earnings tracking, and live session controls
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  Plus,
  BookOpen,
  Users,
  TrendingUp,
  Video,
  Eye,
  DollarSign,
  Star,
  Calendar,
  Clock,
  Play,
  Edit,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Award,
  MessageSquare,
  Radio,
  BarChart3,
  Sparkles,
  Wallet,
  CreditCard,
  Download,
  Target,
  Flame,
  TrendingDown,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Types
interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  totalStudents: number;
  studentsChange: number;
  totalCourses: number;
  publishedCourses: number;
  avgRating: number;
  ratingChange: number;
  totalViews: number;
  viewsChange: number;
  watchHours: number;
  watchHoursChange: number;
  activeLiveSessions: number;
  upcomingLiveSessions: number;
}

interface RevenueData {
  total: number;
  categoryA: number;
  categoryB: number;
  categoryC: number;
  pending: number;
  nextPayoutDate: string;
  monthlyTrend: Array<{
    month: string;
    amount: number;
  }>;
}

interface CoursePerformance {
  id: string;
  title: string;
  thumbnail: string;
  enrollments: number;
  revenue: number;
  avgRating: number;
  completionRate: number;
  totalViews: number;
  category: string;
  status: string;
  trend: 'up' | 'down' | 'stable';
}

interface RecentActivity {
  id: string;
  type: 'enrollment' | 'review' | 'question' | 'completion' | 'live_join';
  message: string;
  timestamp: string;
  courseTitle?: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

export default function ModernCreatorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [topCourses, setTopCourses] = useState<CoursePerformance[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/login');
      return;
    }
    if (session.user.role !== 'CREATOR') {
      toast.error('Access denied. Creator account required.');
      router.push('/dashboard');
      return;
    }
    loadDashboardData();
  }, [session, status, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all dashboard data
      const [statsRes, revenueRes, coursesRes, activityRes] = await Promise.all([
        fetch('/api/creator/dashboard/stats'),
        fetch('/api/creator/dashboard/revenue'),
        fetch('/api/creator/dashboard/top-courses'),
        fetch('/api/creator/dashboard/activity?limit=10'),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }

      if (revenueRes.ok) {
        const data = await revenueRes.json();
        setRevenueData(data.revenue);
      }

      if (coursesRes.ok) {
        const data = await coursesRes.json();
        setTopCourses(data.courses);
      }

      if (activityRes.ok) {
        const data = await activityRes.json();
        setRecentActivity(data.activities);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'create-course',
      title: 'Create Course',
      description: 'Start a new course',
      icon: <Plus className="w-5 h-5" />,
      href: '/creator/courses/new',
      color: 'purple',
    },
    {
      id: 'go-live',
      title: 'Go Live',
      description: 'Start streaming',
      icon: <Radio className="w-5 h-5" />,
      href: '/creator/live-studio',
      color: 'red',
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View detailed insights',
      icon: <BarChart3 className="w-5 h-5" />,
      href: '/creator/analytics',
      color: 'blue',
    },
    {
      id: 'earnings',
      title: 'Earnings',
      description: 'Manage payouts',
      icon: <Wallet className="w-5 h-5" />,
      href: '/creator/earnings',
      color: 'green',
    },
  ];

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0a84ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Creator Studio
              </h1>
              <p className="text-muted-foreground mt-1">
                Welcome back, {session?.user?.name}! 👋
              </p>
            </div>
            <Button 
              onClick={() => router.push('/creator/courses/new')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Button>
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-foreground overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-100 flex items-center justify-between">
                Total Revenue
                <DollarSign className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">
                ${stats.totalRevenue.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-sm">
                {stats.revenueChange >= 0 ? (
                  <>
                    <ArrowUpRight className="w-4 h-4 text-green-300" />
                    <span className="text-green-300">+{stats.revenueChange.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-4 h-4 text-red-300" />
                    <span className="text-red-300">{stats.revenueChange.toFixed(1)}%</span>
                  </>
                )}
                <span className="text-purple-200 ml-1">vs last month</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Students */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-foreground overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100 flex items-center justify-between">
                Total Students
                <Users className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">
                {stats.totalStudents.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-sm">
                {stats.studentsChange >= 0 ? (
                  <>
                    <ArrowUpRight className="w-4 h-4 text-green-300" />
                    <span className="text-green-300">+{stats.studentsChange.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-4 h-4 text-red-300" />
                    <span className="text-red-300">{stats.studentsChange.toFixed(1)}%</span>
                  </>
                )}
                <span className="text-blue-200 ml-1">new this month</span>
              </div>
            </CardContent>
          </Card>

          {/* Average Rating */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-500 to-orange-600 text-foreground overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-100 flex items-center justify-between">
                Average Rating
                <Star className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1 flex items-center gap-2">
                {stats.avgRating.toFixed(1)}
                <span className="text-xl">/ 5.0</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                {stats.ratingChange >= 0 ? (
                  <>
                    <ArrowUpRight className="w-4 h-4 text-green-300" />
                    <span className="text-green-300">+{stats.ratingChange.toFixed(2)}</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-300" />
                    <span className="text-red-300">{stats.ratingChange.toFixed(2)}</span>
                  </>
                )}
                <span className="text-yellow-200 ml-1">from last period</span>
              </div>
            </CardContent>
          </Card>

          {/* Watch Hours */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-foreground overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-100 flex items-center justify-between">
                Watch Hours
                <Clock className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">
                {stats.watchHours.toLocaleString()}h
              </div>
              <div className="flex items-center gap-1 text-sm">
                {stats.watchHoursChange >= 0 ? (
                  <>
                    <ArrowUpRight className="w-4 h-4 text-green-200" />
                    <span className="text-green-200">+{stats.watchHoursChange.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-4 h-4 text-red-300" />
                    <span className="text-red-300">{stats.watchHoursChange.toFixed(1)}%</span>
                  </>
                )}
                <span className="text-green-200 ml-1">this month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => router.push(action.href)}
              className={`p-6 rounded-xl bg-background border-2 border-${action.color}-200 hover:border-${action.color}-500 hover:shadow-lg transition-all group text-left`}
            >
              <div className={`w-12 h-12 rounded-xl bg-${action.color}-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <div className={`text-${action.color}-600`}>
                  {action.icon}
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{action.title}</h3>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </button>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Revenue Breakdown (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Revenue by Category */}
            {revenueData && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-purple-600" />
                    Revenue Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Category A */}
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-foreground">Category A - All-Access Library</span>
                        </div>
                        <span className="text-xl font-bold text-blue-600">
                          ${revenueData.categoryA.toLocaleString()}
                        </span>
                      </div>
                      <Progress value={(revenueData.categoryA / revenueData.total) * 100} className="h-2 bg-blue-200" />
                      <p className="text-xs text-muted-foreground mt-2">
                        Revenue share from ad-supported content library
                      </p>
                    </div>

                    {/* Category B */}
                    <div className="p-4 bg-purple-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-purple-600" />
                          <span className="font-semibold text-foreground">Category B - Signature Courses</span>
                        </div>
                        <span className="text-xl font-bold text-purple-600">
                          ${revenueData.categoryB.toLocaleString()}
                        </span>
                      </div>
                      <Progress value={(revenueData.categoryB / revenueData.total) * 100} className="h-2 bg-purple-200" />
                      <p className="text-xs text-muted-foreground mt-2">
                        Direct revenue from signature programs
                      </p>
                    </div>

                    {/* Category C */}
                    <div className="p-4 bg-green-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-foreground">Category C - Membership Channels</span>
                        </div>
                        <span className="text-xl font-bold text-green-600">
                          ${revenueData.categoryC.toLocaleString()}
                        </span>
                      </div>
                      <Progress value={(revenueData.categoryC / revenueData.total) * 100} className="h-2 bg-green-200" />
                      <p className="text-xs text-muted-foreground mt-2">
                        Recurring revenue from channel memberships (85% net)
                      </p>
                    </div>

                    {/* Pending Payout */}
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Pending Payout</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          ${revenueData.pending.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Next payout: {new Date(revenueData.nextPayoutDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Withdraw
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Performing Courses */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-600" />
                  Top Performing Courses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCourses.map((course, index) => (
                    <div 
                      key={course.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-background hover:bg-card-hover transition-colors cursor-pointer"
                      onClick={() => router.push(`/creator/courses/${course.id}`)}
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-foreground ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                          'bg-gradient-to-br from-blue-400 to-blue-600'
                        }`}>
                          #{index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">{course.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {course.enrollments}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {course.totalViews}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            {course.avgRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-lg font-bold text-green-600">
                          ${course.revenue.toLocaleString()}
                        </span>
                        {course.trend === 'up' && (
                          <Badge className="bg-green-100 text-green-700">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Trending
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar (1 column) */}
          <div className="space-y-6">
            {/* Course Overview */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Course Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Courses</span>
                    <span className="text-2xl font-bold">{stats.totalCourses}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Published</span>
                    <Badge className="bg-green-100 text-green-700">
                      {stats.publishedCourses}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Draft</span>
                    <Badge className="bg-muted text-foreground">
                      {stats.totalCourses - stats.publishedCourses}
                    </Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push('/creator/courses')}
                  >
                    Manage Courses
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Live Sessions */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-red-600" />
                  Live Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Active Now</span>
                    <Badge className="bg-red-100 text-red-700 flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                      {stats.activeLiveSessions}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Upcoming</span>
                    <Badge className="bg-blue-100 text-blue-700">
                      {stats.upcomingLiveSessions}
                    </Badge>
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
                    onClick={() => router.push('/creator/live-studio')}
                  >
                    <Radio className="w-4 h-4 mr-2" />
                    Go Live
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        activity.type === 'enrollment' ? 'bg-blue-100' :
                        activity.type === 'review' ? 'bg-yellow-100' :
                        activity.type === 'question' ? 'bg-purple-100' :
                        activity.type === 'completion' ? 'bg-green-100' :
                        'bg-red-100'
                      }`}>
                        {activity.type === 'enrollment' && <Users className="w-4 h-4 text-blue-600" />}
                        {activity.type === 'review' && <Star className="w-4 h-4 text-yellow-600" />}
                        {activity.type === 'question' && <MessageSquare className="w-4 h-4 text-purple-600" />}
                        {activity.type === 'completion' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {activity.type === 'live_join' && <Radio className="w-4 h-4 text-red-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{activity.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section - Engagement Metrics */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              Student Engagement Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {stats.totalViews.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-xs text-green-600 mt-1">
                  +{stats.viewsChange.toFixed(1)}% this month
                </p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {((stats.watchHours / stats.totalStudents) || 0).toFixed(1)}h
                </div>
                <p className="text-sm text-muted-foreground">Avg Watch Time</p>
                <p className="text-xs text-muted-foreground mt-1">per student</p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {stats.avgRating.toFixed(1)}
                </div>
                <p className="text-sm text-muted-foreground">Course Rating</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star}
                      className={`w-3 h-3 ${star <= Math.round(stats.avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                <div className="text-3xl font-bold text-orange-600 mb-1">
                  {((stats.publishedCourses / stats.totalCourses) * 100).toFixed(0)}%
                </div>
                <p className="text-sm text-muted-foreground">Published Rate</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.publishedCourses}/{stats.totalCourses} courses
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Prevent static generation for pages that use session data
export const dynamic = 'force-dynamic'
export const runtime = 'edge'
