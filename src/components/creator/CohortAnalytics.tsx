'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  AlertTriangle,
  Award,
  Calendar,
  Activity,
  Clock,
  CheckCircle,
  BarChart3,
  PieChart,
} from 'lucide-react';
import Image from 'next/image';

interface AnalyticsProps {
  cohortId: string;
}

interface Analytics {
  overview: {
    totalMembers: number;
    activeMembers: number;
    completedMembers: number;
    droppedMembers: number;
    pendingMembers: number;
    avgProgress: number;
    completionRate: number;
    retentionRate: number;
    totalSessions: number;
    completedSessions: number;
    avgAttendance: number;
  };
  atRiskStudents: {
    count: number;
    students: Array<{
      id: string;
      userId: string;
      name: string;
      profileImage: string | null;
      progressPercent: number;
      attendedSessions: number;
      missedSessions: number;
      attendanceRate: number;
      lastActive: Date | null;
      risks: string[];
    }>;
  };
  topPerformers: Array<{
    id: string;
    userId: string;
    name: string;
    profileImage: string | null;
    progressPercent: number;
    attendanceRate: number;
    attendedSessions: number;
    score: number;
  }>;
  progressDistribution: {
    '0-25': number;
    '25-50': number;
    '50-75': number;
    '75-100': number;
  };
  attendanceTrend: Array<{
    sessionId: string;
    title: string;
    date: string;
    attendanceRate: number;
    attendedCount: number;
    totalMembers: number;
  }>;
  milestones: {
    total: number;
    completed: number;
    upcoming: number;
    overdue: number;
  };
  capstone: {
    submitted: number;
    pending: number;
    submissionRate: number;
  };
  timeMetrics: {
    totalDays: number;
    elapsedDays: number;
    daysRemaining: number;
    expectedProgress: number;
    actualProgress: number;
    progressPace: number;
    isOnTrack: boolean;
  };
  engagement: {
    avgSessionAttendance: number;
    totalAnnouncements: number;
    activeMembersPercent: number;
  };
}

export default function CohortAnalytics({ cohortId }: AnalyticsProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [cohortId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/creator/cohorts/${cohortId}/analytics`);
      const data = await response.json();

      if (response.ok) {
        setAnalytics(data);
      } else {
        toast.error(data.error || 'Failed to load analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-300">No analytics data available</p>
      </div>
    );
  }

  const { overview, atRiskStudents, topPerformers, progressDistribution, attendanceTrend, milestones, capstone, timeMetrics, engagement } = analytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Progress Analytics</h2>
        <p className="text-gray-400">
          Comprehensive insights into cohort performance and student progress
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-600 rounded-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
              timeMetrics.progressPace >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {timeMetrics.progressPace >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(timeMetrics.progressPace)}%
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{overview.avgProgress}%</div>
          <div className="text-sm text-gray-400">Average Progress</div>
          <div className="mt-2 text-xs text-gray-500">
            Expected: {timeMetrics.expectedProgress}%
          </div>
        </motion.div>

        {/* Attendance Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{overview.avgAttendance}%</div>
          <div className="text-sm text-gray-400">Average Attendance</div>
          <div className="mt-2 text-xs text-gray-500">
            {overview.completedSessions} of {overview.totalSessions} sessions
          </div>
        </motion.div>

        {/* Completion Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-600 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{overview.completionRate}%</div>
          <div className="text-sm text-gray-400">Completion Rate</div>
          <div className="mt-2 text-xs text-gray-500">
            {overview.completedMembers} completed
          </div>
        </motion.div>

        {/* At-Risk Students */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-red-600/20 to-orange-600/20 border border-red-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-600 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{atRiskStudents.count}</div>
          <div className="text-sm text-gray-400">At-Risk Students</div>
          <div className="mt-2 text-xs text-gray-500">
            Need attention
          </div>
        </motion.div>
      </div>

      {/* Time Progress Bar */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-white font-semibold">Cohort Timeline</h3>
              <p className="text-sm text-gray-400">{timeMetrics.daysRemaining} days remaining</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg ${
            timeMetrics.isOnTrack ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
          }`}>
            <span className="text-sm font-semibold">
              {timeMetrics.isOnTrack ? '✓ On Track' : '⚠ Needs Attention'}
            </span>
          </div>
        </div>
        <div className="relative">
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all duration-500"
              style={{ width: `${(timeMetrics.elapsedDays / timeMetrics.totalDays) * 100}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>Day 1</span>
            <span>Day {timeMetrics.elapsedDays} of {timeMetrics.totalDays}</span>
            <span>Day {timeMetrics.totalDays}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Distribution */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <PieChart className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold">Progress Distribution</h3>
          </div>
          <div className="space-y-4">
            {Object.entries(progressDistribution).map(([range, count], index) => {
              const total = overview.activeMembers;
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
              const colors = [
                'from-red-600 to-orange-600',
                'from-orange-600 to-yellow-600',
                'from-yellow-600 to-green-600',
                'from-green-600 to-emerald-600',
              ];
              
              return (
                <div key={range}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">{range}%</span>
                    <span className="text-sm font-semibold text-white">
                      {count} students ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${colors[index]} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attendance Trend */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-semibold">Attendance Trend</h3>
          </div>
          {attendanceTrend.length > 0 ? (
            <div className="space-y-4">
              {attendanceTrend.map((session, index) => (
                <div key={session.sessionId}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm text-white truncate">{session.title}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(session.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-white ml-4">
                      {session.attendanceRate}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        session.attendanceRate >= 80
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                          : session.attendanceRate >= 60
                          ? 'bg-gradient-to-r from-yellow-600 to-orange-600'
                          : 'bg-gradient-to-r from-red-600 to-orange-600'
                      }`}
                      style={{ width: `${session.attendanceRate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No completed sessions yet</p>
            </div>
          )}
        </div>
      </div>

      {/* At-Risk Students */}
      {atRiskStudents.count > 0 && (
        <div className="bg-gradient-to-br from-red-600/10 to-orange-600/10 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-600 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">At-Risk Students</h3>
              <p className="text-sm text-gray-400">
                {atRiskStudents.count} student{atRiskStudents.count !== 1 ? 's' : ''} need{atRiskStudents.count === 1 ? 's' : ''} immediate attention
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {atRiskStudents.students.map((student) => (
              <div
                key={student.id}
                className="bg-white/5 rounded-xl p-4 border border-red-500/20 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  {student.profileImage ? (
                    <Image
                      src={student.profileImage}
                      alt={student.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {student.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{student.name}</p>
                    <p className="text-xs text-gray-400">
                      {student.attendedSessions}A / {student.missedSessions}M
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white font-semibold">{student.progressPercent}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-600 to-orange-600"
                        style={{ width: `${student.progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {student.risks.map((risk, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium"
                      >
                        {risk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <div className="bg-gradient-to-br from-yellow-600/10 to-amber-600/10 border border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-yellow-600 to-amber-600 rounded-lg">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Top Performers</h3>
              <p className="text-sm text-gray-400">Students excelling in the cohort</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {topPerformers.map((student, index) => (
              <div
                key={student.id}
                className="bg-white/5 rounded-xl p-4 border border-yellow-500/20 hover:bg-white/10 transition-all text-center"
              >
                <div className="relative inline-block mb-3">
                  {student.profileImage ? (
                    <Image
                      src={student.profileImage}
                      alt={student.name}
                      width={60}
                      height={60}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-15 h-15 bg-gradient-to-br from-yellow-600 to-amber-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {student.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {index === 0 && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">1</span>
                    </div>
                  )}
                </div>
                <p className="text-white font-medium text-sm mb-2 truncate">{student.name}</p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-400">{student.progressPercent}%</div>
                    <div className="text-xs text-gray-400">Progress</div>
                  </div>
                  <div className="w-px h-8 bg-white/20"></div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-400">{student.attendanceRate}%</div>
                    <div className="text-xs text-gray-400">Attendance</div>
                  </div>
                </div>
                <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold">
                  Score: {student.score}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Milestones */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold">Milestones</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Total</span>
              <span className="text-white font-semibold">{milestones.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-green-400 text-sm">Completed</span>
              <span className="text-white font-semibold">{milestones.completed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-400 text-sm">Upcoming</span>
              <span className="text-white font-semibold">{milestones.upcoming}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-red-400 text-sm">Overdue</span>
              <span className="text-white font-semibold">{milestones.overdue}</span>
            </div>
          </div>
        </div>

        {/* Capstone Progress */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h3 className="text-white font-semibold">Capstone Project</h3>
          </div>
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-white mb-2">{capstone.submissionRate}%</div>
            <div className="text-sm text-gray-400">Submission Rate</div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Submitted</span>
              <span className="text-green-400 font-semibold">{capstone.submitted}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Pending</span>
              <span className="text-orange-400 font-semibold">{capstone.pending}</span>
            </div>
          </div>
        </div>

        {/* Member Status */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-semibold">Member Status</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-green-400 text-sm">Active</span>
              <span className="text-white font-semibold">{overview.activeMembers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-400 text-sm">Completed</span>
              <span className="text-white font-semibold">{overview.completedMembers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-yellow-400 text-sm">Pending</span>
              <span className="text-white font-semibold">{overview.pendingMembers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-red-400 text-sm">Dropped</span>
              <span className="text-white font-semibold">{overview.droppedMembers}</span>
            </div>
            <div className="pt-3 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-purple-400 text-sm font-semibold">Retention Rate</span>
                <span className="text-white font-bold">{overview.retentionRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
