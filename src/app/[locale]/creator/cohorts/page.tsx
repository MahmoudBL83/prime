'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import CreateCohortModal from '@/components/creator/CreateCohortModal';
import { Button } from '@/components/ui/button';
import {
  Users,
  Calendar,
  TrendingUp,
  Clock,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowLeft,
  Home,
  Play,
  Upload,
  MessageSquare,
  Bell,
  BarChart3,
  Video,
  Settings,
  Loader2,
} from 'lucide-react';

interface Cohort {
  id: string;
  name: string;
  nameAr: string | null;
  description: string | null;
  startDate: string;
  endDate: string;
  maxMembers: number | null;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  currentStatus: string;
  progressPercent: number;
  occupancyPercent: number | null;
  isFull: boolean;
  daysRemaining: number | null;
  course: {
    id: string;
    title: string;
    titleAr: string | null;
    thumbnail: string | null;
    category: string;
  };
  _count: {
    members: number;
    sessions: number;
    announcements: number;
  };
}

interface Stats {
  totalCohorts: number;
  activeCohorts: number;
  upcomingCohorts: number;
  totalMembers: number;
  totalSessions: number;
}

export default function CohortsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const isArabic = locale === 'ar';
  
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchCohorts();
    }
  }, [status, router, filterStatus]);

  const fetchCohorts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus.toUpperCase());
      }

      const response = await fetch(`/api/creator/cohorts?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setCohorts(data.cohorts || []);
        setStats(data.stats);
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

  const handleDeleteCohort = async () => {
    if (!selectedCohort) return;

    try {
      const response = await fetch(`/api/creator/cohorts/${selectedCohort.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Cohort deleted successfully');
        setShowDeleteModal(false);
        setSelectedCohort(null);
        fetchCohorts();
      } else {
        toast.error(data.error || 'Failed to delete cohort');
      }
    } catch (error) {
      console.error('Error deleting cohort:', error);
      toast.error('Failed to delete cohort');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'UPCOMING':
        return 'bg-gradient-to-r from-blue-500 to-indigo-500';
      case 'COMPLETED':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'CANCELLED':
        return 'bg-gradient-to-r from-red-500 to-orange-500';
      default:
        return 'bg-gradient-to-r from-gray-500 to-slate-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-4 h-4" />;
      case 'UPCOMING':
        return <Clock className="w-4 h-4" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredCohorts = cohorts.filter((cohort) => {
    const matchesSearch =
      cohort.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cohort.course.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-muted-foreground">{isArabic ? 'جاري التحميل...' : 'Loading cohorts...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      {/* YouTube Studio Header - Standalone */}
      <header className="sticky top-0 z-50 bg-white dark:bg-card border-b border-slate-200 dark:border-border shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            {/* Back and Home buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-slate-100 dark:hover:bg-accent rounded-full transition-colors"
                title={isArabic ? 'رجوع' : 'Back'}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push(`/${locale}`)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-accent rounded-full transition-colors"
                title={isArabic ? 'الصفحة الرئيسية' : 'Home'}
              >
                <Home className="w-5 h-5" />
              </button>
            </div>

            <div className="h-8 w-px bg-slate-300 dark:bg-border" />

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
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isArabic ? 'إنشاء مجموعة' : 'Create Cohort'}
            </Button>
            
            <button 
              className="relative p-2 hover:bg-accent rounded-full transition-colors"
              title={isArabic ? 'الرسائل' : 'Messages'}
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
        {/* Sidebar - YouTube Studio Style */}
        <aside className="w-64 min-h-screen bg-white dark:bg-card border-r border-slate-200 dark:border-border sticky top-16 shadow-sm">
          <nav className="p-4 space-y-1">
            <button
              onClick={() => {
                setNavigating(true);
                router.push(`/${locale}/creator/dashboard`);
              }}
              disabled={navigating}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-slate-600 dark:text-muted-foreground hover:bg-slate-50 dark:hover:bg-accent/50"
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
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-slate-600 dark:text-muted-foreground hover:bg-slate-50 dark:hover:bg-accent/50"
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
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-slate-600 dark:text-muted-foreground hover:bg-slate-50 dark:hover:bg-accent/50"
            >
              <TrendingUp className="w-5 h-5" />
              <span>{isArabic ? 'التحليلات' : 'Analytics'}</span>
            </button>

            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all bg-slate-100 dark:bg-accent text-slate-900 dark:text-foreground font-semibold"
            >
              <Users className="w-5 h-5" />
              <span>{isArabic ? 'المجموعات التعليمية' : 'Cohorts'}</span>
            </button>

            <div className="h-px bg-slate-200 dark:bg-border my-4" />

            <button
              onClick={() => {
                setNavigating(true);
                router.push(`/${locale}/creator/settings`);
              }}
              disabled={navigating}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-muted-foreground hover:bg-slate-50 dark:hover:bg-accent/50 transition-all"
            >
              <Settings className="w-5 h-5" />
              <span>{isArabic ? 'الإعدادات' : 'Settings'}</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 bg-slate-50 dark:bg-background">
          <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Cohort Management</h1>
            <p className="text-slate-600 dark:text-gray-300">Manage group-based learning experiences</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Cohort
          </motion.button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-slate-200 dark:border-white/20 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                {stats.totalCohorts}
              </h3>
              <p className="text-slate-600 dark:text-gray-300 text-sm">Total Cohorts</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-slate-200 dark:border-white/20 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                {stats.activeCohorts}
              </h3>
              <p className="text-slate-600 dark:text-gray-300 text-sm">Active Cohorts</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-slate-200 dark:border-white/20 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                {stats.upcomingCohorts}
              </h3>
              <p className="text-slate-600 dark:text-gray-300 text-sm">Upcoming Cohorts</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-slate-200 dark:border-white/20 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                {stats.totalMembers}
              </h3>
              <p className="text-slate-600 dark:text-gray-300 text-sm">Total Members</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-slate-200 dark:border-white/20 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                {stats.totalSessions}
              </h3>
              <p className="text-slate-600 dark:text-gray-300 text-sm">Total Sessions</p>
            </motion.div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-slate-200 dark:border-white/20 shadow-sm">
          <div className="flex gap-2 flex-wrap">
            {['all', 'active', 'upcoming', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/20'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search cohorts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-white/10 border border-slate-300 dark:border-white/20 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Cohorts Grid */}
        {filteredCohorts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-slate-200 dark:border-white/20 shadow-sm text-center"
          >
            <Users className="w-16 h-16 text-slate-400 dark:text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Cohorts Found</h3>
            <p className="text-slate-600 dark:text-gray-300 mb-6">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Create your first cohort to start group-based learning'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
            >
              Create First Cohort
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCohorts.map((cohort, index) => (
              <motion.div
                key={cohort.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-slate-200 dark:border-white/20 hover:border-purple-500/50 shadow-sm hover:shadow-md transition-all group"
              >
                {/* Course Thumbnail */}
                <div className="relative h-40 bg-gradient-to-br from-purple-600 to-pink-600">
                  {cohort.course.thumbnail ? (
                    <Image
                      src={cohort.course.thumbnail}
                      alt={cohort.course.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Users className="w-16 h-16 text-white/50" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <div
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(
                        cohort.currentStatus
                      )}`}
                    >
                      {getStatusIcon(cohort.currentStatus)}
                      {cohort.currentStatus}
                    </div>
                  </div>

                  {/* Full Badge */}
                  {cohort.isFull && (
                    <div className="absolute top-3 right-3">
                      <div className="px-3 py-1 bg-red-500 rounded-full text-xs font-semibold text-white">
                        FULL
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {/* Cohort Name */}
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">
                    {cohort.name}
                  </h3>

                  {/* Course Title */}
                  <p className="text-sm text-slate-600 dark:text-gray-300 mb-4 line-clamp-1">
                    📚 {cohort.course.title}
                  </p>

                  {/* Progress Bar */}
                  {cohort.currentStatus === 'ACTIVE' && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500 dark:text-gray-400">Progress</span>
                        <span className="text-xs text-slate-900 dark:text-white font-semibold">
                          {cohort.progressPercent}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                          style={{ width: `${cohort.progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {cohort._count.members}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-gray-400">Members</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {cohort._count.sessions}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-gray-400">Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {cohort.daysRemaining !== null ? cohort.daysRemaining : '-'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-gray-400">Days Left</div>
                    </div>
                  </div>

                  {/* Occupancy */}
                  {cohort.occupancyPercent !== null && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500 dark:text-gray-400">Occupancy</span>
                        <span className="text-xs text-slate-900 dark:text-white font-semibold">
                          {cohort._count.members} / {cohort.maxMembers}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            cohort.occupancyPercent >= 90
                              ? 'bg-gradient-to-r from-red-500 to-orange-500'
                              : cohort.occupancyPercent >= 70
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                              : 'bg-gradient-to-r from-green-500 to-emerald-500'
                          }`}
                          style={{ width: `${cohort.occupancyPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="text-xs text-slate-500 dark:text-gray-400 mb-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Start: {new Date(cohort.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>
                        End: {new Date(cohort.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/creator/cohorts/${cohort.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Link>
                    <button
                      onClick={() => {
                        setSelectedCohort(cohort);
                        setShowDeleteModal(true);
                      }}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Modal Placeholder */}
        <CreateCohortModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchCohorts}
        />

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && selectedCohort && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 max-w-md w-full border border-red-500/50 shadow-xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-red-500/20 rounded-xl">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Delete Cohort?</h2>
                </div>
                <p className="text-slate-600 dark:text-gray-300 mb-6">
                  Are you sure you want to delete <strong>{selectedCohort.name}</strong>?
                  This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-6 py-3 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-white/20 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteCohort}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
