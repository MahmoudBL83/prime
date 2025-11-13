'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Search,
  Calendar,
  Users,
  Clock,
  Globe,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Filter,
  Video,
  MessageSquare,
  Target,
} from 'lucide-react';

interface Cohort {
  id: string;
  courseId: string;
  courseTitle: string;
  courseTitleAr: string;
  courseThumbnail: string;
  courseCategory: string;
  description: string;
  startDate: string;
  endDate: string;
  enrollmentEndDate: string;
  status: string;
  maxMembers: number | null;
  currentMembers: number;
  spotsAvailable: number | null;
  isFull: boolean;
  sessionsCount: number;
  announcementsCount: number;
  membershipStatus: string | null;
  canApply: boolean;
  timezone: string;
  language: string;
}

export default function CohortsDiscoveryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [applyingTo, setApplyingTo] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchCohorts();
    }
  }, [status, router, filterStatus, searchQuery]);

  const fetchCohorts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/student/cohorts?${params}`);
      const data = await response.json();

      if (response.ok) {
        setCohorts(data.cohorts);
      } else {
        toast.error(data.error || 'Failed to fetch cohorts');
      }
    } catch (error) {
      console.error('Error fetching cohorts:', error);
      toast.error('Failed to load cohorts');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (cohortId: string) => {
    try {
      setApplyingTo(cohortId);
      const response = await fetch(`/api/student/cohorts/${cohortId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Application submitted! Waiting for approval.');
        fetchCohorts(); // Refresh to update status
      } else {
        toast.error(data.error || 'Failed to apply');
      }
    } catch (error) {
      console.error('Error applying to cohort:', error);
      toast.error('Failed to submit application');
    } finally {
      setApplyingTo(null);
    }
  };

  const getStatusBadge = (cohort: Cohort) => {
    if (cohort.membershipStatus) {
      const statusConfig: Record<string, { label: string; color: string }> = {
        PENDING: { label: 'Pending Approval', color: 'bg-yellow-500/20 text-yellow-300' },
        ACTIVE: { label: 'Enrolled', color: 'bg-green-500/20 text-green-300' },
        COMPLETED: { label: 'Completed', color: 'bg-blue-500/20 text-blue-300' },
        DROPPED: { label: 'Dropped', color: 'bg-red-500/20 text-red-300' },
      };
      const config = statusConfig[cohort.membershipStatus];
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
          {config.label}
        </span>
      );
    }

    if (cohort.isFull) {
      return (
        <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-semibold">
          Full
        </span>
      );
    }

    return (
      <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-semibold">
        Open
      </span>
    );
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
          <h1 className="text-4xl font-bold text-white mb-2">Discover Cohorts</h1>
          <p className="text-gray-400 text-lg">
            Join cohort-based learning experiences with peers and expert instructors
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cohorts..."
              className="w-full px-12 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-400 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter:
            </span>
            {[
              { value: 'all', label: 'All Cohorts' },
              { value: 'open', label: 'Open for Enrollment' },
              { value: 'upcoming', label: 'Starting Soon' },
              { value: 'active', label: 'Active' },
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
        {cohorts.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No cohorts found</h3>
            <p className="text-gray-400">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Check back later for new cohort opportunities'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cohorts.map((cohort, index) => {
              const startDate = new Date(cohort.startDate);
              const endDate = new Date(cohort.endDate);
              const enrollmentEnd = new Date(cohort.enrollmentEndDate);
              const now = new Date();
              const daysUntilStart = Math.ceil(
                (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              );
              const daysUntilEnrollmentEnd = Math.ceil(
                (enrollmentEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <motion.div
                  key={cohort.id}
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
                    <div className="absolute top-4 right-4">{getStatusBadge(cohort)}</div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    {/* Title */}
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1 line-clamp-2">
                        {cohort.courseTitle}
                      </h3>
                      <p className="text-sm text-purple-400">{cohort.courseCategory}</p>
                    </div>

                    {/* Description */}
                    <p className="text-gray-400 text-sm line-clamp-2">{cohort.description}</p>

                    {/* Meta Info */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {/* Dates */}
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          {startDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* Members */}
                      <div className="flex items-center gap-2 text-gray-300">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>
                          {cohort.currentMembers}
                          {cohort.maxMembers ? `/${cohort.maxMembers}` : ''}
                        </span>
                      </div>

                      {/* Sessions */}
                      <div className="flex items-center gap-2 text-gray-300">
                        <Video className="w-4 h-4 text-gray-400" />
                        <span>{cohort.sessionsCount} sessions</span>
                      </div>

                      {/* Language */}
                      <div className="flex items-center gap-2 text-gray-300">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="capitalize">{cohort.language}</span>
                      </div>
                    </div>

                    {/* Enrollment Info */}
                    {cohort.canApply && daysUntilEnrollmentEnd > 0 && (
                      <div className="flex items-center gap-2 text-sm text-orange-400 bg-orange-500/10 px-3 py-2 rounded-lg">
                        <Clock className="w-4 h-4" />
                        <span>
                          {daysUntilEnrollmentEnd === 1
                            ? 'Last day to enroll'
                            : `${daysUntilEnrollmentEnd} days to enroll`}
                        </span>
                      </div>
                    )}

                    {daysUntilStart > 0 && daysUntilStart <= 7 && (
                      <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 px-3 py-2 rounded-lg">
                        <AlertCircle className="w-4 h-4" />
                        <span>Starts in {daysUntilStart} days</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => router.push(`/student/cohorts/${cohort.id}`)}
                        className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                      >
                        View Details
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      {cohort.canApply && (
                        <button
                          onClick={() => handleApply(cohort.id)}
                          disabled={applyingTo === cohort.id}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {applyingTo === cohort.id ? 'Applying...' : 'Apply Now'}
                        </button>
                      )}

                      {cohort.membershipStatus === 'ACTIVE' && (
                        <button
                          onClick={() => router.push(`/student/cohorts/${cohort.id}/dashboard`)}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all"
                        >
                          Go to Dashboard
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
