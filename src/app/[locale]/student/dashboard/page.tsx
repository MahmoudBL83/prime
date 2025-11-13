'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Calendar,
  Users,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Video,
  MessageSquare,
  Target,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

interface CohortInfo {
  id: string;
  courseTitle: string;
  courseThumbnail: string;
  courseCategory: string;
  creatorName: string;
  creatorImage: string;
  startDate: string;
  endDate: string;
  status: string;
  sessionsCount: number;
  announcementsCount: number;
  milestonesCount: number;
  unreadAnnouncements: number;
  totalDays: number;
  elapsedDays: number;
  daysRemaining: number;
  nextSession: {
    id: string;
    title: string;
    scheduledAt: string;
    type: string;
  } | null;
}

interface Membership {
  membershipId: string;
  membershipStatus: string;
  progressPercent: number;
  attendedSessions: number;
  missedSessions: number;
  capstoneSubmitted: boolean;
  joinedAt: string | null;
  cohort: CohortInfo;
}

export default function StudentDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [stats, setStats] = useState({ pending: 0, active: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchMyCohorts();
    }
  }, [status, router, filterStatus]);

  const fetchMyCohorts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const response = await fetch(`/api/student/my-cohorts?${params}`);
      const data = await response.json();

      if (response.ok) {
        setMemberships(data.memberships);
        setStats(data.stats);
      } else {
        toast.error(data.error || 'Failed to fetch cohorts');
      }
    } catch (error) {
      console.error('Error fetching cohorts:', error);
      toast.error('Failed to load your cohorts');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      { label: string; color: string; bgColor: string; icon: React.ReactNode }
    > = {
      PENDING: {
        label: 'Pending',
        color: 'text-yellow-300',
        bgColor: 'bg-yellow-500/10 border-yellow-500/20',
        icon: <Clock className="w-4 h-4" />,
      },
      ACTIVE: {
        label: 'Active',
        color: 'text-green-300',
        bgColor: 'bg-green-500/10 border-green-500/20',
        icon: <CheckCircle className="w-4 h-4" />,
      },
      COMPLETED: {
        label: 'Completed',
        color: 'text-blue-300',
        bgColor: 'bg-blue-500/10 border-blue-500/20',
        icon: <CheckCircle className="w-4 h-4" />,
      },
      DROPPED: {
        label: 'Dropped',
        color: 'text-red-300',
        bgColor: 'bg-red-500/10 border-red-500/20',
        icon: <AlertCircle className="w-4 h-4" />,
      },
    };
    return configs[status] || configs.PENDING;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">My Cohorts</h1>
          <p className="text-gray-400 text-lg">Track your progress across all enrolled cohorts</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Cohorts</span>
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-white">
              {stats.pending + stats.active + stats.completed}
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Pending</span>
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.pending}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Active</span>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.active}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Completed</span>
              <CheckCircle className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.completed}</p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { value: 'all', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === filter.value
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Cohorts Grid */}
        {memberships.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No cohorts found</h3>
            <p className="text-gray-400 mb-6">
              {filterStatus === 'all'
                ? "You haven't joined any cohorts yet"
                : `No ${filterStatus} cohorts`}
            </p>
            {filterStatus === 'all' && (
              <button
                onClick={() => router.push('/student/cohorts')}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all"
              >
                Browse Cohorts
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {memberships.map((membership, index) => {
              const statusConfig = getStatusConfig(membership.membershipStatus);
              const cohort = membership.cohort;
              const progressPercent = Math.round(membership.progressPercent);

              return (
                <motion.div
                  key={membership.membershipId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden hover:bg-white/10 transition-all group"
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={cohort.courseThumbnail || '/placeholder.png'}
                      alt={cohort.courseTitle}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border ${statusConfig.bgColor} ${statusConfig.color}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                    {cohort.unreadAnnouncements > 0 && (
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-semibold">
                          {cohort.unreadAnnouncements} New
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    {/* Title & Creator */}
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1 line-clamp-2">
                        {cohort.courseTitle}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <div className="relative w-5 h-5 rounded-full overflow-hidden">
                          <Image
                            src={cohort.creatorImage || '/default-avatar.png'}
                            alt={cohort.creatorName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span>{cohort.creatorName}</span>
                      </div>
                    </div>

                    {/* Progress Bar (Active only) */}
                    {membership.membershipStatus === 'ACTIVE' && (
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-white font-semibold">{progressPercent}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Video className="w-4 h-4 text-gray-400" />
                        <span>{cohort.sessionsCount}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Target className="w-4 h-4 text-gray-400" />
                        <span>{cohort.milestonesCount}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span>{cohort.announcementsCount}</span>
                      </div>
                    </div>

                    {/* Next Session (Active only) */}
                    {membership.membershipStatus === 'ACTIVE' && cohort.nextSession && (
                      <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <p className="text-xs text-purple-400 mb-1">Next Session</p>
                        <p className="text-sm text-white font-medium line-clamp-1">
                          {cohort.nextSession.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(cohort.nextSession.scheduledAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    )}

                    {/* Time Info (Active only) */}
                    {membership.membershipStatus === 'ACTIVE' && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>
                            {cohort.daysRemaining > 0
                              ? `${cohort.daysRemaining} days left`
                              : 'Ended'}
                          </span>
                        </div>
                        {membership.attendedSessions > 0 && (
                          <div className="text-green-400">
                            {membership.attendedSessions} sessions attended
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-2">
                      {membership.membershipStatus === 'PENDING' ? (
                        <button
                          onClick={() => router.push(`/student/cohorts/${cohort.id}`)}
                          className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                        >
                          View Details
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : membership.membershipStatus === 'ACTIVE' ? (
                        <button
                          onClick={() =>
                            router.push(`/student/cohorts/${cohort.id}/dashboard`)
                          }
                          className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                        >
                          Go to Dashboard
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => router.push(`/student/cohorts/${cohort.id}`)}
                          className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                        >
                          View Details
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* CTA to Browse More */}
        {memberships.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <button
              onClick={() => router.push('/student/cohorts')}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-all inline-flex items-center gap-2"
            >
              <BookOpen className="w-5 h-5" />
              Browse More Cohorts
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
