'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import {
  Users,
  Calendar,
  TrendingUp,
  Clock,
  ArrowLeft,
  Settings,
  MessageSquare,
  Video,
  CheckCircle,
  AlertCircle,
  Award,
  Target,
  UserPlus,
  UserMinus,
  Mail,
  Phone,
  MoreVertical,
  Ban,
  Edit2,
  Home,
  Play,
  Upload,
  Bell,
  BarChart3,
  Loader2,
} from 'lucide-react';
import SessionsList from '@/components/creator/SessionsList';
import AnnouncementsList from '@/components/creator/AnnouncementsList';
import CohortAnalytics from '@/components/creator/CohortAnalytics';
import MilestonesList from '@/components/creator/MilestonesList';

interface Member {
  id: string;
  status: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  attendedSessions: number;
  missedSessions: number;
  capstoneSubmitted: boolean;
  capstoneScore: number | null;
  joinedAt: string;
  isAtRisk: boolean;
  needsAttention: boolean;
  attendanceRate: number | null;
  user: {
    id: string;
    name: string;
    arabicName: string | null;
    email: string;
    profileImage: string | null;
  };
}

interface Session {
  id: string;
  title: string;
  titleAr: string | null;
  type: string;
  scheduledAt: string;
  duration: number;
  status: string;
  meetingUrl: string | null;
  attendeeCount: number;
  maxAttendees: number | null;
  _count: {
    attendees: number;
  };
}

interface CohortDetail {
  id: string;
  name: string;
  nameAr: string | null;
  description: string | null;
  startDate: string;
  endDate: string;
  maxMembers: number | null;
  status: string;
  progressPercent: number;
  occupancyPercent: number | null;
  isFull: boolean;
  daysRemaining: number;
  course: {
    id: string;
    title: string;
    titleAr: string | null;
    thumbnail: string | null;
    category: string;
  };
  members: Member[];
  sessions: Session[];
  announcements: any[];
  milestones: any[];
  _count: {
    members: number;
    sessions: number;
    announcements: number;
    milestones: number;
  };
}

interface Stats {
  memberStats: {
    total: number;
    active: number;
    pending: number;
    completed: number;
    dropped: number;
    averageProgress: number;
    capstoneSubmitted: number;
  };
  sessionStats: {
    total: number;
    upcoming: number;
    completed: number;
    live: number;
    averageAttendance: number;
  };
}

export default function CohortDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const cohortId = params?.id as string;
  const locale = params.locale as string;
  const isArabic = locale === 'ar';

  const [cohort, setCohort] = useState<CohortDetail | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'sessions' | 'announcements' | 'milestones' | 'analytics'>(
    'overview'
  );

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && cohortId) {
      fetchCohortDetails();
    }
  }, [status, router, cohortId]);

  const fetchCohortDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/creator/cohorts/${cohortId}`);
      const data = await response.json();

      if (response.ok) {
        setCohort(data.cohort);
        setStats({
          memberStats: data.memberStats,
          sessionStats: data.sessionStats,
        });
      } else {
        toast.error(data.error || 'Failed to fetch cohort details');
        router.push('/creator/cohorts');
      }
    } catch (error) {
      console.error('Error fetching cohort details:', error);
      toast.error('Failed to load cohort details');
      router.push('/creator/cohorts');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const response = await fetch(
        `/api/creator/cohorts/${cohortId}/members?userId=${userId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Member removed successfully');
        fetchCohortDetails();
      } else {
        toast.error(data.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'APPROVED':
        return 'bg-green-500';
      case 'PENDING':
        return 'bg-yellow-500';
      case 'COMPLETED':
        return 'bg-purple-500';
      case 'DROPPED':
      case 'REJECTED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-muted-foreground">{isArabic ? 'جاري التحميل...' : 'Loading cohort details...'}</p>
        </div>
      </div>
    );
  }

  if (!cohort) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* YouTube Studio Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/${locale}/creator/cohorts`)}
                className="p-2 hover:bg-accent rounded-full transition-colors"
                title={isArabic ? 'رجوع' : 'Back'}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push(`/${locale}`)}
                className="p-2 hover:bg-accent rounded-full transition-colors"
                title={isArabic ? 'الصفحة الرئيسية' : 'Home'}
              >
                <Home className="w-5 h-5" />
              </button>
            </div>

            <div className="h-8 w-px bg-border" />

            <Link href={`/${locale}/creator/dashboard`} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Play className="w-6 h-6 text-white fill-white" />
              </div>
              <span className="text-xl font-bold">
                {isArabic ? 'استوديو المنشئ' : 'Creator Studio'}
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/${locale}/creator/cohorts/${cohortId}/edit`}>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                {isArabic ? 'الإعدادات' : 'Settings'}
              </Button>
            </Link>
            
            <button 
              className="relative p-2 hover:bg-accent rounded-full transition-colors"
              onClick={() => toast(isArabic ? 'الرسائل قريباً' : 'Messaging coming soon')}
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            
            <button className="p-2 hover:bg-accent rounded-full transition-colors">
              <Bell className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold">
                {session?.user?.name?.[0]?.toUpperCase() || 'C'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-card border-r border-border sticky top-16">
          <nav className="p-4 space-y-1">
            <button
              onClick={() => {
                setNavigating(true);
                router.push(`/${locale}/creator/dashboard`);
              }}
              disabled={navigating}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-muted-foreground hover:bg-accent/50"
            >
              <BarChart3 className="w-5 h-5" />
              <span>{isArabic ? 'لوحة التحكم' : 'Dashboard'}</span>
            </button>

            <button
              onClick={() => {
                setNavigating(true);
                router.push(`/${locale}/creator/courses`);
              }}
              disabled={navigating}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-muted-foreground hover:bg-accent/50"
            >
              <Video className="w-5 h-5" />
              <span>{isArabic ? 'الدورات' : 'Courses'}</span>
            </button>

            <button
              onClick={() => {
                setNavigating(true);
                router.push(`/${locale}/creator/analytics`);
              }}
              disabled={navigating}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-muted-foreground hover:bg-accent/50"
            >
              <TrendingUp className="w-5 h-5" />
              <span>{isArabic ? 'التحليلات' : 'Analytics'}</span>
            </button>

            <button
              onClick={() => {
                setNavigating(true);
                router.push(`/${locale}/creator/cohorts`);
              }}
              disabled={navigating}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all bg-accent text-foreground font-semibold"
            >
              <Users className="w-5 h-5" />
              <span>{isArabic ? 'المجموعات التعليمية' : 'Cohorts'}</span>
            </button>

            <div className="h-px bg-border my-4" />

            <button
              onClick={() => {
                setNavigating(true);
                router.push(`/${locale}/creator/settings`);
              }}
              disabled={navigating}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent/50 transition-all"
            >
              <Settings className="w-5 h-5" />
              <span>{isArabic ? 'الإعدادات' : 'Settings'}</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Cohort Header */}
            <div>
              <h1 className="text-3xl font-bold mb-2">{cohort.name}</h1>
              <p className="text-muted-foreground">📚 {cohort.course.title}</p>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Members</p>
                    <h3 className="text-3xl font-bold text-white">
                      {stats?.memberStats.total || 0}
                    </h3>
                  </div>
                </div>
                {cohort.maxMembers && (
                  <p className="text-sm text-gray-400">
                    {cohort._count.members} / {cohort.maxMembers} seats filled
                  </p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Active Members</p>
                    <h3 className="text-3xl font-bold text-white">
                      {stats?.memberStats.active || 0}
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  Avg Progress: {stats?.memberStats.averageProgress || 0}%
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Sessions</p>
                    <h3 className="text-3xl font-bold text-white">
                      {stats?.sessionStats.total || 0}
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  {stats?.sessionStats.upcoming || 0} upcoming
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Days Remaining</p>
                    <h3 className="text-3xl font-bold text-white">
                      {cohort.daysRemaining}
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  Progress: {cohort.progressPercent}%
                </p>
              </motion.div>
            </div>

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
          <div className="flex border-b border-white/20">
            {[
              { id: 'overview', label: 'Overview', icon: Target },
              { id: 'members', label: 'Members', icon: Users },
              { id: 'sessions', label: 'Sessions', icon: Video },
              { id: 'announcements', label: 'Announcements', icon: MessageSquare },
              { id: 'milestones', label: 'Milestones', icon: Target },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Description */}
                  <div className="bg-white/5 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-3">Description</h3>
                    <p className="text-gray-300">
                      {cohort.description || 'No description provided'}
                    </p>
                  </div>

                  {/* Timeline */}
                  <div className="bg-white/5 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-3">Timeline</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-purple-400" />
                        <div>
                          <p className="text-sm text-gray-400">Start Date</p>
                          <p className="text-white font-semibold">
                            {new Date(cohort.startDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-pink-400" />
                        <div>
                          <p className="text-sm text-gray-400">End Date</p>
                          <p className="text-white font-semibold">
                            {new Date(cohort.endDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Overview */}
                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Progress Overview</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300">Cohort Progress</span>
                        <span className="text-white font-semibold">
                          {cohort.progressPercent}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
                          style={{ width: `${cohort.progressPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    {cohort.occupancyPercent !== null && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-300">Seat Occupancy</span>
                          <span className="text-white font-semibold">
                            {cohort.occupancyPercent}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all"
                            style={{ width: `${cohort.occupancyPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">
                    Members ({cohort.members.length})
                  </h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                    <UserPlus className="w-4 h-4" />
                    Add Member
                  </button>
                </div>

                {cohort.members.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300">No members yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cohort.members.map((member) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 transition-all"
                      >
                        {/* Avatar */}
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0">
                          {member.user.profileImage ? (
                            <Image
                              src={member.user.profileImage}
                              alt={member.user.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold">
                              {member.user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-semibold truncate">
                              {member.user.name}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white ${getStatusColor(
                                member.status
                              )}`}
                            >
                              {member.status}
                            </span>
                            {member.isAtRisk && (
                              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold">
                                AT RISK
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>Progress: {member.progressPercent}%</span>
                            {member.attendanceRate !== null && (
                              <span>Attendance: {member.attendanceRate}%</span>
                            )}
                            <span>
                              Sessions: {member.attendedSessions}/{member.attendedSessions + member.missedSessions}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <button
                          onClick={() => handleRemoveMember(member.user.id)}
                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sessions Tab */}
            {activeTab === 'sessions' && cohort && (
              <SessionsList
                cohortId={cohort.id}
                cohortDates={{
                  startDate: new Date(cohort.startDate),
                  endDate: new Date(cohort.endDate),
                }}
              />
            )}

            {/* Announcements Tab */}
            {activeTab === 'announcements' && cohort && (
              <AnnouncementsList cohortId={cohort.id} />
            )}

            {/* Milestones Tab */}
            {activeTab === 'milestones' && cohort && (
              <MilestonesList
                cohortId={cohort.id}
                cohortDates={{
                  startDate: new Date(cohort.startDate),
                  endDate: new Date(cohort.endDate),
                }}
              />
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && cohort && (
              <CohortAnalytics cohortId={cohort.id} />
            )}
          </div>
        </div>
          </div>
        </main>
      </div>
    </div>
  );
}
