'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Calendar,
  Users,
  Clock,
  Globe,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Video,
  MessageSquare,
  Target,
  User,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface CohortDetails {
  id: string;
  courseId: string;
  courseTitle: string;
  courseTitleAr: string;
  courseDescription: string;
  courseThumbnail: string;
  courseCategory: string;
  description: string;
  creatorId: string;
  creatorName: string;
  creatorImage: string;
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
  milestonesCount: number;
  timezone: string;
  language: string;
}

interface Membership {
  id: string;
  status: string;
  progressPercent: number;
  attendedSessions: number;
  missedSessions: number;
}

export default function CohortDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const cohortId = params.id as string;

  const [cohort, setCohort] = useState<CohortDetails | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [canApply, setCanApply] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [motivation, setMotivation] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchCohortDetails();
    }
  }, [status, router, cohortId]);

  const fetchCohortDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student/cohorts/${cohortId}`);
      const data = await response.json();

      if (response.ok) {
        setCohort(data.cohort);
        setMembership(data.membership);
        setCanApply(data.canApply);
      } else {
        toast.error(data.error || 'Failed to fetch cohort details');
        router.push('/student/cohorts');
      }
    } catch (error) {
      console.error('Error fetching cohort details:', error);
      toast.error('Failed to load cohort details');
      router.push('/student/cohorts');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      setApplying(true);
      const response = await fetch(`/api/student/cohorts/${cohortId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivation }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Application submitted successfully! Waiting for approval.');
        setShowApplicationModal(false);
        fetchCohortDetails(); // Refresh to show pending status
      } else {
        toast.error(data.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error applying to cohort:', error);
      toast.error('Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!cohort) return null;

  const startDate = new Date(cohort.startDate);
  const endDate = new Date(cohort.endDate);
  const enrollmentEnd = new Date(cohort.enrollmentEndDate);
  const now = new Date();
  const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilEnrollmentEnd = Math.ceil(
    (enrollmentEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/student/cohorts')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Cohorts</span>
        </button>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative h-80 rounded-2xl overflow-hidden mb-8"
        >
          <Image
            src={cohort.courseThumbnail || '/placeholder.png'}
            alt={cohort.courseTitle}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          
          {/* Status Badge */}
          <div className="absolute top-6 right-6">
            {membership ? (
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  membership.status === 'PENDING'
                    ? 'bg-yellow-500/20 text-yellow-300'
                    : membership.status === 'ACTIVE'
                    ? 'bg-green-500/20 text-green-300'
                    : membership.status === 'COMPLETED'
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                {membership.status === 'PENDING'
                  ? 'Pending Approval'
                  : membership.status === 'ACTIVE'
                  ? 'Enrolled'
                  : membership.status}
              </span>
            ) : cohort.isFull ? (
              <span className="px-4 py-2 bg-red-500/20 text-red-300 rounded-full text-sm font-semibold">
                Full
              </span>
            ) : (
              <span className="px-4 py-2 bg-green-500/20 text-green-300 rounded-full text-sm font-semibold">
                Open
              </span>
            )}
          </div>

          {/* Title & Category */}
          <div className="absolute bottom-6 left-6 right-6">
            <p className="text-purple-400 text-sm font-semibold mb-2">{cohort.courseCategory}</p>
            <h1 className="text-4xl font-bold text-white mb-2">{cohort.courseTitle}</h1>
            <p className="text-gray-300">{cohort.description}</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6"
            >
              <h2 className="text-2xl font-bold text-white mb-4">About This Cohort</h2>
              <p className="text-gray-300 leading-relaxed">{cohort.courseDescription}</p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
                <div className="flex items-center gap-2 text-purple-400 mb-2">
                  <Video className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-white">{cohort.sessionsCount}</p>
                <p className="text-sm text-gray-400">Live Sessions</p>
              </div>

              <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-white">{cohort.announcementsCount}</p>
                <p className="text-sm text-gray-400">Announcements</p>
              </div>

              <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <Target className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-white">{cohort.milestonesCount}</p>
                <p className="text-sm text-gray-400">Milestones</p>
              </div>

              <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
                <div className="flex items-center gap-2 text-orange-400 mb-2">
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {cohort.currentMembers}
                  {cohort.maxMembers ? `/${cohort.maxMembers}` : ''}
                </p>
                <p className="text-sm text-gray-400">Members</p>
              </div>
            </motion.div>

            {/* Creator Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6"
            >
              <h2 className="text-xl font-bold text-white mb-4">Your Instructor</h2>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden">
                  <Image
                    src={cohort.creatorImage || '/default-avatar.png'}
                    alt={cohort.creatorName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{cohort.creatorName}</h3>
                  <p className="text-gray-400 text-sm">Course Creator</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Key Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 space-y-4"
            >
              <h3 className="text-xl font-bold text-white mb-4">Details</h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-400">Start Date</p>
                    <p className="text-white font-medium">
                      {startDate.toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-400">End Date</p>
                    <p className="text-white font-medium">
                      {endDate.toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-400">Duration</p>
                    <p className="text-white font-medium">{duration} days</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-400">Timezone</p>
                    <p className="text-white font-medium">{cohort.timezone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-400">Language</p>
                    <p className="text-white font-medium capitalize">{cohort.language}</p>
                  </div>
                </div>
              </div>

              {/* Enrollment Deadline */}
              {canApply && daysUntilEnrollmentEnd > 0 && (
                <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>
                      {daysUntilEnrollmentEnd === 1
                        ? 'Last day to apply!'
                        : `${daysUntilEnrollmentEnd} days left to apply`}
                    </span>
                  </div>
                </div>
              )}

              {daysUntilStart > 0 && daysUntilStart <= 7 && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>Starts in {daysUntilStart} days</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 space-y-3">
                {membership?.status === 'ACTIVE' && (
                  <button
                    onClick={() => router.push(`/student/cohorts/${cohortId}/dashboard`)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all"
                  >
                    Go to Dashboard
                  </button>
                )}

                {membership?.status === 'PENDING' && (
                  <div className="w-full px-6 py-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 rounded-xl text-center font-semibold">
                    Application Pending
                  </div>
                )}

                {canApply && (
                  <button
                    onClick={() => setShowApplicationModal(true)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all"
                  >
                    Apply to Join
                  </button>
                )}

                {cohort.isFull && !membership && (
                  <div className="w-full px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-center font-semibold">
                    Cohort Full
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-2xl font-bold text-white mb-4">Apply to Join</h3>
            <p className="text-gray-400 mb-6">
              Tell us why you'd like to join this cohort (optional)
            </p>

            <textarea
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              placeholder="Share your motivation and goals..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[120px] mb-6"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowApplicationModal(false)}
                disabled={applying}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
              >
                {applying ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
